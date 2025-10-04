# app.rb
# NASA TEMPO Air Quality Monitoring Backend
# Comprehensive API for React frontend

require 'sinatra'
require 'sinatra/json'
require 'sinatra/namespace'
require 'json'
require 'http'
require 'dotenv/load'
require 'active_record'
require 'rack/cors'
require 'time'

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

# API Keys
OPENAQ_KEY = ENV['OPENAQ_API_KEY']
NASA_TOKEN = ENV['NASA_EARTHDATA_TOKEN']
WEATHER_API_KEY = ENV['WEATHER_API_KEY']

# Helper methods
helpers do
  def json_params
    JSON.parse(request.body.read) rescue {}
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
      query_params = {
        limit: limit,
        radius: radius,
        coordinates: "#{lat},#{lon}"
      }
      
      response = HTTP.headers("X-API-Key" => OPENAQ_KEY)
                     .get(url, params: query_params)
      data = JSON.parse(response.to_s)

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

  # Get specific pollutant measurements
  get '/air-quality/:pollutant' do
    pollutant = params['pollutant']
    lat = params['lat']
    lon = params['lon']
    limit = params['limit'] || 100
    radius = params['radius'] || 25000

    begin
      url = "https://api.openaq.org/v3/measurements"
      query_params = {
        parameter: pollutant,
        limit: limit,
        radius: radius,
        coordinates: "#{lat},#{lon}"
      }

      response = HTTP.headers("X-API-Key" => OPENAQ_KEY)
                     .get(url, params: query_params)
      data = JSON.parse(response.to_s)

      measurements = data['results']&.map do |m|
        aqi = calculate_aqi(pollutant, m['value'])
        {
          locationId: m['locationId'],
          location: m['location'],
          city: m['city'],
          country: m['country'],
          coordinates: m['coordinates'],
          value: m['value'],
          unit: m['unit'],
          date: m['date'],
          aqi: aqi,
          category: aqi ? aqi_category(aqi) : nil
        }
      end || []

      # Store in database
      measurements.each do |m|
        AirQualityReading.create(
          pollutant: pollutant,
          value: m[:value],
          unit: m[:unit],
          latitude: m[:coordinates]&.dig('latitude'),
          longitude: m[:coordinates]&.dig('longitude'),
          location_name: m[:location],
          city: m[:city],
          country: m[:country],
          measured_at: m[:date]&.dig('utc'),
          aqi: m[:aqi]
        ) rescue nil
      end

      json({
        status: 'ok',
        pollutant: pollutant,
        count: measurements.length,
        results: measurements
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end

  # Get NASA TEMPO satellite data
  get '/tempo' do
    lat = params['lat']
    lon = params['lon']
    
    begin
      # NASA TEMPO data access (placeholder - actual implementation depends on NASA API)
      # TEMPO provides NO2, O3, HCHO, aerosols
      
      # For now, we'll aggregate OpenAQ data as a proxy
      # In production, integrate with NASA Earthdata API
      
      pollutants = ['no2', 'o3', 'pm25']
      tempo_data = {}
      
      pollutants.each do |pollutant|
        url = "https://api.openaq.org/v3/measurements"
        query_params = {
          parameter: pollutant,
          limit: 10,
          radius: 50000,
          coordinates: "#{lat},#{lon}"
        }

        response = HTTP.headers("X-API-Key" => OPENAQ_KEY)
                       .get(url, params: query_params)
        data = JSON.parse(response.to_s)
        
        if data['results'] && data['results'].any?
          avg_value = data['results'].map { |r| r['value'] }.compact.sum / data['results'].length.to_f
          tempo_data[pollutant] = {
            value: avg_value.round(2),
            unit: data['results'].first['unit'],
            aqi: calculate_aqi(pollutant, avg_value),
            measurements_count: data['results'].length
          }
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

    begin
      # Fetch from database
      start_date = Time.now - (days * 24 * 60 * 60)
      
      readings = AirQualityReading
        .where(pollutant: pollutant)
        .where('measured_at >= ?', start_date)
        .order(measured_at: :asc)

      # If lat/lon provided, filter by proximity
      if lat && lon
        readings = readings.where(
          'latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
          lat.to_f - 0.5, lat.to_f + 0.5,
          lon.to_f - 0.5, lon.to_f + 0.5
        )
      end

      # Group by hour for cleaner graphs
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

  # Get weather data (integrates with air quality)
  get '/weather' do
    lat = params['lat']
    lon = params['lon']

    begin
      url = "https://api.openweathermap.org/data/2.5/weather"
      response = HTTP.get(url, params: {
        lat: lat,
        lon: lon,
        appid: WEATHER_API_KEY,
        units: 'metric'
      })
      
      data = JSON.parse(response.to_s)
      
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

  # Predict dangerous pollution zones
  post '/predictions/danger-zones' do
    data = json_params
    lat = data['lat']
    lon = data['lon']
    hours_ahead = data['hours'] || 24

    begin
      # Simple prediction based on historical trends and weather
      # In production, use ML model trained on combined datasets
      
      recent_readings = AirQualityReading
        .where('measured_at >= ?', Time.now - 24*60*60)
        .where(
          'latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
          lat.to_f - 1, lat.to_f + 1,
          lon.to_f - 1, lon.to_f + 1
        )

      if recent_readings.any?
        avg_aqi = recent_readings.map(&:aqi).compact.sum / recent_readings.length.to_f
        trend = calculate_trend(recent_readings)
        
        predicted_aqi = (avg_aqi + trend * hours_ahead).round
        
        json({
          status: 'ok',
          location: { lat: lat, lon: lon },
          prediction: {
            hours_ahead: hours_ahead,
            predicted_aqi: predicted_aqi,
            category: aqi_category(predicted_aqi),
            confidence: 0.75, # Placeholder
            factors: identify_pollution_factors(lat, lon)
          }
        })
      else
        json({
          status: 'ok',
          message: 'Insufficient data for prediction',
          prediction: nil
        })
      end
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end

  # Health prediction based on symptoms
  post '/predictions/health' do
    data = json_params
    symptoms = data['symptoms'] || []
    exposure_level = data['exposure_level']

    begin
      # Simple ML-based health prediction
      # In production, use trained model
      
      risk_score = 0
      
      # Symptom scoring
      high_risk_symptoms = ['shortness of breath', 'chest pain', 'severe cough']
      moderate_risk_symptoms = ['cough', 'throat irritation', 'eye irritation', 'headache']
      
      symptoms.each do |symptom|
        if high_risk_symptoms.any? { |s| symptom.downcase.include?(s) }
          risk_score += 30
        elsif moderate_risk_symptoms.any? { |s| symptom.downcase.include?(s) }
          risk_score += 15
        end
      end
      
      # Exposure level impact
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

  # =============================================================================
  # USER TRACKING ENDPOINTS
  # =============================================================================

  # Create/update user
  post '/users' do
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

  # Track user exposure (like fitness tracker)
  post '/users/:id/exposure' do
    user = User.find(params['id'])
    data = json_params
    
    begin
      exposure = UserExposure.create(
        user_id: user.id,
        pollutant: data['pollutant'],
        value: data['value'],
        duration_minutes: data['duration_minutes'],
        latitude: data['lat'],
        longitude: data['lon'],
        recorded_at: Time.now
      )
      
      # Update cumulative exposure
      user.update_cumulative_exposure!
      
      json({
        status: 'ok',
        exposure: {
          id: exposure.id,
          pollutant: exposure.pollutant,
          value: exposure.value,
          duration_minutes: exposure.duration_minutes
        },
        cumulative_exposure: user.cumulative_exposure,
        daily_exposure: user.daily_exposure
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end

  # Get user's exposure history
  get '/users/:id/exposure' do
    user = User.find(params['id'])
    days = (params['days'] || 7).to_i
    
    begin
      exposures = user.exposures
        .where('recorded_at >= ?', Time.now - days*24*60*60)
        .order(recorded_at: :desc)
      
      daily_totals = exposures.group_by { |e| e.recorded_at.to_date }
                              .map do |date, records|
        {
          date: date.iso8601,
          total_exposure: records.sum(&:value),
          duration_minutes: records.sum(&:duration_minutes),
          pollutants: records.group_by(&:pollutant).transform_values { |v| v.sum(&:value) }
        }
      end
      
      json({
        status: 'ok',
        user_id: user.id,
        cumulative_exposure: user.cumulative_exposure,
        daily_data: daily_totals
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end

  # =============================================================================
  # ALERT ENDPOINTS
  # =============================================================================

  # Get active alerts for location
  get '/alerts' do
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

  # Subscribe user to alerts
  post '/alerts/subscribe' do
    data = json_params
    
    begin
      user = User.find(data['user_id'])
      user.update(
        alert_threshold: data['threshold'] || 100,
        notification_preferences: data['notification_preferences']
      )
      
      json({
        status: 'ok',
        message: 'Successfully subscribed to alerts',
        user_id: user.id
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end

  # Get browser notification payload for alert
  get '/alerts/:id/notification' do
    begin
      alert = Alert.find(params['id'])
      notification_service = NotificationService.new
      
      json({
        status: 'ok',
        notification: notification_service.browser_notification_payload(alert)
      })
    rescue => e
      status 500
      json({ status: 'error', message: e.message })
    end
  end

  # Send test notification
  post '/alerts/test' do
    data = json_params
    
    begin
      notification_service = NotificationService.new
      
      # Create test alert
      test_alert = Alert.new(
        severity: 'moderate',
        pollutant: 'pm25',
        aqi: 155,
        latitude: data['lat'] || 40.7128,
        longitude: data['lon'] || -74.0060,
        message: 'Test alert: Moderate air quality levels detected',
        active: true
      )
      
      payload = notification_service.browser_notification_payload(test_alert)
      
      json({
        status: 'ok',
        message: 'Test notification created',
        notification: payload
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

def calculate_trend(readings)
  return 0 if readings.length < 2
  
  sorted = readings.sort_by(&:measured_at)
  recent = sorted.last(10)
  
  if recent.length >= 2
    first_half = recent.first(recent.length/2).map(&:aqi).compact.sum / (recent.length/2).to_f
    second_half = recent.last(recent.length/2).map(&:aqi).compact.sum / (recent.length/2).to_f
    (second_half - first_half) / (recent.length/2).to_f
  else
    0
  end
end

def identify_pollution_factors(lat, lon)
  # Placeholder - in production, analyze traffic, industrial zones, fires, etc.
  factors = []
  
  # Check time of day for traffic
  hour = Time.now.hour
  if hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19
    factors << { factor: 'Rush hour traffic', impact: 'high' }
  end
  
  # Check for industrial zones (would need dataset)
  # Check for forest fires (would need NASA FIRMS data)
  
  factors
end

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