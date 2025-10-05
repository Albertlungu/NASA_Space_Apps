# ML-based Air Quality Predictor
# Uses OpenAQ + WeatherAPI + local database for predictions
require 'httparty'
require 'json'

class MLPredictorService
  WEATHERAPI_KEY = ENV['WEATHERAPI_KEY'] || ENV['WEATHER_API_KEY']
  WEATHERAPI_BASE = "http://api.weatherapi.com/v1"
  
  def initialize(lat:, lon:, pollutant: 'pm25', hours_back: 48)
    @lat = lat
    @lon = lon
    @pollutant = pollutant
    @hours_back = hours_back
  end
  
  # Main prediction method
  def predict
    # 1. Get historical data from local database
    historical = fetch_local_historical
    
    if historical.empty?
      return error_response("No historical data available")
    end
    
    # 2. Get weather data (optional)
    weather = fetch_weather_data
    
    # 3. Build features and make prediction
    prediction = simple_ml_predict(historical, weather)
    
    {
      status: 'ok',
      prediction: prediction,
      model: 'exponential_smoothing',
      confidence: calculate_confidence(historical),
      historical_avg: calculate_average(historical),
      features_used: ['historical_trend', 'weather_conditions', 'time_of_day']
    }
  rescue => e
    error_response(e.message)
  end
  
  private
  
  def fetch_local_historical
    start_time = Time.now - (@hours_back * 3600)
    
    # Try with location filter first (within 50km ~ 0.5 degrees)
    readings = AirQualityReading
      .where(pollutant: @pollutant)
      .where('measured_at >= ?', start_time)
      .where(
        'latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
        @lat - 0.5, @lat + 0.5,
        @lon - 0.5, @lon + 0.5
      )
      .order(measured_at: :asc)
      .to_a
    
    # If no local data, expand search to wider area (500km ~ 5 degrees)
    if readings.empty?
      readings = AirQualityReading
        .where(pollutant: @pollutant)
        .where('measured_at >= ?', start_time)
        .where(
          'latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
          @lat - 5.0, @lat + 5.0,
          @lon - 5.0, @lon + 5.0
        )
        .order(measured_at: :asc)
        .limit(500)
        .to_a
    end
    
    # If still no data, use any available data for this pollutant
    if readings.empty?
      readings = AirQualityReading
        .where(pollutant: @pollutant)
        .where('measured_at >= ?', start_time)
        .order(measured_at: :asc)
        .limit(500)
        .to_a
    end
    
    readings.map do |r|
      {
        timestamp: r.measured_at,
        value: r.value,
        aqi: r.aqi,
        hour: r.measured_at.hour
      }
    end
  end
  
  def fetch_weather_data
    return nil unless WEATHERAPI_KEY
    
    url = "#{WEATHERAPI_BASE}/forecast.json"
    q = "#{@lat},#{@lon}"
    
    response = HTTParty.get(url, query: {
      key: WEATHERAPI_KEY,
      q: q,
      days: 2,
      aqi: 'yes'
    }, timeout: 10)
    
    return nil unless response.code == 200
    
    data = JSON.parse(response.body)
    
    # Extract current and forecast
    {
      current: {
        temp_c: data.dig('current', 'temp_c'),
        humidity: data.dig('current', 'humidity'),
        wind_kph: data.dig('current', 'wind_kph'),
        cloud: data.dig('current', 'cloud'),
        condition: data.dig('current', 'condition', 'text')
      },
      forecast: extract_hourly_forecast(data)
    }
  rescue => e
    puts "Weather API error: #{e.message}"
    nil
  end
  
  def extract_hourly_forecast(weather_data)
    hours = []
    
    weather_data.dig('forecast', 'forecastday')&.each do |day|
      day['hour']&.each do |h|
        hours << {
          time: Time.parse(h['time']),
          temp_c: h['temp_c'],
          humidity: h['humidity'],
          wind_kph: h['wind_kph'],
          precip_mm: h['precip_mm'],
          cloud: h['cloud'],
          condition: h.dig('condition', 'text')
        }
      end
    end
    
    hours
  end
  
  def simple_ml_predict(historical, weather)
    # Use exponential smoothing for prediction
    recent = historical.last(24)
    values = recent.map { |h| h[:value] }
    
    return nil if values.empty?
    
    # Exponential smoothing
    alpha = 0.3
    smoothed = values.first
    
    values.each do |val|
      smoothed = alpha * val + (1 - alpha) * smoothed
    end
    
    # Adjust for time of day pattern
    current_hour = Time.now.hour
    hour_factor = time_of_day_factor(current_hour, historical)
    
    # Adjust for weather (if available)
    weather_factor = 1.0
    if weather && weather[:current][:temp_c]
      # Higher temp and humidity slightly increase PM2.5
      temp_effect = (weather[:current][:temp_c] - 20) * 0.01
      humidity_effect = (weather[:current][:humidity] - 50) * 0.005
      weather_factor = 1.0 + temp_effect + humidity_effect
    end
    
    predicted_value = smoothed * hour_factor * weather_factor
    predicted_aqi = calculate_pm25_aqi(predicted_value)
    
    # Generate next 24 hours predictions
    predictions = []
    24.times do |h|
      future_hour = (current_hour + h) % 24
      future_factor = time_of_day_factor(future_hour, historical)
      future_value = smoothed * future_factor * weather_factor
      future_aqi = calculate_pm25_aqi(future_value)
      
      predictions << {
        hours_ahead: h,
        hour: future_hour,
        predicted_value: future_value.round(2),
        predicted_aqi: future_aqi,
        confidence: [100 - (h * 3), 50].max # Decreases with time
      }
    end
    
    {
      next_hour: {
        value: predicted_value.round(2),
        aqi: predicted_aqi,
        timestamp: (Time.now + 3600).iso8601
      },
      hourly: predictions
    }
  end
  
  def time_of_day_factor(hour, historical)
    # Calculate average AQI by hour from historical data
    by_hour = Hash.new { |h, k| h[k] = [] }
    
    historical.each do |h|
      by_hour[h[:hour]] << h[:value]
    end
    
    # Get average for this hour
    hour_values = by_hour[hour]
    return 1.0 if hour_values.empty?
    
    hour_avg = hour_values.sum / hour_values.size.to_f
    overall_avg = calculate_average(historical)
    
    return 1.0 if overall_avg.zero?
    
    hour_avg / overall_avg
  end
  
  def calculate_average(historical)
    return 0 if historical.empty?
    values = historical.map { |h| h[:value] }
    values.sum / values.size.to_f
  end
  
  def calculate_confidence(historical)
    # Confidence based on data quantity and recency
    base_confidence = [historical.size * 2, 100].min
    
    # Reduce if data is old
    if historical.any?
      latest = historical.last[:timestamp]
      hours_old = (Time.now - latest) / 3600.0
      age_penalty = [hours_old * 2, 30].min
      base_confidence - age_penalty
    else
      50
    end
  end
  
  def calculate_pm25_aqi(value)
    # EPA AQI calculation for PM2.5
    breakpoints = [
      [0.0, 12.0, 0, 50],
      [12.1, 35.4, 51, 100],
      [35.5, 55.4, 101, 150],
      [55.5, 150.4, 151, 200],
      [150.5, 250.4, 201, 300],
      [250.5, 500.4, 301, 500]
    ]
    
    breakpoints.each do |c_lo, c_hi, i_lo, i_hi|
      if value >= c_lo && value <= c_hi
        return (((i_hi - i_lo) / (c_hi - c_lo)) * (value - c_lo) + i_lo).round
      end
    end
    
    value > 500 ? 500 : 0
  end
  
  def error_response(message)
    {
      status: 'error',
      message: message,
      prediction: nil
    }
  end
end
