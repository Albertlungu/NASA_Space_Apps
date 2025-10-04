class AirQualityReading < ActiveRecord::Base
  validates :pollutant, :value, :measured_at, presence: true

  scope :recent, -> { where('measured_at >= ?', 24.hours.ago) }
  scope :by_pollutant, ->(pollutant) { where(pollutant: pollutant) }
  scope :near, ->(lat, lon, radius = 0.5) {
    where(
      'latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
      lat - radius, lat + radius,
      lon - radius, lon + radius
    )
  }

  def self.average_aqi_for_location(lat, lon, hours = 24)
    readings = near(lat, lon)
      .where('measured_at >= ?', hours.hours.ago)
      .where.not(aqi: nil)
    
    return nil if readings.empty?
    
    readings.average(:aqi).to_f.round
  end
end
