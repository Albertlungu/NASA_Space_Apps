require 'twilio-ruby'

class NotificationService
  def initialize
    @twilio_client = if ENV['TWILIO_ACCOUNT_SID'] && ENV['TWILIO_AUTH_TOKEN']
                       Twilio::REST::Client.new(
                         ENV['TWILIO_ACCOUNT_SID'],
                         ENV['TWILIO_AUTH_TOKEN']
                       )
                     end
  end

  # Send SMS notification
  def send_sms(phone_number, message)
    return { success: false, error: 'Twilio not configured' } unless @twilio_client

    begin
      @twilio_client.messages.create(
        from: ENV['TWILIO_PHONE_NUMBER'],
        to: phone_number,
        body: message
      )
      { success: true }
    rescue => e
      { success: false, error: e.message }
    end
  end

  # Generate notification payload for browser notifications
  def browser_notification_payload(alert)
    {
      title: "Air Quality Alert",
      body: alert.message,
      icon: "/icons/alert-#{alert.severity}.png",
      badge: "/icons/badge.png",
      tag: "alert-#{alert.id}",
      data: {
        alert_id: alert.id,
        severity: alert.severity,
        aqi: alert.aqi,
        pollutant: alert.pollutant,
        location: {
          lat: alert.latitude,
          lon: alert.longitude
        }
      },
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      requireInteraction: alert.severity == 'severe'
    }
  end

  # Check if user should be notified based on preferences and thresholds
  def should_notify?(user, alert)
    return false unless user.notification_preferences

    prefs = JSON.parse(user.notification_preferences) rescue {}
    
    # Check if alerts are enabled
    return false unless prefs['alerts_enabled'] != false

    # Check if AQI exceeds user's threshold
    return false if alert.aqi && user.alert_threshold && alert.aqi < user.alert_threshold

    # Check severity preferences
    if prefs['min_severity']
      severity_levels = { 'low' => 1, 'moderate' => 2, 'high' => 3, 'severe' => 4 }
      min_level = severity_levels[prefs['min_severity']] || 1
      alert_level = severity_levels[alert.severity] || 1
      return false if alert_level < min_level
    end

    true
  end

  # Notify user about alert
  def notify_user(user, alert)
    return unless should_notify?(user, alert)

    prefs = JSON.parse(user.notification_preferences) rescue {}
    results = {}

    # Send SMS if enabled
    if prefs['sms'] && user.phone
      results[:sms] = send_sms(user.phone, alert.message)
    end

    # Return browser notification payload if enabled
    if prefs['browser'] != false
      results[:browser] = browser_notification_payload(alert)
    end

    results
  end

  # Batch notify multiple users
  def notify_users_in_area(lat, lon, radius, alert)
    users = User.all.select do |user|
      # In production, filter by user's saved locations or recent activity
      true
    end

    notifications_sent = 0
    users.each do |user|
      result = notify_user(user, alert)
      notifications_sent += 1 if result.any?
    end

    { users_notified: notifications_sent, total_users: users.length }
  end

  # Create and send alert based on air quality reading
  def create_alert_from_reading(reading, user = nil)
    return unless reading.aqi && reading.aqi >= 150

    alert = Alert.create_from_reading(reading)
    
    if alert && user
      notify_user(user, alert)
    end

    alert
  end
end
