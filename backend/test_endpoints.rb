#!/usr/bin/env ruby
# Test specific API endpoints

require 'http'
require 'json'

BASE_URL = 'http://localhost:4567'

puts "=" * 80
puts "Testing Backend API Endpoints"
puts "=" * 80
puts ""

# Test coordinates
lat = 40.7128
lon = -74.0060

def test_endpoint(name, url)
  puts "\n🔍 Testing: #{name}"
  puts "   URL: #{url}"
  
  begin
    response = HTTP.get(url)
    
    if response.status.success?
      data = JSON.parse(response.to_s)
      puts "   ✅ Status: #{response.status}"
      puts "   📊 Response:"
      puts JSON.pretty_generate(data).lines.first(20).join
      
      if data['results']
        puts "   📈 Results count: #{data['results'].length}"
      elsif data['data']
        puts "   📈 Data points: #{data['data'].length}"
      elsif data['alerts']
        puts "   📈 Alerts count: #{data['alerts'].length}"
      end
    else
      puts "   ❌ Status: #{response.status}"
      puts "   Response: #{response.to_s[0..200]}"
    end
  rescue => e
    puts "   ❌ Error: #{e.message}"
  end
end

# Test 1: Root endpoint
test_endpoint("Root", "#{BASE_URL}/")

# Test 2: Historical data (what frontend requests)
test_endpoint(
  "Historical NO2 (7 days)",
  "#{BASE_URL}/api/historical?pollutant=no2&lat=#{lat}&lon=#{lon}&days=7"
)

# Test 3: Historical PM2.5
test_endpoint(
  "Historical PM2.5 (7 days)",
  "#{BASE_URL}/api/historical?pollutant=pm25&days=7"
)

# Test 4: Air quality for PM2.5
test_endpoint(
  "Air Quality PM2.5",
  "#{BASE_URL}/api/air-quality/pm25?lat=#{lat}&lon=#{lon}&limit=10"
)

# Test 5: Alerts
test_endpoint(
  "Alerts",
  "#{BASE_URL}/api/alerts?lat=#{lat}&lon=#{lon}"
)

# Test 6: User exposure
test_endpoint(
  "User Exposure",
  "#{BASE_URL}/api/users/1/exposure?days=7"
)

puts "\n" + "=" * 80
puts "Testing Complete!"
puts "=" * 80
puts "\n💡 If all tests pass, the backend is working correctly."
puts "   Check the frontend console for errors."
puts ""
