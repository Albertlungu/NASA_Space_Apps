# app.rb
# NASA TEMPO Air Quality Monitoring Backend
# Comprehensive API for React frontend

require 'sinatra'
require 'sinatra/json'
require 'sinatra/namespace'
require 'json'
require 'httparty'
require 'dotenv/load'
require 'rack/cors'
require 'time'

# Try to load ActiveRecord, but continue without it if it fails
DB_ENABLED = begin
  require 'active_record'
  
  # Database setup
  ActiveRecord::Base.establish_connection(
    adapter: 'sqlite3',
    database: 'db/development.sqlite3'
  )
  
  # Load models
  require_relative 'models/user'
  require_relative 'models/air_quality_reading'
  require_relative 'models/user_exposure'
  require_relative 'models/alert'
  
  # Load services
  require_relative 'services/notification_service'
  
  puts "✓ Database connection established"
  true
rescue LoadError => e
  puts "⚠ Running without database support: #{e.message}"
  puts "⚠ User tracking, alerts, and historical data features will be limited"
  false
rescue => e
  puts "⚠ Database error: #{e.message}"
  false
end

# CORS configuration for React frontend
use Rack::Cors do
  allow do
    origins ENV['FRONTEND_URL'] || 'http://localhost:3000'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options],
      credentials: true
  end
end

# API Keys
OPENAQ_KEY = ENV['OPENAQ_API_KEY']
NASA_TOKEN = ENV['NASA_EARTHDATA_TOKEN']
WEATHER_API_KEY = ENV['WEATHER_API_KEY']

# In-memory storage when database is not available
IN_MEMORY_STORAGE = {
  readings: [],
  users: {},
  exposures: [],
  alerts: []
}

# Helper methods
helpers do
  def json_params
    JSON.parse(request.body.read) rescue {}
  end

  def db_safe_store_reading(reading_data)
    return unless DB_ENABLED
    begin
      AirQualityReading.create(reading_data)
    rescue => e
      puts "Failed to store reading: #{e.message}"
    end
  end

  def db_safe_get_readings(conditions)
    if DB_ENABLED
      begin
        return AirQualityReading.where(conditions)
      rescue => e
        puts "Failed to fetch readings: #{e.message}"
      end
    end
    # Return empty array or in-memory data
    []
  end

  def calculate_aqi(pollutant, value)
    # Simplified AQI calculation (US EPA standard)
    case pollutant.downcase
    when 'pm25', 'pm2.5'
      calculate_pm25_aqi(value)
    when 'pm10'
      calculate_pm10_aqi(value)
    when 'no2'
      calculate_no2_aqi(value)
    when 'o3', 'ozone'
      calculate_o3_aqi(value)
    when 'so2'
      calculate_so2_aqi(value)
    when 'co'
      calculate_co_aqi(value)
    else
      nil
    end
  end

  def calculate_pm25_aqi(concentration)
    breakpoints = [
      [0.0, 12.0, 0, 50],
      [12.1, 35.4, 51, 100],
      [35.5, 55.4, 101, 150],
      [55.5, 150.4, 151, 200],
      [150.5, 250.4, 201, 300],
      [250.5, 500.4, 301, 500]
    ]
    linear_aqi(concentration, breakpoints)
  end

  def calculate_pm10_aqi(concentration)
    breakpoints = [
      [0, 54, 0, 50],
      [55, 154, 51, 100],
      [155, 254, 101, 150],
      [255, 354, 151, 200],
      [355, 424, 201, 300],
      [425, 604, 301, 500]
    ]
    linear_aqi(concentration, breakpoints)
  end

  def calculate_no2_aqi(concentration)
    # NO2 in ppb
    breakpoints = [
      [0, 53, 0, 50],
      [54, 100, 51, 100],
      [101, 360, 101, 150],
      [361, 649, 151, 200],
      [650, 1249, 201, 300],
      [1250, 2049, 301, 500]
    ]
    linear_aqi(concentration, breakpoints)
  end

  def calculate_o3_aqi(concentration)
    # O3 in ppb (8-hour average)
    breakpoints = [
      [0, 54, 0, 50],
      [55, 70, 51, 100],
      [71, 85, 101, 150],
      [86, 105, 151, 200],
      [106, 200, 201, 300]
    ]
    linear_aqi(concentration, breakpoints)
  end

  def calculate_so2_aqi(concentration)
    # SO2 in ppb
    breakpoints = [
      [0, 35, 0, 50],
      [36, 75, 51, 100],
      [76, 185, 101, 150],
      [186, 304, 151, 200],
      [305, 604, 201, 300],
      [605, 1004, 301, 500]
    ]
    linear_aqi(concentration, breakpoints)
  end

  def calculate_co_aqi(concentration)
    # CO in ppm
    breakpoints = [
      [0.0, 4.4, 0, 50],
      [4.5, 9.4, 51, 100],
      [9.5, 12.4, 101, 150],
      [12.5, 15.4, 151, 200],
      [15.5, 30.4, 201, 300],
      [30.5, 50.4, 301, 500]
    ]
    linear_aqi(concentration, breakpoints)
  end

  def linear_aqi(concentration, breakpoints)
    breakpoints.each do |bp_lo, bp_hi, aqi_lo, aqi_hi|
      if concentration >= bp_lo && concentration <= bp_hi
        return ((aqi_hi - aqi_lo) / (bp_hi - bp_lo) * (concentration - bp_lo) + aqi_lo).round
      end
    end
    500 # Hazardous
  end

  def aqi_category(aqi)
    case aqi
    when 0..50 then { level: 'Good', color: '#00e400', description: 'Air quality is satisfactory' }
    when 51..100 then { level: 'Moderate', color: '#ffff00', description: 'Acceptable for most people' }
    when 101..150 then { level: 'Unhealthy for Sensitive Groups', color: '#ff7e00', description: 'Sensitive groups may experience health effects' }
    when 151..200 then { level: 'Unhealthy', color: '#ff0000', description: 'Everyone may begin to experience health effects' }
    when 201..300 then { level: 'Very Unhealthy', color: '#8f3f97', description: 'Health alert: everyone may experience serious effects' }
    else { level: 'Hazardous', color: '#7e0023', description: 'Health warnings of emergency conditions' }
    end
  end
end

# =============================================================================
# ROUTES
# =============================================================================

# Root test route
get '/' do
  json({
    message: 'NASA TEMPO Air Quality API 🚀',
    version: '1.0.0',
    database_enabled: DB_ENABLED,
    endpoints: {
      air_quality: '/api/air-quality',
      tempo: '/api/tempo',
      historical: '/api/historical',
      predictions: '/api/predictions',
      users: '/api/users',
      alerts: '/api/alerts'
    }
  })
end

# =============================================================================
# AIR QUALITY ENDPOINTS
# =============================================================================

namespace '/api' do
  # Get real-time air quality data from multiple sources
  get '/air-quality' do
    lat = params['lat']
    lon = params['lon']
    radius = params['radius'] || 25000 # meters
    limit = params['limit'] || 100

    begin
      # Fetch from OpenAQ
      url = "https://api.openaq.org/v3/locations"
      
      response = HTTParty.get(url,
        headers: { "X-API-Key" => OPENAQ_KEY },
        query: {
          limit: limit,
          radius: radius,
          coordinates: "#{lat},#{lon}"
        }
      )
      
      data = response.parsed_response

      # Get latest measurements for each location
      locations = data['results']&.map do |location|
        {
          id: location['id'],
          name: location['name'],
          city: location['city'],
          country: location['country'],
          coordinates: location['coordinates'],
          parameters: location['parameters'],
          lastUpdated: location['lastUpdated']
        }
      end || []

      json({
        status: 'ok',
        count: locations.length,
        results: locations
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end

  # Get specific pollutant measurements using OpenAQ v3 latest endpoint
  get '/air-quality/:pollutant' do
    pollutant = params['pollutant']
    lat = params['lat']
    lon = params['lon']
    limit = params['limit'] || 100
    radius = params['radius'] || 25000

    begin
      # Map pollutant names to OpenAQ parameter IDs
      parameter_map = {
        'pm25' => 2, 'pm2.5' => 2,
        'pm10' => 1,
        'o3' => 7, 'ozone' => 7,
        'no2' => 3,
        'so2' => 4,
        'co' => 5
      }
      
      param_id = parameter_map[pollutant.downcase]
      
      unless param_id
        return json({
          status: 'error',
          message: "Unsupported pollutant: #{pollutant}. Supported: #{parameter_map.keys.join(', ')}"
        })
      end

      # Use the latest endpoint which works with coordinates
      url = "https://api.openaq.org/v3/parameters/#{param_id}/latest"
      
      response = HTTParty.get(url,
        headers: { "X-API-Key" => OPENAQ_KEY },
        query: {
          limit: limit,
          radius: radius,
          coordinates: "#{lon},#{lat}" # Note: OpenAQ uses lon,lat order
        }
      )
      
      data = response.parsed_response

      measurements = data['results']&.map do |m|
        value = m['value']
        coords = m['coordinates']
        
        aqi = calculate_aqi(pollutant, value) if value
        {
          locationId: m['locationsId'],
          sensorId: m['sensorsId'],
          location: nil, # Not provided in latest endpoint
          city: nil,
          country: nil,
          coordinates: coords,
          value: value,
          unit: 'µg/m³', # Standard unit for PM2.5
          date: m['datetime'],
          aqi: aqi,
          category: aqi ? aqi_category(aqi) : nil
        }
      end || []

      # Store in database if available
      if DB_ENABLED && measurements.any?
        measurements.each do |m|
          next unless m[:value]
          db_safe_store_reading(
            pollutant: pollutant,
            value: m[:value],
            unit: m[:unit],
            latitude: m[:coordinates]&.dig(:latitude),
            longitude: m[:coordinates]&.dig(:longitude),
            location_name: m[:location],
            city: m[:city],
            country: m[:country],
            measured_at: m[:date],
            aqi: m[:aqi]
          )
        end
      end

      json({
        status: 'ok',
        pollutant: pollutant,
        count: measurements.length,
        results: measurements
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message, backtrace: e.backtrace[0..2] })
    end
  end

  # Get NASA TEMPO satellite data
  get '/tempo' do
    lat = params['lat']
    lon = params['lon']
    
    begin
      pollutants = ['no2', 'o3', 'pm25']
      tempo_data = {}
      
      pollutants.each do |pollutant|
        # Map to OpenAQ parameter IDs
        param_map = {'no2' => 3, 'o3' => 7, 'pm25' => 2}
        param_id = param_map[pollutant]
        next unless param_id
        
        url = "https://api.openaq.org/v3/parameters/#{param_id}/latest"
        
        response = HTTParty.get(url,
          headers: { "X-API-Key" => OPENAQ_KEY },
          query: {
            limit: 10,
            radius: 50000,
            coordinates: "#{lon},#{lat}" # lon,lat order for OpenAQ
          }
        )
        
        data = response.parsed_response
        
        if data['results'] && data['results'].any?
          values = data['results'].map { |r| r.dig('summary', 'mean') || r['value'] }.compact
          if values.any?
            avg_value = values.sum / values.length.to_f
            tempo_data[pollutant] = {
              value: avg_value.round(2),
              unit: data['results'].first['unit'],
              aqi: calculate_aqi(pollutant, avg_value),
              measurements_count: values.length
            }
          end
        end
      end

      json({
        status: 'ok',
        location: { lat: lat, lon: lon },
        timestamp: Time.now.utc.iso8601,
        data: tempo_data
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end

  # Get historical trends for graphs
  get '/historical' do
    pollutant = params['pollutant'] || 'no2'
    lat = params['lat']
    lon = params['lon']
    days = (params['days'] || 7).to_i

    unless DB_ENABLED
      return json({
        status: 'error',
        message: 'Historical data requires database support. Please fix Ruby/SQLite compatibility.'
      })
    end

    begin
      start_date = Time.now - (days * 24 * 60 * 60)
      
      readings = AirQualityReading
        .where(pollutant: pollutant)
        .where('measured_at >= ?', start_date)
        .order(measured_at: :asc)

      if lat && lon
        readings = readings.where(
          'latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
          lat.to_f - 0.5, lat.to_f + 0.5,
          lon.to_f - 0.5, lon.to_f + 0.5
        )
      end

      hourly_data = readings.group_by { |r| r.measured_at.beginning_of_hour }
                           .map do |hour, records|
        avg_value = records.map(&:value).sum / records.length.to_f
        {
          timestamp: hour.iso8601,
          value: avg_value.round(2),
          aqi: calculate_aqi(pollutant, avg_value),
          count: records.length
        }
      end

      json({
        status: 'ok',
        pollutant: pollutant,
        days: days,
        data_points: hourly_data.length,
        data: hourly_data
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end

  # Get weather data
  get '/weather' do
    lat = params['lat']
    lon = params['lon']

    begin
      url = "https://api.openweathermap.org/data/2.5/weather"
      
      response = HTTParty.get(url,
        query: {
          lat: lat,
          lon: lon,
          appid: WEATHER_API_KEY,
          units: 'metric'
        }
      )
      
      data = response.parsed_response
      
      json({
        status: 'ok',
        weather: {
          temperature: data['main']['temp'],
          humidity: data['main']['humidity'],
          pressure: data['main']['pressure'],
          wind_speed: data['wind']['speed'],
          wind_direction: data['wind']['deg'],
          description: data['weather'].first['description'],
          icon: data['weather'].first['icon']
        }
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end

  # =============================================================================
  # PREDICTION ENDPOINTS
  # =============================================================================

  # Health prediction based on symptoms
  post '/predictions/health' do
    data = json_params
    symptoms = data['symptoms'] || []
    exposure_level = data['exposure_level']

    begin
      risk_score = 0
      
      high_risk_symptoms = ['shortness of breath', 'chest pain', 'severe cough']
      moderate_risk_symptoms = ['cough', 'throat irritation', 'eye irritation', 'headache']
      
      symptoms.each do |symptom|
        if high_risk_symptoms.any? { |s| symptom.downcase.include?(s) }
          risk_score += 30
        elsif moderate_risk_symptoms.any? { |s| symptom.downcase.include?(s) }
          risk_score += 15
        end
      end
      
      risk_score += exposure_level.to_i / 10 if exposure_level
      risk_score = [risk_score, 100].min
      
      recommendations = generate_health_recommendations(risk_score, symptoms)
      
      json({
        status: 'ok',
        risk_score: risk_score,
        risk_level: risk_score < 30 ? 'Low' : risk_score < 60 ? 'Moderate' : 'High',
        recommendations: recommendations,
        should_seek_medical_attention: risk_score > 70
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end

  # Database-dependent endpoints with graceful degradation
  post '/users' do
    unless DB_ENABLED
      return json({ status: 'error', message: 'User tracking requires database support' })
    end

    data = json_params
    begin
      user = User.find_or_create_by(email: data['email']) do |u|
        u.name = data['name']
        u.phone = data['phone']
        u.notification_preferences = data['notification_preferences']
      end
      
      user.update(
        name: data['name'],
        phone: data['phone'],
        notification_preferences: data['notification_preferences']
      )
      
      json({
        status: 'ok',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          cumulative_exposure: user.cumulative_exposure
        }
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end

  get '/alerts' do
    unless DB_ENABLED
      return json({ status: 'ok', count: 0, alerts: [], message: 'Alerts require database support' })
    end

    lat = params['lat']
    lon = params['lon']
    
    begin
      alerts = Alert
        .where(active: true)
        .where(
          'latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
          lat.to_f - 0.5, lat.to_f + 0.5,
          lon.to_f - 0.5, lon.to_f + 0.5
        )
        .order(created_at: :desc)
      
      json({
        status: 'ok',
        count: alerts.length,
        alerts: alerts.map do |alert|
          {
            id: alert.id,
            severity: alert.severity,
            pollutant: alert.pollutant,
            aqi: alert.aqi,
            message: alert.message,
            location: { lat: alert.latitude, lon: alert.longitude },
            created_at: alert.created_at.iso8601
          }
        end
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end
end

# =============================================================================
# HELPER METHODS
# =============================================================================

def generate_health_recommendations(risk_score, symptoms)
  recommendations = []
  
  if risk_score < 30
    recommendations << "Continue normal outdoor activities"
    recommendations << "Stay hydrated"
  elsif risk_score < 60
    recommendations << "Limit prolonged outdoor exertion"
    recommendations << "Consider wearing a mask outdoors"
    recommendations << "Keep windows closed"
  else
    recommendations << "Avoid outdoor activities"
    recommendations << "Stay indoors with air purification if possible"
    recommendations << "Wear N95 mask if you must go outside"
    recommendations << "Monitor symptoms closely"
  end
  
  if symptoms.any? { |s| s.downcase.include?('breath') || s.downcase.include?('chest') }
    recommendations << "⚠️ Seek medical attention if symptoms worsen"
  end
  
  recommendations
end