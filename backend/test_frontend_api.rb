#!/usr/bin/env ruby
# Quick test to verify frontend can fetch data

require 'httparty'
require 'json'

puts "=" * 80
puts "🧪 FRONTEND API DATA TEST"
puts "=" * 80
puts ""

# Test coordinates (NYC)
lat = 40.7128
lon = -74.006

tests = [
  {
    name: "Historical Data",
    url: "http://localhost:4567/api/historical?pollutant=pm25&lat=#{lat}&lon=#{lon}&days=7",
    check: ->(data) { data['status'] == 'ok' && data['data_points'] > 0 }
  },
  {
    name: "Pattern Insights",
    url: "http://localhost:4567/api/pattern-insights?pollutant=pm25&lat=#{lat}&lon=#{lon}&days=7",
    check: ->(data) { data['status'] == 'ok' && data['analysis'] && data['analysis']['insights'].any? }
  },
  {
    name: "Current Air Quality (optional)",
    url: "http://localhost:4567/api/air-quality/pm25?lat=#{lat}&lon=#{lon}&limit=1",
    check: ->(data) { data['status'] == 'ok' }
  }
]

results = []

tests.each_with_index do |test, i|
  puts "#{i+1}. Testing: #{test[:name]}"
  puts "   URL: #{test[:url]}"
  
  begin
    response = HTTParty.get(test[:url])
    data = JSON.parse(response.body)
    
    if test[:check].call(data)
      puts "   ✅ PASS"
      results << true
      
      # Show key info
      case test[:name]
      when "Historical Data"
        puts "      Data points: #{data['data_points']}"
        puts "      Latest AQI: #{data['data'].last['aqi']}"
      when "Pattern Insights"
        puts "      Insights: #{data['analysis']['insights'].length}"
        puts "      Confidence: #{data['analysis']['confidence']}%"
        puts "      Summary: #{data['analysis']['summary'][0..80]}..."
      when "Current Air Quality (optional)"
        if data['results'].any?
          puts "      Current AQI: #{data['results'].first['aqi']}"
        else
          puts "      ⚠️  No current data (will use historical fallback)"
        end
      end
    else
      puts "   ❌ FAIL"
      puts "      Response: #{data.inspect[0..100]}"
      results << false
    end
  rescue => e
    puts "   ❌ ERROR: #{e.message}"
    results << false
  end
  
  puts ""
end

puts "=" * 80
puts "📊 RESULTS"
puts "=" * 80
puts "Passed: #{results.count(true)}/#{results.length}"
puts ""

if results[0] && results[1]
  puts "✅ FORECAST PAGE SHOULD WORK!"
  puts ""
  puts "The ForecastView component needs:"
  puts "  1. ✅ Historical data - Available"
  puts "  2. ✅ Pattern insights - Available"  
  puts "  3. ⚠️  Current data - Optional (using fallback)"
  puts ""
  puts "🌐 Visit: http://localhost:8080/forecast"
  puts ""
  puts "Expected to see:"
  puts "  • 24-hour forecast predictions"
  puts "  • #{results[1] ? "#{JSON.parse(HTTParty.get(tests[1][:url]).body)['analysis']['insights'].length} AI pattern insights" : "Pattern insights"}"
  puts "  • Confidence scores and recommendations"
else
  puts "❌ Issues detected:"
  puts "  Historical data: #{results[0] ? '✅' : '❌ MISSING'}"
  puts "  Pattern insights: #{results[1] ? '✅' : '❌ MISSING'}"
  puts ""
  puts "Fix: ruby backend/seed_sample_data.rb"
end

puts "=" * 80
