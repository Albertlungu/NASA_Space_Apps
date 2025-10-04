#!/usr/bin/env ruby
# Debug script to test backend data fetching

require_relative 'app'
require 'json'

puts "=" * 80
puts "NASA TEMPO Air Quality - Debug Script"
puts "=" * 80
puts ""

# Get location (you can change these)
lat = 40.7128
lon = -74.0060
location_name = "New York"

puts "📍 Location: #{location_name} (#{lat}, #{lon})"
puts ""

# Test 1: Check database
puts "=" * 80
puts "TEST 1: Database Check"
puts "=" * 80

begin
  user_count = User.count
  reading_count = AirQualityReading.count
  alert_count = Alert.count
  exposure_count = UserExposure.count
  
  puts "✅ Database connected successfully!"
  puts "   Users: #{user_count}"
  puts "   Air Quality Readings: #{reading_count}"
  puts "   Alerts: #{alert_count}"
  puts "   User Exposures: #{exposure_count}"
  puts ""
  
  if reading_count > 0
    puts "📊 Sample readings from database:"
    AirQualityReading.limit(5).each do |reading|
      puts "   - #{reading.pollutant.upcase}: #{reading.value} #{reading.unit} (AQI: #{reading.aqi}) at #{reading.measured_at}"
    end
    puts ""
  end
rescue => e
  puts "❌ Database error: #{e.message}"
  puts ""
end

# Test 2: Historical Data
puts "=" * 80
puts "TEST 2: Historical Data (Last 7 Days)"
puts "=" * 80

begin
  pollutants = ['no2', 'pm25', 'o3']
  
  pollutants.each do |pollutant|
    puts "\n🔍 #{pollutant.upcase} Historical Data:"
    
    start_date = Time.now - (7 * 24 * 60 * 60)
    readings = AirQualityReading
      .where(pollutant: pollutant)
      .where('measured_at >= ?', start_date)
      .order(measured_at: :desc)
    
    if readings.any?
      puts "   Found #{readings.count} readings"
      
      # Group by day
      by_day = readings.group_by { |r| r.measured_at.to_date }
      puts "   Days with data: #{by_day.keys.count}"
      
      # Show last 5 readings
      puts "\n   Last 5 readings:"
      readings.limit(5).each do |r|
        puts "   - #{r.measured_at.strftime('%Y-%m-%d %H:%M')}: #{r.value} #{r.unit} (AQI: #{r.aqi})"
      end
      
      # Calculate average
      avg_value = readings.map(&:value).sum / readings.count.to_f
      avg_aqi = readings.map(&:aqi).compact.sum / readings.count.to_f
      puts "\n   Average: #{avg_value.round(2)} #{readings.first.unit} (AQI: #{avg_aqi.round})"
    else
      puts "   ⚠️  No historical data found in database"
    end
  end
  puts ""
rescue => e
  puts "❌ Error fetching historical data: #{e.message}"
  puts e.backtrace.first(3)
  puts ""
end

# Test 3: Live API Call (if API key is set)
puts "=" * 80
puts "TEST 3: Live OpenAQ API Call"
puts "=" * 80

if ENV['OPENAQ_API_KEY'] && !ENV['OPENAQ_API_KEY'].empty? && ENV['OPENAQ_API_KEY'] != 'your_openaq_api_key_here'
  begin
    puts "🌐 Fetching live NO2 data from OpenAQ..."
    
    url = "https://api.openaq.org/v3/measurements"
    query_params = {
      parameter: 'no2',
      limit: 10,
      radius: 50000,
      coordinates: "#{lat},#{lon}"
    }
    
    response = HTTP.headers("X-API-Key" => ENV['OPENAQ_API_KEY'])
                   .get(url, params: query_params)
    
    if response.status.success?
      data = JSON.parse(response.to_s)
      
      if data['results'] && data['results'].any?
        puts "✅ Successfully fetched #{data['results'].length} measurements"
        puts ""
        
        data['results'].each_with_index do |measurement, i|
          puts "#{i + 1}. Location: #{measurement['location'] || 'Unknown'}"
          puts "   Value: #{measurement['value']} #{measurement['unit']}"
          puts "   City: #{measurement['city']}, #{measurement['country']}"
          puts "   Coordinates: #{measurement['coordinates']}"
          puts "   Date: #{measurement['date']}"
          puts ""
        end
        
        # Calculate average
        avg = data['results'].map { |r| r['value'] }.sum / data['results'].length.to_f
        puts "📊 Average NO2: #{avg.round(2)} #{data['results'].first['unit']}"
      else
        puts "⚠️  API returned no results for this location"
        puts "Response: #{data.inspect}"
      end
    else
      puts "❌ API request failed with status: #{response.status}"
      puts "Response: #{response.to_s[0..500]}"
    end
  rescue => e
    puts "❌ Error calling OpenAQ API: #{e.message}"
    puts e.backtrace.first(3)
  end
else
  puts "⚠️  OpenAQ API key not configured"
  puts "   Set OPENAQ_API_KEY in .env file to test live API"
end
puts ""

# Test 4: Alerts
puts "=" * 80
puts "TEST 4: Active Alerts"
puts "=" * 80

begin
  alerts = Alert
    .where(active: true)
    .where(
      'latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
      lat - 0.5, lat + 0.5,
      lon - 0.5, lon + 0.5
    )
  
  if alerts.any?
    puts "🚨 Found #{alerts.count} active alert(s):"
    alerts.each do |alert|
      puts "\n   Severity: #{alert.severity.upcase}"
      puts "   Pollutant: #{alert.pollutant}"
      puts "   AQI: #{alert.aqi}"
      puts "   Message: #{alert.message}"
      puts "   Created: #{alert.created_at}"
    end
  else
    puts "✅ No active alerts for this location"
  end
  puts ""
rescue => e
  puts "❌ Error fetching alerts: #{e.message}"
  puts ""
end

# Test 5: API Endpoints (simulated)
puts "=" * 80
puts "TEST 5: Simulated API Endpoint Responses"
puts "=" * 80

puts "\n📡 GET /api/historical?pollutant=no2&lat=#{lat}&lon=#{lon}&days=7"
begin
  start_date = Time.now - (7 * 24 * 60 * 60)
  readings = AirQualityReading
    .where(pollutant: 'no2')
    .where('measured_at >= ?', start_date)
    .order(measured_at: :asc)
  
  if readings.any?
    hourly_data = readings.group_by { |r| r.measured_at.beginning_of_hour }
                         .map do |hour, records|
      avg_value = records.map(&:value).sum / records.length.to_f
      {
        timestamp: hour.iso8601,
        value: avg_value.round(2),
        aqi: records.first.aqi,
        count: records.length
      }
    end
    
    puts "✅ Would return #{hourly_data.length} data points"
    puts "\nSample response:"
    puts JSON.pretty_generate({
      status: 'ok',
      pollutant: 'no2',
      days: 7,
      data_points: hourly_data.length,
      data: hourly_data.first(3)
    })
  else
    puts "⚠️  No data available - would return empty array"
  end
rescue => e
  puts "❌ Error: #{e.message}"
end

puts "\n" + "=" * 80
puts "Debug Complete!"
puts "=" * 80
puts "\n💡 Tips:"
puts "   - If no data in database, run: rake db:seed"
puts "   - If API key not set, add to .env: OPENAQ_API_KEY=your_key"
puts "   - Check frontend console for errors"
puts "   - Make sure backend is running on port 4567"
puts ""
