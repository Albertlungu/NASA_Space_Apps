require 'rufus-scheduler'
require_relative '../services/notification_service'

class AirQualityMonitor
  def initialize
    @scheduler = Rufus::Scheduler.new
    @notification_service = NotificationService.new
  end

  def start
    puts "Starting Air Quality Monitor..."

    # Check air quality every 15 minutes
    @scheduler.every '15m', first: :now do
      check_air_quality
    end

    # Clean up old alerts every hour
    @scheduler.every '1h' do
      cleanup_old_alerts
    end

    # Update user exposures based on location (if tracking enabled)
    @scheduler.every '30m' do
      update_user_exposures
    end

    puts "Air Quality Monitor started!"
  end

  def stop
    @scheduler.shutdown
    puts "Air Quality Monitor stopped"
  end

  private

  def check_air_quality
    puts "[#{Time.now}] Checking air quality..."

    # Get all unique user locations or major cities
    locations = get_monitoring_locations

    locations.each do |location|
      begin
        check_location(location[:lat], location[:lon], location[:name])
      rescue => e
        puts "Error checking location #{location[:name]}: #{e.message}"
      end
    end

    puts "[#{Time.now}] Air quality check completed"
  end

  def check_location(lat, lon, name)
    # Fetch current air quality
    pollutants = ['no2', 'pm25', 'o3']
    
    pollutants.each do |pollutant|
      url = "https://api.openaq.org/v3/measurements"
      query_params = {
        parameter: pollutant,
        limit: 10,
        radius: 25000,
        coordinates: "#{lat},#{lon}"
      }

      response = HTTP.headers("X-API-Key" => ENV['OPENAQ_API_KEY'])
                     .get(url, params: query_params)
      data = JSON.parse(response.to_s)

      next unless data['results'] && data['results'].any?

      # Calculate average AQI
      avg_value = data['results'].map { |r| r['value'] }.compact.sum / data['results'].length.to_f
      aqi = calculate_aqi(pollutant, avg_value)

      # Create reading
      reading = AirQualityReading.create(
        pollutant: pollutant,
        value: avg_value,
        unit: data['results'].first['unit'],
        latitude: lat,
        longitude: lon,
        location_name: name,
        aqi: aqi,
        measured_at: Time.now
      )

      # Create alert if AQI is high
      if aqi && aqi >= 150
        alert = Alert.create_from_reading(reading)
        
        if alert
          # Notify users in the area
          result = @notification_service.notify_users_in_area(lat, lon, 0.5, alert)
          puts "Alert created for #{name}: AQI #{aqi} (#{pollutant}). Notified #{result[:users_notified]} users."
        end
      end
    end
  end

  def cleanup_old_alerts
    # Deactivate alerts older than 24 hours
    Alert.where(active: true)
         .where('created_at < ?', 24.hours.ago)
         .update_all(active: false)
    
    puts "[#{Time.now}] Cleaned up old alerts"
  end

  def update_user_exposures
    # Update cumulative exposure for all users
    User.find_each do |user|
      user.update_cumulative_exposure!
    end
    
    puts "[#{Time.now}] Updated user exposures"
  end

  def get_monitoring_locations
    # Major US cities (can be expanded or pulled from user locations)
    [
      { name: 'New York', lat: 40.7128, lon: -74.0060 },
      { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
      { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
      { name: 'Houston', lat: 29.7604, lon: -95.3698 },
      { name: 'Phoenix', lat: 33.4484, lon: -112.0740 },
      { name: 'Philadelphia', lat: 39.9526, lon: -75.1652 },
      { name: 'San Antonio', lat: 29.4241, lon: -98.4936 },
      { name: 'San Diego', lat: 32.7157, lon: -117.1611 },
      { name: 'Dallas', lat: 32.7767, lon: -96.7970 },
      { name: 'San Jose', lat: 37.3382, lon: -121.8863 }
    ]
  end

  def calculate_aqi(pollutant, value)
    # Simplified AQI calculation
    case pollutant.downcase
    when 'pm25', 'pm2.5'
      calculate_pm25_aqi(value)
    when 'no2'
      calculate_no2_aqi(value)
    when 'o3', 'ozone'
      calculate_o3_aqi(value)
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
    breakpoints = [
      [0, 54, 0, 50],
      [55, 70, 51, 100],
      [71, 85, 101, 150],
      [86, 105, 151, 200],
      [106, 200, 201, 300]
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
end

# Start monitor if running as standalone script
if __FILE__ == $0
  require_relative '../app'
  
  monitor = AirQualityMonitor.new
  monitor.start
  
  # Keep running
  sleep
end
