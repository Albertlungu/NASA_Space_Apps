class UserExposure < ActiveRecord::Base
  belongs_to :user

  validates :user_id, :pollutant, :value, :recorded_at, presence: true

  scope :today, -> { where('recorded_at >= ?', Time.now.beginning_of_day) }
  scope :this_week, -> { where('recorded_at >= ?', Time.now.beginning_of_week) }
  scope :by_pollutant, ->(pollutant) { where(pollutant: pollutant) }

  def exposure_score
    # Calculate weighted exposure score based on duration and value
    (value * duration_minutes) / 60.0
  end
end
