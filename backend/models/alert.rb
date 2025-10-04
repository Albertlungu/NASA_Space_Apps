class Alert < ActiveRecord::Base
  belongs_to :user, optional: true

  validates :severity, :message, presence: true

  scope :active, -> { where(active: true) }
  scope :for_location, ->(lat, lon, radius = 0.5) {
    where(
      'latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
      lat - radius, lat + radius,
      lon - radius, lon + radius
    )
  }

  def self.create_from_reading(reading, threshold = 150)
    return unless reading.aqi && reading.aqi >= threshold

    severity = case reading.aqi
               when 150..200 then 'moderate'
               when 201..300 then 'high'
               else 'severe'
               end

    create(
      severity: severity,
      pollutant: reading.pollutant,
      aqi: reading.aqi,
      latitude: reading.latitude,
      longitude: reading.longitude,
      message: "High #{reading.pollutant.upcase} levels detected (AQI: #{reading.aqi})",
      active: true
    )
  end
end
