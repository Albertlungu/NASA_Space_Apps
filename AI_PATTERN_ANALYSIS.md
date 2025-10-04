# 🧠 AI Pattern Analysis System

## Overview

An intelligent pattern analysis system that examines historical air quality data to identify trends, anomalies, and generate human-readable insights for better decision-making.

## 🎯 Features

### 1. **Automated Pattern Detection**
- **Hourly Patterns**: Identifies peak pollution times and cleaner hours throughout the day
- **Trend Analysis**: Detects improving, worsening, or stable air quality trends
- **Variability Assessment**: Measures air quality stability and predictability
- **Peak Detection**: Identifies traffic-related pollution spikes
- **Health Impact**: Provides health-based recommendations

### 2. **Smart Insights Generation**
Each insight includes:
- **Title**: Clear, emoji-enhanced heading
- **Insight**: Main finding in simple language
- **Detail**: Additional context and statistics
- **Severity**: High, moderate, or low priority
- **Actionable Recommendations**: Specific advice when applicable

### 3. **Confidence Scoring**
- Based on data quantity and quality
- Adjusted for data variability
- Minimum 50% confidence threshold

## 🏗️ Architecture

### Backend (`/backend`)

#### **Pattern Analysis Service** (`services/pattern_analysis_service.rb`)
Core AI engine that performs:
- Linear regression for trend analysis
- Statistical analysis (mean, variance, coefficient of variation)
- Time-series pattern recognition
- Anomaly detection (2σ outliers)
- Exponential smoothing for predictions

**Key Methods:**
```ruby
# Main analysis entry point
def analyze
  {
    insights: generate_insights,
    patterns: detect_patterns,
    anomalies: detect_anomalies,
    predictions: generate_predictions,
    summary: generate_summary,
    confidence: calculate_confidence
  }
end
```

**Analysis Types:**
1. **Hourly Pattern Analysis**: Groups data by hour, identifies peaks and clean periods
2. **Trend Analysis**: Calculates slope of AQI over time using linear regression
3. **Variability Analysis**: Computes coefficient of variation (CV)
4. **Peak Detection**: Identifies rush hour pollution patterns
5. **Health Assessment**: Evaluates average AQI and provides health recommendations

#### **API Endpoint**
```
GET /api/pattern-insights?pollutant=pm25&lat={lat}&lon={lon}&days=7
```

**Response:**
```json
{
  "status": "ok",
  "pollutant": "pm25",
  "days": 7,
  "data_points": 168,
  "analysis": {
    "insights": [
      {
        "type": "hourly_pattern",
        "title": "⏰ Daily Pattern Detected",
        "insight": "Air quality peaks during 5-7 PM and improves during 6-9 AM",
        "detail": "67% better air quality during off-peak hours",
        "severity": "high",
        "actionable": true,
        "action": "Plan outdoor activities between 6-9 AM for healthier air"
      }
    ],
    "patterns": {
      "hourly": { "0": 45, "1": 42, ... },
      "daily": { "2024-01-01": 65, ... },
      "weekly": { "0": 60, "1": 65, ... }
    },
    "anomalies": [
      {
        "timestamp": "2024-01-01T15:00:00Z",
        "aqi": 150,
        "deviation": 45,
        "type": "spike"
      }
    ],
    "predictions": [
      {
        "hours_ahead": 3,
        "hour": 15,
        "predicted_aqi": 75,
        "confidence": 90
      }
    ],
    "summary": "⚠️ Alert: Air quality peaks during evening rush hour...",
    "confidence": 75
  }
}
```

### Frontend (`/src`)

#### **API Integration** (`lib/api.ts`)
```typescript
export interface PatternInsight {
  type: string;
  title: string;
  insight: string;
  detail: string;
  severity: string;
  actionable: boolean;
  action?: string;
}

async getPatternInsights(
  pollutant: string,
  lat: number,
  lon: number,
  days = 7
): Promise<PatternAnalysisResponse>
```

#### **React Hook** (`hooks/useAirQuality.ts`)
```typescript
export function usePatternInsights(
  lat: number | undefined,
  lon: number | undefined,
  pollutant: string,
  days = 7
) {
  return useQuery({
    queryKey: ['pattern-insights', lat, lon, pollutant, days],
    queryFn: () => api.getPatternInsights(pollutant, lat, lon, days),
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });
}
```

#### **UI Component** (`components/PatternInsights.tsx`)
Displays insights with:
- Color-coded severity indicators
- Icon-based visual cues
- Actionable recommendations
- Confidence badge
- Responsive grid layout

#### **Integration** (`components/ForecastView.tsx`)
Pattern insights appear below the 24-hour forecast on `/forecast` page

## 📊 Insight Types

### 1. Hourly Pattern
- Identifies best and worst times of day
- Calculates improvement percentage
- Recommends optimal activity times

### 2. Trend Analysis
- Stable, improving, or worsening trend
- Percentage change over period
- Alerts for concerning trends

### 3. Variability
- Measures air quality stability
- Coefficient of variation (CV) metric
- Warns about unpredictable conditions

### 4. Peak Detection
- Identifies traffic-related patterns
- Morning/evening rush hour spikes
- Activity recommendations

### 5. Health Impact
- Average AQI assessment
- Percentage of unhealthy hours
- Group-specific recommendations

## 🔬 Algorithms

### Linear Regression (Trend Detection)
```ruby
slope = (n * Σ(xy) - Σx * Σy) / (n * Σ(x²) - (Σx)²)
```

### Coefficient of Variation (Stability)
```ruby
CV = (standard_deviation / mean) * 100
```

### Anomaly Detection
```ruby
anomaly if |value - mean| > 2 * standard_deviation
```

### Exponential Smoothing (Predictions)
```ruby
S_t = α * Y_t + (1 - α) * S_{t-1}
where α = 0.3 (smoothing factor)
```

## 🚀 Usage

### 1. **Seed Sample Data** (for testing)
```bash
cd backend
ruby seed_sample_data.rb
```

### 2. **Start Backend**
```bash
cd backend
ruby app.rb
```

### 3. **Start Frontend**
```bash
npm run dev
```

### 4. **View Insights**
Navigate to: `http://localhost:8080/forecast`

## 📈 Example Insights

### High Severity - Actionable
```
⏰ Daily Pattern Detected
Air quality typically peaks during 5-7 PM and improves during 6-9 AM.
67% better air quality during off-peak hours

💡 Plan outdoor activities between 6-9 AM for healthier air exposure.
```

### Moderate Severity
```
📈 Trend Analysis
Overall air quality is worsening.
Air quality has declined by approximately 15% over the period

💡 Monitor conditions closely and consider reducing outdoor exposure.
```

### Low Severity
```
✅ No Major Peaks
No significant traffic-related pollution spikes detected.
Air quality remains relatively consistent throughout the day
```

## 🎨 UI Design

### Color Coding
- **High Severity**: Red border/background
- **Moderate Severity**: Yellow/orange
- **Low Severity**: Green/blue

### Icons
- ⏰ Hourly patterns
- 📈 Trends
- ⚡ Variability
- 🚗 Traffic peaks
- 💚 Health impact

### Layout
- AI Summary card at top
- Insights in responsive grid (1-2 columns)
- Confidence badge
- Actionable recommendations highlighted

## 🔧 Configuration

### Data Requirements
- **Minimum**: 24 hours of data
- **Optimal**: 7 days of hourly data
- **Location-based**: Within ±0.5° lat/lon

### Caching
- Frontend: 30 minutes
- Confidence decreases with data age

### Customization
Edit `services/pattern_analysis_service.rb`:
- Adjust sensitivity thresholds
- Modify pattern detection logic
- Add new insight types
- Customize recommendations

## 🧪 Testing

### Test API Endpoint
```bash
curl "http://localhost:4567/api/pattern-insights?pollutant=pm25&lat=40.7128&lon=-74.006&days=7" | jq .
```

### Verify Insights
```bash
curl -s "http://localhost:4567/api/pattern-insights?pollutant=pm25&lat=40.7128&lon=-74.006&days=7" | \
  jq '.analysis.insights[] | {title, severity, actionable}'
```

## 📝 Future Enhancements

1. **Machine Learning Integration**
   - LSTM networks for better predictions
   - Clustering for pattern classification
   - Ensemble methods for confidence boosting

2. **Additional Patterns**
   - Weekly patterns (weekday vs weekend)
   - Seasonal trends
   - Weather correlation
   - Event-based analysis

3. **Advanced Features**
   - Multi-pollutant correlation
   - Spatial pattern analysis
   - Real-time alert triggers
   - Personalized recommendations

4. **Visualization**
   - Pattern heatmaps
   - Trend charts
   - Anomaly highlighting
   - Prediction confidence intervals

## 🤝 Contributing

To add new insight types:

1. Add method to `PatternAnalysisService`
2. Include in `generate_insights` array
3. Update TypeScript interface in `api.ts`
4. Add icon/styling to `PatternInsights.tsx`

## 📚 References

- EPA AQI Standards
- Time-series analysis techniques
- Statistical outlier detection
- Exponential smoothing methods

---

**Built with intelligence for cleaner air and healthier communities** 🌍
