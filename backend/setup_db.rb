#!/usr/bin/env ruby
require 'sqlite3'
require 'fileutils'

# Create db directory
FileUtils.mkdir_p('db')

# Create database
db = SQLite3::Database.new('db/development.sqlite3')

puts "Creating tables..."

# Create schema_migrations table
db.execute <<-SQL
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) NOT NULL UNIQUE
  );
SQL

# Create users table
db.execute <<-SQL
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    phone VARCHAR(255),
    notification_preferences TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
SQL

# Create air_quality_readings table
db.execute <<-SQL
  CREATE TABLE IF NOT EXISTS air_quality_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pollutant VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20),
    latitude DECIMAL(10,6) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    location_name VARCHAR(255),
    city VARCHAR(255),
    country VARCHAR(255),
    aqi INTEGER,
    measured_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
SQL

# Create indexes for air_quality_readings
db.execute <<-SQL
  CREATE INDEX IF NOT EXISTS idx_readings_pollutant ON air_quality_readings(pollutant);
SQL

db.execute <<-SQL
  CREATE INDEX IF NOT EXISTS idx_readings_location ON air_quality_readings(latitude, longitude);
SQL

db.execute <<-SQL
  CREATE INDEX IF NOT EXISTS idx_readings_measured_at ON air_quality_readings(measured_at);
SQL

# Create user_exposures table
db.execute <<-SQL
  CREATE TABLE IF NOT EXISTS user_exposures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pollutant VARCHAR(50) NOT NULL,
    exposure_value DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    recorded_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
SQL

# Create alerts table
db.execute <<-SQL
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    severity VARCHAR(50) NOT NULL,
    pollutant VARCHAR(50) NOT NULL,
    aqi INTEGER NOT NULL,
    latitude DECIMAL(10,6) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    message TEXT NOT NULL,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
SQL

# Insert migration versions
['001', '002', '003', '004'].each do |version|
  db.execute("INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)", version)
end

puts "✓ Database tables created successfully!"
puts "✓ Database file: db/development.sqlite3"

# Seed with some sample data
puts "\nSeeding sample data..."

# Sample readings for the past 7 days
pollutants = ['pm25', 'no2', 'o3']
cities = [
  { name: 'New York', lat: 40.7128, lon: -74.0060, country: 'USA' },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, country: 'USA' },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298, country: 'USA' },
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan' }
]

200.times do |i|
  city = cities.sample
  pollutant = pollutants.sample
  
  # Generate realistic values
  base_value = case pollutant
  when 'pm25' then rand(5.0..80.0)
  when 'no2' then rand(10.0..60.0)
  when 'o3' then rand(20.0..100.0)
  end
  
  # Add time-of-day variation
  hour_offset = rand(0..168) # Past 7 days
  measured_time = Time.now - (hour_offset * 3600)
  hour = measured_time.hour
  
  # Higher pollution during rush hours (7-9am, 5-7pm)
  if (7..9).include?(hour) || (17..19).include?(hour)
    base_value *= 1.3
  end
  
  value = base_value.round(2)
  aqi = (value * 1.5).to_i.clamp(0, 500)
  
  begin
    db.execute(
      "INSERT INTO air_quality_readings (pollutant, value, unit, latitude, longitude, location_name, city, country, aqi, measured_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      pollutant,
      value,
      pollutant == 'pm25' ? 'µg/m³' : 'ppb',
      city[:lat] + rand(-0.05..0.05),
      city[:lon] + rand(-0.05..0.05),
      "Station #{i % 10}",
      city[:name],
      city[:country],
      aqi,
      measured_time.strftime('%Y-%m-%d %H:%M:%S')
    )
  rescue => e
    puts "Error inserting record #{i}: #{e.message}"
  end
end

puts "✓ Created 200 sample air quality readings"
puts "\n✅ Database setup complete! You can now use predictions and historical data features."

db.close
