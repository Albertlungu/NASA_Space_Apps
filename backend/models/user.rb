class User < ActiveRecord::Base
  has_many :exposures, class_name: 'UserExposure', dependent: :destroy
  has_many :alerts, dependent: :destroy

  validates :email, presence: true, uniqueness: true

  def update_cumulative_exposure!
    total = exposures.sum(:value)
    update(cumulative_exposure: total)
  end

  def daily_exposure
    today_start = Time.now.beginning_of_day
    exposures.where('recorded_at >= ?', today_start).sum(:value)
  end

  def weekly_exposure
    week_start = Time.now.beginning_of_week
    exposures.where('recorded_at >= ?', week_start).sum(:value)
  end
end
