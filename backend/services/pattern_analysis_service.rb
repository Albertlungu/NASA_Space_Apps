# services/pattern_analysis_service.rb
# AI-powered pattern analysis for air quality data
# Analyzes historical data to find patterns, trends, and generate insights

class PatternAnalysisService
  def initialize(historical_data, pollutant = 'pm25')
    @data = historical_data || []
    @pollutant = pollutant
    @insights = []
  end

  def analyze
    return { insights: [], patterns: {}, summary: "Insufficient data for analysis" } if @data.length < 24

    {
      insights: generate_insights,
      patterns: detect_patterns,
      anomalies: detect_anomalies,
      predictions: generate_predictions,
      summary: generate_summary,
      confidence: calculate_confidence
    }
  end

  private

  def generate_insights
    insights = []

    # Time-based patterns
    hourly_pattern = analyze_hourly_patterns
    insights << hourly_pattern if hourly_pattern

    # Trend analysis
    trend = analyze_trend
    insights << trend if trend

    # Variability analysis
    variability = analyze_variability
    insights << variability if variability

    # Peak detection
    peaks = detect_peak_times
    insights << peaks if peaks

    # Health recommendations
    health = generate_health_insights
    insights << health if health

    insights
  end

  def analyze_hourly_patterns
    hourly_data = group_by_hour(@data)
    return nil if hourly_data.empty?

    # Find peak pollution hours
    peak_hours = hourly_data.sort_by { |_, avg| -avg }.first(3)
    clean_hours = hourly_data.sort_by { |_, avg| avg }.first(3)

    peak_times = peak_hours.map { |h, _| format_hour(h) }.join(', ')
    clean_times = clean_hours.map { |h, _| format_hour(h) }.join(', ')
    
    avg_peak = peak_hours.map { |_, v| v }.sum / peak_hours.length
    avg_clean = clean_hours.map { |_, v| v }.sum / clean_hours.length
    improvement_pct = ((avg_peak - avg_clean) / avg_peak * 100).round

    {
      type: 'hourly_pattern',
      title: '⏰ Daily Pattern Detected',
      insight: "Air quality typically peaks during #{peak_times} and improves during #{clean_times}.",
      detail: "#{improvement_pct}% better air quality during off-peak hours",
      severity: avg_peak > 100 ? 'high' : 'moderate',
      actionable: true,
      action: "Plan outdoor activities between #{clean_times} for healthier air exposure."
    }
  end

  def analyze_trend
    return nil if @data.length < 48

    # Calculate linear regression
    values = @data.map { |d| d[:aqi] || d['aqi'] }
    x = (0...values.length).to_a
    
    slope = calculate_slope(x, values)
    avg_value = values.sum / values.length.to_f

    if slope.abs < 0.1
      trend_text = "stable"
      emoji = "➡️"
      detail = "Air quality has remained relatively consistent"
    elsif slope > 0
      trend_text = "worsening"
      emoji = "📈"
      pct_change = ((slope * values.length / avg_value) * 100).round
      detail = "Air quality has declined by approximately #{pct_change}% over the period"
    else
      trend_text = "improving"
      emoji = "📉"
      pct_change = ((slope.abs * values.length / avg_value) * 100).round
      detail = "Air quality has improved by approximately #{pct_change}% over the period"
    end

    {
      type: 'trend',
      title: "#{emoji} Trend Analysis",
      insight: "Overall air quality is #{trend_text}.",
      detail: detail,
      severity: slope > 0.5 ? 'high' : (slope < -0.5 ? 'low' : 'moderate'),
      actionable: slope > 0.5,
      action: slope > 0.5 ? "Monitor conditions closely and consider reducing outdoor exposure." : nil
    }
  end

  def analyze_variability
    values = @data.map { |d| d[:aqi] || d['aqi'] }
    avg = values.sum / values.length.to_f
    variance = values.map { |v| (v - avg) ** 2 }.sum / values.length
    std_dev = Math.sqrt(variance)
    
    coefficient_of_variation = (std_dev / avg * 100).round

    if coefficient_of_variation < 15
      stability = "very stable"
      emoji = "✅"
      detail = "Air quality is highly predictable with minimal fluctuations"
    elsif coefficient_of_variation < 30
      stability = "moderately stable"
      emoji = "⚖️"
      detail = "Some variation in air quality throughout the day"
    else
      stability = "highly variable"
      emoji = "⚠️"
      detail = "Significant fluctuations in air quality - conditions can change rapidly"
    end

    {
      type: 'variability',
      title: "#{emoji} Stability Analysis",
      insight: "Air quality is #{stability} (CV: #{coefficient_of_variation}%).",
      detail: detail,
      severity: coefficient_of_variation > 30 ? 'high' : 'low',
      actionable: coefficient_of_variation > 30,
      action: coefficient_of_variation > 30 ? "Check conditions frequently before outdoor activities." : nil
    }
  end

  def detect_peak_times
    hourly_data = group_by_hour(@data)
    return nil if hourly_data.empty?

    # Detect if there's a traffic pattern (morning/evening peaks)
    morning_peak = hourly_data.select { |h, _| h >= 7 && h <= 10 }.values.max || 0
    evening_peak = hourly_data.select { |h, _| h >= 16 && h <= 19 }.values.max || 0
    midday = hourly_data.select { |h, _| h >= 11 && h <= 15 }.values.max || 0
    
    avg_value = hourly_data.values.sum / hourly_data.values.length.to_f

    has_traffic_pattern = (morning_peak > avg_value * 1.2) || (evening_peak > avg_value * 1.2)

    if has_traffic_pattern
      peak_time = morning_peak > evening_peak ? "morning rush hour (7-10 AM)" : "evening rush hour (4-7 PM)"
      increase_pct = (([morning_peak, evening_peak].max / avg_value - 1) * 100).round
      
      {
        type: 'peak_detection',
        title: '🚗 Traffic-Related Pattern',
        insight: "Clear pollution spike during #{peak_time}.",
        detail: "#{increase_pct}% higher pollution during peak traffic compared to average",
        severity: increase_pct > 50 ? 'high' : 'moderate',
        actionable: true,
        action: "Avoid exercise or prolonged outdoor exposure during rush hours."
      }
    else
      {
        type: 'peak_detection',
        title: '🌟 No Major Peaks',
        insight: "No significant traffic-related pollution spikes detected.",
        detail: "Air quality remains relatively consistent throughout the day",
        severity: 'low',
        actionable: false
      }
    end
  end

  def generate_health_insights
    values = @data.map { |d| d[:aqi] || d['aqi'] }
    avg_aqi = values.sum / values.length.to_f
    max_aqi = values.max
    unhealthy_hours = values.count { |v| v > 100 }
    total_hours = values.length

    pct_unhealthy = (unhealthy_hours.to_f / total_hours * 100).round

    if avg_aqi <= 50
      health_level = "excellent"
      emoji = "💚"
      recommendation = "Perfect conditions for all outdoor activities"
    elsif avg_aqi <= 100
      health_level = "acceptable"
      emoji = "💛"
      recommendation = "Generally safe, sensitive individuals should monitor symptoms"
    elsif avg_aqi <= 150
      health_level = "concerning for sensitive groups"
      emoji = "🧡"
      recommendation = "Children, elderly, and those with respiratory conditions should limit prolonged outdoor exertion"
    else
      health_level = "unhealthy"
      emoji = "❤️"
      recommendation = "Everyone should reduce outdoor activities. Wear masks if going outside"
    end

    {
      type: 'health',
      title: "#{emoji} Health Impact Assessment",
      insight: "Average air quality is #{health_level} (AQI: #{avg_aqi.round}).",
      detail: "#{pct_unhealthy}% of measured hours exceeded healthy levels",
      severity: avg_aqi > 150 ? 'high' : (avg_aqi > 100 ? 'moderate' : 'low'),
      actionable: true,
      action: recommendation
    }
  end

  def detect_patterns
    {
      hourly: group_by_hour(@data),
      daily: analyze_daily_patterns,
      weekly: analyze_weekly_patterns
    }
  end

  def detect_anomalies
    values = @data.map { |d| d[:aqi] || d['aqi'] }
    avg = values.sum / values.length.to_f
    std_dev = Math.sqrt(values.map { |v| (v - avg) ** 2 }.sum / values.length)
    
    anomalies = @data.select do |point|
      aqi = point[:aqi] || point['aqi']
      (aqi - avg).abs > 2 * std_dev
    end

    anomalies.map do |point|
      {
        timestamp: point[:timestamp] || point['timestamp'],
        aqi: point[:aqi] || point['aqi'],
        deviation: ((point[:aqi] || point['aqi']) - avg).round,
        type: (point[:aqi] || point['aqi']) > avg ? 'spike' : 'drop'
      }
    end
  end

  def generate_predictions
    return [] if @data.length < 24

    # Use exponential smoothing for predictions
    alpha = 0.3 # Smoothing factor
    last_smoothed = @data.first[:aqi] || @data.first['aqi']
    
    @data.each do |point|
      current_value = point[:aqi] || point['aqi']
      last_smoothed = alpha * current_value + (1 - alpha) * last_smoothed
    end

    # Generate next 8 predictions (24 hours in 3-hour intervals)
    predictions = []
    current_hour = Time.now.hour
    
    8.times do |i|
      hour = (current_hour + i * 3) % 24
      hourly_data = group_by_hour(@data)
      
      # Blend historical pattern with smoothed trend
      historical_avg = hourly_data[hour] || last_smoothed
      predicted_value = (historical_avg * 0.6 + last_smoothed * 0.4).round
      
      predictions << {
        hours_ahead: i * 3,
        hour: hour,
        predicted_aqi: predicted_value,
        confidence: [95 - i * 5, 60].max
      }
    end

    predictions
  end

  def generate_summary
    insights = generate_insights
    return "Insufficient data for comprehensive analysis" if insights.empty?

    high_priority = insights.select { |i| i[:severity] == 'high' }
    actionable = insights.select { |i| i[:actionable] }

    if high_priority.any?
      main_insight = high_priority.first[:insight]
      action = actionable.first[:action] || "Monitor conditions closely"
      "⚠️ Alert: #{main_insight} #{action}"
    else
      moderate = insights.select { |i| i[:severity] == 'moderate' }.first
      if moderate
        "#{moderate[:insight]} #{moderate[:detail]}"
      else
        "✅ Air quality conditions are favorable with no concerning patterns detected."
      end
    end
  end

  def calculate_confidence
    # Confidence based on data quantity and quality
    data_points = @data.length
    
    if data_points < 24
      confidence = 50
    elsif data_points < 168 # Less than a week
      confidence = 70
    else
      confidence = 90
    end

    # Reduce confidence if high variability
    values = @data.map { |d| d[:aqi] || d['aqi'] }
    std_dev = Math.sqrt(values.map { |v| (v - values.sum / values.length.to_f) ** 2 }.sum / values.length)
    
    if std_dev > 30
      confidence -= 15
    elsif std_dev > 50
      confidence -= 25
    end

    [confidence, 50].max # Minimum 50% confidence
  end

  # Helper methods

  def group_by_hour(data)
    hourly = {}
    data.each do |point|
      hour = Time.parse(point[:timestamp] || point['timestamp']).hour
      aqi = point[:aqi] || point['aqi']
      hourly[hour] ||= []
      hourly[hour] << aqi
    end
    
    hourly.transform_values { |values| values.sum / values.length.to_f }
  end

  def analyze_daily_patterns
    days = {}
    @data.each do |point|
      date = Time.parse(point[:timestamp] || point['timestamp']).to_date
      days[date] ||= []
      days[date] << (point[:aqi] || point['aqi'])
    end
    
    days.transform_values { |values| values.sum / values.length.to_f }
  end

  def analyze_weekly_patterns
    weekdays = {}
    @data.each do |point|
      day = Time.parse(point[:timestamp] || point['timestamp']).wday
      weekdays[day] ||= []
      weekdays[day] << (point[:aqi] || point['aqi'])
    end
    
    weekdays.transform_values { |values| values.sum / values.length.to_f }
  end

  def calculate_slope(x, y)
    n = x.length
    sum_x = x.sum
    sum_y = y.sum
    sum_xy = x.zip(y).map { |xi, yi| xi * yi }.sum
    sum_x2 = x.map { |xi| xi ** 2 }.sum
    
    (n * sum_xy - sum_x * sum_y).to_f / (n * sum_x2 - sum_x ** 2)
  end

  def format_hour(hour)
    if hour == 0
      "12 AM"
    elsif hour < 12
      "#{hour} AM"
    elsif hour == 12
      "12 PM"
    else
      "#{hour - 12} PM"
    end
  end
end
