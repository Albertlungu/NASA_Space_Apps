#!/usr/bin/env ruby
# Debug script to test forecast and pattern analysis

require 'httparty'
require 'json'

BASE_URL = 'http://localhost:4567'

# Test location (New York City)
LAT = 40.7128
LON = -74.0060
POLLUTANT = 'pm25'
DAYS = 7

puts "=" * 80
puts "🔍 FORECAST & PATTERN ANALYSIS DEBUG"
puts "=" * 80
puts ""

# Check if server is running
puts "1️⃣  Checking if backend server is running..."
begin
  response = HTTParty.get("#{BASE_URL}/")
  if response.code == 200
    puts "   ✅ Server is running on #{BASE_URL}"
    data = JSON.parse(response.body)
    puts "   Database enabled: #{data['database_enabled']}"
  else
    puts "   ❌ Server returned status code: #{response.code}"
    exit 1
  end
rescue => e
  puts "   ❌ Cannot connect to server: #{e.message}"
  puts "   Make sure backend is running: cd backend && ruby app.rb"
  exit 1
end

puts ""

# Test historical data endpoint
puts "2️⃣  Testing historical data endpoint..."
begin
  url = "#{BASE_URL}/api/historical?pollutant=#{POLLUTANT}&lat=#{LAT}&lon=#{LON}&days=#{DAYS}"
  puts "   URL: #{url}"
  
  response = HTTParty.get(url)
  data = JSON.parse(response.body)
  
  if data['status'] == 'ok'
    puts "   ✅ Historical data retrieved"
    puts "   Pollutant: #{data['pollutant']}"
    puts "   Days: #{data['days']}"
    puts "   Data points: #{data['data_points']}"
    
    if data['data_points'] > 0
      puts ""
      puts "   📊 Sample data points:"
      data['data'][0..4].each_with_index do |point, i|
        puts "      #{i+1}. Time: #{point['timestamp']}, AQI: #{point['aqi']}, Value: #{point['value']}"
      end
      
      # Calculate statistics
      aqi_values = data['data'].map { |d| d['aqi'] }
      avg_aqi = aqi_values.sum / aqi_values.length.to_f
      min_aqi = aqi_values.min
      max_aqi = aqi_values.max
      
      puts ""
      puts "   📈 Statistics:"
      puts "      Average AQI: #{avg_aqi.round(1)}"
      puts "      Min AQI: #{min_aqi}"
      puts "      Max AQI: #{max_aqi}"
      puts "      Range: #{max_aqi - min_aqi}"
    else
      puts "   ⚠️  No historical data found"
      puts "   Run: ruby backend/seed_sample_data.rb"
    end
  else
    puts "   ❌ Error: #{data['message']}"
  end
rescue => e
  puts "   ❌ Request failed: #{e.message}"
  puts "   #{e.backtrace.first(3).join("\n   ")}"
end

puts ""

# Test pattern insights endpoint
puts "3️⃣  Testing pattern insights endpoint..."
begin
  url = "#{BASE_URL}/api/pattern-insights?pollutant=#{POLLUTANT}&lat=#{LAT}&lon=#{LON}&days=#{DAYS}"
  puts "   URL: #{url}"
  
  response = HTTParty.get(url)
  data = JSON.parse(response.body)
  
  if data['status'] == 'ok'
    puts "   ✅ Pattern analysis completed"
    puts "   Data points analyzed: #{data['data_points']}"
    
    analysis = data['analysis']
    
    puts ""
    puts "   🎯 ANALYSIS RESULTS:"
    puts "   " + "-" * 76
    puts "   Summary: #{analysis['summary']}"
    puts "   Confidence: #{analysis['confidence']}%"
    puts "   Insights found: #{analysis['insights'].length}"
    puts ""
    
    if analysis['insights'].any?
      puts "   💡 INSIGHTS:"
      puts "   " + "-" * 76
      analysis['insights'].each_with_index do |insight, i|
        puts ""
        puts "   #{i+1}. #{insight['title']}"
        puts "      Type: #{insight['type']}"
        puts "      Severity: #{insight['severity']}"
        puts "      Insight: #{insight['insight']}"
        puts "      Detail: #{insight['detail']}"
        if insight['actionable'] && insight['action']
          puts "      💡 Action: #{insight['action']}"
        end
      end
    else
      puts "   ⚠️  No insights generated"
      puts "   This usually means insufficient data (need at least 24 hours)"
    end
    
    puts ""
    puts "   📊 PATTERNS DETECTED:"
    puts "   " + "-" * 76
    patterns = analysis['patterns']
    
    if patterns['hourly'] && patterns['hourly'].any?
      puts "   Hourly averages (showing hours 0-23):"
      hourly = patterns['hourly'].sort_by { |h, _| h.to_i }
      hourly.each_slice(6) do |slice|
        line = slice.map { |h, aqi| sprintf("%02d:00=%3d", h.to_i, aqi.round) }.join("  ")
        puts "      #{line}"
      end
    end
    
    puts ""
    if analysis['anomalies'].any?
      puts "   🚨 ANOMALIES DETECTED:"
      puts "   " + "-" * 76
      analysis['anomalies'].first(5).each do |anomaly|
        type_emoji = anomaly['type'] == 'spike' ? '📈' : '📉'
        puts "      #{type_emoji} #{anomaly['timestamp']}"
        puts "         AQI: #{anomaly['aqi']}, Deviation: #{anomaly['deviation']}"
      end
      if analysis['anomalies'].length > 5
        puts "      ... and #{analysis['anomalies'].length - 5} more"
      end
    else
      puts "   ✅ No significant anomalies detected"
    end
    
    puts ""
    if analysis['predictions'].any?
      puts "   🔮 PREDICTIONS (Next 24 hours):"
      puts "   " + "-" * 76
      analysis['predictions'].each do |pred|
        time_str = sprintf("%02d:00", pred['hour'])
        bar_length = (pred['predicted_aqi'] / 5).round
        bar = "█" * [bar_length, 50].min
        puts "      +#{pred['hours_ahead']}h (#{time_str}): AQI #{pred['predicted_aqi']} #{bar} [#{pred['confidence']}%]"
      end
    end
    
  else
    puts "   ❌ Error: #{data['message']}"
    if data['trace']
      puts "   Trace:"
      data['trace'].each { |line| puts "      #{line}" }
    end
  end
rescue => e
  puts "   ❌ Request failed: #{e.message}"
  puts "   #{e.backtrace.first(3).join("\n   ")}"
end

puts ""

# Test current air quality
puts "4️⃣  Testing current air quality endpoint..."
begin
  url = "#{BASE_URL}/api/air-quality/#{POLLUTANT}?lat=#{LAT}&lon=#{LON}&limit=5"
  puts "   URL: #{url}"
  
  response = HTTParty.get(url)
  data = JSON.parse(response.body)
  
  if data['status'] == 'ok'
    puts "   ✅ Current air quality retrieved"
    puts "   Results found: #{data['results'].length}"
    
    if data['results'].any?
      puts ""
      puts "   📍 Nearest stations:"
      data['results'].first(3).each_with_index do |result, i|
        puts "      #{i+1}. #{result['location']} (#{result['city']})"
        puts "         AQI: #{result['aqi']}, Value: #{result['value']} #{result['unit']}"
        puts "         Distance: ~#{((result['coordinates']['latitude'] - LAT)**2 + (result['coordinates']['longitude'] - LON)**2)**0.5 * 111} km"
      end
    else
      puts "   ⚠️  No current data found nearby"
    end
  else
    puts "   ❌ Error: #{data['message']}"
  end
rescue => e
  puts "   ❌ Request failed: #{e.message}"
end

puts ""
puts "=" * 80
puts "🎯 FRONTEND SIMULATION"
puts "=" * 80
puts ""

# Simulate what frontend receives
puts "Simulating ForecastView component data fetching..."
puts ""

historical_data = nil
current_data = nil
pattern_data = nil

begin
  # Fetch historical data
  response = HTTParty.get("#{BASE_URL}/api/historical?pollutant=#{POLLUTANT}&lat=#{LAT}&lon=#{LON}&days=#{DAYS}")
  historical_data = JSON.parse(response.body) if response.code == 200
  
  # Fetch current data
  response = HTTParty.get("#{BASE_URL}/api/air-quality/#{POLLUTANT}?lat=#{LAT}&lon=#{LON}&limit=1")
  current_data = JSON.parse(response.body) if response.code == 200
  
  # Fetch pattern insights
  response = HTTParty.get("#{BASE_URL}/api/pattern-insights?pollutant=#{POLLUTANT}&lat=#{LAT}&lon=#{LON}&days=#{DAYS}")
  pattern_data = JSON.parse(response.body) if response.code == 200
  
  puts "✅ All API calls successful"
  puts ""
  
  # Check what frontend would see
  puts "Frontend state:"
  puts "  - Historical data: #{historical_data && historical_data['data_points'] > 0 ? '✅ Available' : '❌ Missing'}"
  puts "  - Current data: #{current_data && current_data['results'].any? ? '✅ Available' : '❌ Missing'}"
  puts "  - Pattern insights: #{pattern_data && pattern_data['analysis'] ? '✅ Available' : '❌ Missing'}"
  
  puts ""
  
  if pattern_data && pattern_data['analysis']
    puts "📱 WHAT YOU'LL SEE ON /forecast PAGE:"
    puts "=" * 80
    puts ""
    
    analysis = pattern_data['analysis']
    
    puts "🤖 AI SUMMARY:"
    puts "   #{analysis['summary']}"
    puts "   Confidence: #{analysis['confidence']}%"
    puts ""
    
    if analysis['insights'].any?
      puts "💡 INSIGHTS (#{analysis['insights'].length} total):"
      analysis['insights'].each_with_index do |insight, i|
        severity_color = case insight['severity']
        when 'high' then '🔴'
        when 'moderate' then '🟡'
        else '🟢'
        end
        
        puts ""
        puts "   #{severity_color} #{insight['title']}"
        puts "   #{insight['insight']}"
        puts "   #{insight['detail']}"
        if insight['action']
          puts "   💡 #{insight['action']}"
        end
      end
    else
      puts "⚠️  No insights to display"
      puts "   Need at least 24 hours of data. Run: ruby backend/seed_sample_data.rb"
    end
  else
    puts "❌ Pattern insights not available"
    puts ""
    puts "TROUBLESHOOTING:"
    puts "1. Check database has data: sqlite3 db/development.sqlite3 'SELECT COUNT(*) FROM air_quality_readings;'"
    puts "2. Seed sample data: ruby backend/seed_sample_data.rb"
    puts "3. Check backend logs for errors"
  end
  
rescue => e
  puts "❌ Error during simulation: #{e.message}"
  puts e.backtrace.first(5).join("\n")
end

puts ""
puts "=" * 80
puts "✅ Debug complete!"
puts ""
puts "Next steps:"
puts "1. Visit http://localhost:8080/forecast in your browser"
puts "2. Open browser console (F12) to check for errors"
puts "3. Check network tab to see API calls"
puts "=" * 80
