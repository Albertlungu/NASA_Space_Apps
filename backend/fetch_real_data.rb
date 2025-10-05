#!/usr/bin/env ruby
require 'httparty'
require 'sqlite3'
require 'json'
require 'time'

# WAQI API token - replace with your actual token
WAQI_TOKEN = ENV['VITE_AQI_TOKEN'] || 'your_token_here'

# Cities to fetch data for
CITIES = [
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
  { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 }
]

db = SQLite3::Database.new('db/development.sqlite3')

puts "🌍 Fetching REAL air quality data from WAQI..."
puts "=" * 60

CITIES.each do |city|
  puts "\n📍 Fetching data for #{city[:name]}..."
  
  begin
    # Fetch current data from WAQI
    url = "https://api.waqi.info/feed/geo:#{city[:lat]};#{city[:lon]}/?token=#{WAQI_TOKEN}"
    response = HTTParty.get(url)
    data = JSON.parse(response.body)
    
    if data['status'] == 'ok' && data['data']
      station_data = data['data']
      aqi = station_data['aqi']
      
      # Get pollutant values
      pm25 = station_data.dig('iaqi', 'pm25', 'v')
      no2 = station_data.dig('iaqi', 'no2', 'v')
      o3 = station_data.dig('iaqi', 'o3', 'v')
      
      station_name = station_data.dig('city', 'name') || city[:name]
      station_coords = station_data.dig('city', 'geo')
      
      actual_lat = station_coords ? station_coords[0] : city[:lat]
      actual_lon = station_coords ? station_coords[1] : city[:lon]
      
      # Insert PM2.5 reading if available
      if pm25
        db.execute(
          "INSERT INTO air_quality_readings (pollutant, value, unit, latitude, longitude, location_name, city, country, aqi, measured_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          'pm25',
          pm25,
          'µg/m³',
          actual_lat,
          actual_lon,
          station_name,
          city[:name],
          'N/A',
          aqi,
          Time.now.strftime('%Y-%m-%d %H:%M:%S')
        )
        puts "  ✓ PM2.5: #{pm25} µg/m³ (AQI: #{aqi})"
      end
      
      # Insert NO2 reading if available
      if no2
        db.execute(
          "INSERT INTO air_quality_readings (pollutant, value, unit, latitude, longitude, location_name, city, country, aqi, measured_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          'no2',
          no2,
          'ppb',
          actual_lat,
          actual_lon,
          station_name,
          city[:name],
          'N/A',
          aqi,
          Time.now.strftime('%Y-%m-%d %H:%M:%S')
        )
        puts "  ✓ NO2: #{no2} ppb"
      end
      
      # Insert O3 reading if available
      if o3
        db.execute(
          "INSERT INTO air_quality_readings (pollutant, value, unit, latitude, longitude, location_name, city, country, aqi, measured_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          'o3',
          o3,
          'ppb',
          actual_lat,
          actual_lon,
          station_name,
          city[:name],
          'N/A',
          aqi,
          Time.now.strftime('%Y-%m-%d %H:%M:%S')
        )
        puts "  ✓ O3: #{o3} ppb"
      end
      
      puts "  📊 Station: #{station_name}"
      
    else
      puts "  ⚠️  No data available (#{data['data'] || data['message']})"
    end
    
    # Rate limiting - don't hammer the API
    sleep(1)
    
  rescue => e
    puts "  ❌ Error: #{e.message}"
  end
end

# Count total readings
count = db.execute("SELECT COUNT(*) FROM air_quality_readings")[0][0]

puts "\n" + "=" * 60
puts "✅ Done! Total readings in database: #{count}"
puts "\n💡 Run this script hourly with a cron job to build historical data:"
puts "   0 * * * * cd /path/to/backend && ruby fetch_real_data.rb"

db.close
