# 🤖 ML Air Quality Predictions

## Overview

The system now includes machine learning-based air quality predictions using an **exponential smoothing** algorithm that analyzes historical patterns, time-of-day trends, and optional weather conditions.

## How It Works

### Algorithm: Exponential Smoothing

The predictor uses a weighted moving average that gives more importance to recent observations:

```
smoothed = α × current_value + (1-α) × previous_smoothed
```

Where `α = 0.3` (smoothing factor)

### Features Used

1. **Historical Trend**
   - Analyzes past 48 hours of data
   - Applies exponential smoothing to recent values
   - Identifies baseline pollution levels

2. **Time of Day Patterns**
   - Calculates average AQI for each hour
   - Adjusts predictions based on typical hourly patterns
   - Accounts for rush hour peaks (7-9 AM, 5-7 PM)

3. **Weather Conditions** (Optional)
   - Temperature effects on particle dispersion
   - Humidity impact on PM2.5 levels
   - Requires WeatherAPI key

### Prediction Process

```
Step 1: Fetch historical data (last 48 hours)
        ↓
Step 2: Calculate exponential smoothed baseline
        ↓
Step 3: Apply time-of-day adjustment factor
        ↓
Step 4: Apply weather adjustment (if available)
        ↓
Step 5: Generate 24-hour forecast
        ↓
Result: Next-hour + 24 hourly predictions with confidence scores
```

## API Endpoint

### GET `/api/predictions`

**Parameters:**
- `pollutant` (string, default: 'pm25') - Pollutant type
- `lat` (float, required) - Latitude
- `lon` (float, required) - Longitude
- `hours_back` (integer, default: 48) - Hours of historical data to analyze

**Example Request:**
```bash
curl "http://localhost:4567/api/predictions?pollutant=pm25&lat=40.7128&lon=-74.006&hours_back=48"
```

**Example Response:**
```json
{
  "status": "ok",
  "prediction": {
    "next_hour": {
      "value": 23.45,
      "aqi": 59,
      "timestamp": "2025-10-04T21:14:44Z"
    },
    "hourly": [
      {
        "hours_ahead": 0,
        "hour": 20,
        "predicted_value": 23.45,
        "predicted_aqi": 59,
        "confidence": 100
      },
      {
        "hours_ahead": 1,
        "hour": 21,
        "predicted_value": 25.12,
        "predicted_aqi": 65,
        "confidence": 97
      }
      // ... 22 more hourly predictions
    ]
  },
  "model": "exponential_smoothing",
  "confidence": 83.52,
  "historical_avg": 27.34,
  "features_used": [
    "historical_trend",
    "weather_conditions",
    "time_of_day"
  ]
}
```

## Frontend Integration

### Page: `/forecast`

Visit **http://localhost:8080/forecast** to see:

1. **Next Hour Prediction** (Large display)
   - Predicted AQI value
   - Air quality category
   - PM2.5 concentration
   - Timestamp

2. **24-Hour Forecast Table**
   - Hourly predictions
   - Confidence levels (decreases with time)
   - Color-coded AQI categories

3. **Model Information**
   - Algorithm details
   - Overall confidence score
   - Features used
   - Historical baseline

## Confidence Calculation

Confidence score is based on:

1. **Data Quantity**: More historical points = higher confidence
   ```
   base_confidence = min(historical_points × 2, 100)
   ```

2. **Data Recency**: Fresher data = higher confidence
   ```
   age_penalty = min(hours_since_latest × 2, 30)
   final_confidence = base_confidence - age_penalty
   ```

3. **Time Horizon**: Confidence decreases for future predictions
   ```
   hourly_confidence = max(100 - (hours_ahead × 3), 50)
   ```

## Code Structure

### Backend

**Service**: `backend/services/ml_predictor_service.rb`
- Main prediction logic
- Exponential smoothing algorithm
- Time-of-day pattern analysis
- Weather integration (optional)

**Endpoint**: `backend/app.rb` (Line 485)
- `/api/predictions` route
- Parameter validation
- Error handling

### Frontend

**Component**: `src/components/PredictionsView.tsx`
- Fetches predictions from API
- Displays next-hour prediction
- Shows 24-hour forecast table
- Renders model information

**Page**: `src/pages/Forecast.tsx`
- Integrates PredictionsView component
- Navigation wrapper

## Usage Examples

### 1. Get Predictions for New York

```bash
curl "http://localhost:4567/api/predictions?pollutant=pm25&lat=40.7128&lon=-74.006" | jq
```

### 2. Check Next Hour Only

```bash
curl -s "http://localhost:4567/api/predictions?pollutant=pm25&lat=40.7128&lon=-74.006" | jq '.prediction.next_hour'
```

Output:
```json
{
  "value": 23.45,
  "aqi": 59,
  "timestamp": "2025-10-04T21:14:44Z"
}
```

### 3. Get Confidence Score

```bash
curl -s "http://localhost:4567/api/predictions?pollutant=pm25&lat=40.7128&lon=-74.006" | jq '{model, confidence, historical_avg}'
```

Output:
```json
{
  "model": "exponential_smoothing",
  "confidence": 83.52,
  "historical_avg": 27.34
}
```

## Adding Weather API (Optional Enhancement)

To include weather conditions in predictions:

1. **Get WeatherAPI Key**
   - Sign up at https://www.weatherapi.com/
   - Free tier: 1M calls/month

2. **Add to `.env`**
   ```bash
   WEATHERAPI_KEY=your_key_here
   ```

3. **Restart Backend**
   ```bash
   cd backend
   ruby app.rb
   ```

4. **Weather Effects**
   - Higher temperature → slight increase in PM2.5
   - Higher humidity → slight increase in PM2.5
   - Applied as multiplier: `1.0 + temp_effect + humidity_effect`

## Comparison with Original Ruby Code

### Original `aq_predictor.rb`:
- ✅ OpenAQ API integration
- ✅ WeatherAPI integration
- ✅ TEMPO CSV loading
- ✅ Random Forest model (Rumale gem)
- ✅ Train/test split
- ❌ Requires Rumale, Daru gems

### Adapted Version:
- ✅ Uses local database (no external OpenAQ calls during prediction)
- ✅ Optional WeatherAPI integration
- ✅ Exponential smoothing (no ML library needed)
- ✅ Time-of-day pattern detection
- ✅ Simpler, faster, no heavy dependencies
- ✅ Production-ready

## Performance

- **Response Time**: ~50-200ms
- **Data Required**: Minimum 10 historical readings
- **Optimal Data**: 48+ hours of hourly data
- **Prediction Horizon**: 24 hours ahead
- **Confidence**: 50-100% (decreases with time)

## Limitations

1. **Requires Historical Data**
   - Needs at least 10 readings in database
   - More data = better predictions

2. **Simple Model**
   - Exponential smoothing, not deep learning
   - Good for short-term trends
   - May miss complex patterns

3. **Weather Optional**
   - Works without weather API
   - Weather improves accuracy slightly

4. **Local Patterns Only**
   - Predicts based on local historical data
   - Doesn't account for distant pollution sources

## Future Enhancements

### Potential Improvements:

1. **Advanced ML Models**
   - LSTM/GRU for time series
   - Random Forest/XGBoost
   - Ensemble methods

2. **More Features**
   - Wind speed/direction
   - Traffic patterns
   - Seasonal trends
   - Holiday effects

3. **External Data**
   - TEMPO satellite data
   - Traffic APIs
   - Industrial emissions

4. **Longer Horizons**
   - 3-day forecasts
   - Weekly trends
   - Seasonal predictions

## Testing

### Verify Predictions Work

```bash
# Test endpoint
curl -s "http://localhost:4567/api/predictions?pollutant=pm25&lat=40.7128&lon=-74.006" | jq '.status'
# Should return: "ok"

# Check data count
curl -s "http://localhost:4567/api/predictions?pollutant=pm25&lat=40.7128&lon=-74.006" | jq '.prediction.hourly | length'
# Should return: 24

# View on website
open http://localhost:8080/forecast
```

## Troubleshooting

### Error: "No historical data available"

**Solution**: Seed the database with data
```bash
cd backend
ruby -e "require './db/seeds.rb'"
```

### Error: "Could not fetch weather data"

**Solution**: Add WeatherAPI key or ignore (predictions work without weather)

### Low Confidence Score

**Cause**: Not enough recent data
**Solution**: 
- Collect more historical data
- Use longer `hours_back` parameter
- Ensure data is recent (< 24 hours old)

## Summary

The ML prediction system provides **real-time air quality forecasts** using:
- ✅ Historical pattern analysis
- ✅ Time-of-day trends
- ✅ Exponential smoothing algorithm
- ✅ 24-hour horizon
- ✅ Confidence scoring
- ✅ Simple, fast, production-ready

**Visit http://localhost:8080/forecast to see predictions!** 🚀
