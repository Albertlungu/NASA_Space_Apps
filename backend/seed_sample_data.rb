#!/usr/bin/env ruby
# Seed sample data for testing pattern analysis

require_relative 'app'
require 'time'

puts "🌱 Seeding sample air quality data for pattern analysis..."

# Sample location (New York City)
lat = 40.7128
lon = -74.0060

# Generate 7 days of hourly data with realistic patterns
now = Time.now
start_time = now - (7 * 24 * 60 * 60) # 7 days ago

(0..167).each do |hour_offset| # 7 days * 24 hours
  timestamp = start_time + (hour_offset * 60 * 60)
  hour_of_day = timestamp.hour
  
  # Create realistic patterns
  base_aqi = 60
  
  # Morning rush hour (7-9 AM): higher pollution
  base_aqi += 40 if hour_of_day >= 7 && hour_of_day <= 9
  
  # Evening rush hour (5-7 PM): higher pollution
  base_aqi += 50 if hour_of_day >= 17 && hour_of_day <= 19
  
  # Early morning (2-6 AM): cleaner air
  base_aqi -= 25 if hour_of_day >= 2 && hour_of_day <= 6
  
  # Add some randomness
  aqi = base_aqi + rand(-15..15)
  aqi = [aqi, 20].max # Minimum 20
  aqi = [aqi, 180].min # Maximum 180
  
  # Calculate PM2.5 value from AQI
  value = if aqi <= 50
    (aqi / 50.0) * 12.0
  elsif aqi <= 100
    12.1 + ((aqi - 51) / 49.0) * 23.3
  elsif aqi <= 150
    35.5 + ((aqi - 101) / 49.0) * 19.9
  else
    55.5 + ((aqi - 151) / 49.0) * 94.4
  end
  
  begin
    AirQualityReading.create!(
      pollutant: 'pm25',
      value: value.round(1),
      unit: 'µg/m³',
      aqi: aqi,
      latitude: lat + rand(-0.1..0.1),
      longitude: lon + rand(-0.1..0.1),
      location_name: "New York City",
      measured_at: timestamp
    )
    
    print "." if hour_offset % 24 == 0
  rescue => e
    puts "\n❌ Error creating reading: #{e.message}"
  end
end

puts "\n✅ Successfully seeded #{AirQualityReading.count} air quality readings!"

# Test pattern insights
puts "\n🧠 Testing pattern analysis..."
recent_readings = AirQualityReading
  .where(pollutant: 'pm25')
  .where('measured_at >= ?', now - (7 * 24 * 60 * 60))
  .order(measured_at: :asc)

historical_data = recent_readings.map do |r|
  {
    timestamp: r.measured_at.iso8601,
    aqi: r.aqi,
    value: r.value
  }
end

require_relative 'services/pattern_analysis_service'
analyzer = PatternAnalysisService.new(historical_data, 'pm25')
result = analyzer.analyze

puts "\n📊 Pattern Analysis Results:"
puts "   Insights found: #{result[:insights].length}"
puts "   Summary: #{result[:summary]}"
puts "   Confidence: #{result[:confidence]}%"

if result[:insights].any?
  puts "\n📋 Top Insights:"
  result[:insights].first(3).each do |insight|
    puts "\n   #{insight[:title]}"
    puts "   → #{insight[:insight]}"
    puts "   → #{insight[:detail]}"
  end
end

puts "\n✨ Seed complete! Visit http://localhost:8080/forecast to see the pattern insights."
