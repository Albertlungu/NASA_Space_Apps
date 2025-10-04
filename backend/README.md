# NASA TEMPO Air Quality Monitoring Backend

Comprehensive Ruby/Sinatra API for real-time air quality monitoring, predictions, and user exposure tracking.

## Features

✅ **Real-time Air Quality Data**
- OpenAQ API integration for ground-based measurements
- NASA TEMPO satellite data integration
- Multiple pollutant tracking (NO2, PM2.5, O3, etc.)
- AQI calculation and categorization

✅ **Historical Data & Graphs**
- Time-series data for trend analysis
- Hourly/daily/weekly aggregations
- Location-based filtering

✅ **ML Predictions**
- Dangerous zone prediction
- Health risk assessment based on symptoms
- Pollution factor identification

✅ **User Tracking**
- Personalized cumulative exposure tracking (like fitness tracker)
- Daily/weekly exposure summaries
- Exposure history

✅ **Alert System**
- Real-time air quality alerts
- Location-based notifications
- Browser notifications ready
- SMS notifications (via Twilio)

✅ **Weather Integration**
- Current weather data
- Correlation with air quality

## Tech Stack

- **Framework:** Sinatra (Ruby)
- **Database:** SQLite (easily upgradeable to PostgreSQL)
- **APIs:** OpenAQ, NASA Earthdata, OpenWeatherMap
- **CORS:** Enabled for React frontend

## Setup

### 1. Install Dependencies

```bash
cd backend
bundle install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Required
OPENAQ_API_KEY=your_openaq_api_key_here

# Optional but recommended
NASA_EARTHDATA_TOKEN=your_nasa_earthdata_token_here
WEATHER_API_KEY=your_openweathermap_api_key_here

# For SMS notifications (optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

#### Getting API Keys:

- **OpenAQ:** Sign up at https://openaq.org/
- **NASA Earthdata:** Register at https://urs.earthdata.nasa.gov/
- **OpenWeatherMap:** Get free key at https://openweathermap.org/api
- **Twilio (optional):** Sign up at https://www.twilio.com/

### 3. Setup Database

```bash
# Create database and run migrations
rake db:create
rake db:migrate

# Optional: Seed with sample data
rake db:seed
```

### 4. Run the Server

```bash
# Development mode with auto-reload
bundle exec rerun 'ruby app.rb'

# Or production mode
bundle exec ruby app.rb

# Or with Puma
bundle exec puma config.ru
```

The server will start on `http://localhost:4567`

## API Documentation

### Base URL
```
http://localhost:4567
```

### Endpoints

#### 🌍 Air Quality

**Get real-time air quality data**
```
GET /api/air-quality?lat=40.7128&lon=-74.0060&radius=25000&limit=100
```

**Get specific pollutant measurements**
```
GET /api/air-quality/:pollutant?lat=40.7128&lon=-74.0060&radius=25000&limit=100

Pollutants: no2, pm25, pm10, o3, so2, co
```

**Get NASA TEMPO satellite data**
```
GET /api/tempo?lat=40.7128&lon=-74.0060
```

**Get historical trends (for graphs)**
```
GET /api/historical?pollutant=no2&lat=40.7128&lon=-74.0060&days=7
```

**Get weather data**
```
GET /api/weather?lat=40.7128&lon=-74.0060
```

#### 🔮 Predictions

**Predict dangerous pollution zones**
```
POST /api/predictions/danger-zones
Content-Type: application/json

{
  "lat": 40.7128,
  "lon": -74.0060,
  "hours": 24
}
```

**Health prediction based on symptoms**
```
POST /api/predictions/health
Content-Type: application/json

{
  "symptoms": ["cough", "headache", "eye irritation"],
  "exposure_level": 150
}
```

#### 👤 User Tracking

**Create/update user**
```
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "notification_preferences": {
    "email": true,
    "sms": false,
    "browser": true
  }
}
```

**Track user exposure**
```
POST /api/users/:id/exposure
Content-Type: application/json

{
  "pollutant": "pm25",
  "value": 45.5,
  "duration_minutes": 60,
  "lat": 40.7128,
  "lon": -74.0060
}
```

**Get user exposure history**
```
GET /api/users/:id/exposure?days=7
```

#### 🚨 Alerts

**Get active alerts for location**
```
GET /api/alerts?lat=40.7128&lon=-74.0060
```

**Subscribe to alerts**
```
POST /api/alerts/subscribe
Content-Type: application/json

{
  "user_id": 1,
  "threshold": 100,
  "notification_preferences": {
    "email": true,
    "sms": true
  }
}
```

## Response Format

All endpoints return JSON with the following structure:

**Success:**
```json
{
  "status": "ok",
  "data": { ... }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

## AQI Categories

| AQI Range | Level | Color | Description |
|-----------|-------|-------|-------------|
| 0-50 | Good | Green | Air quality is satisfactory |
| 51-100 | Moderate | Yellow | Acceptable for most people |
| 101-150 | Unhealthy for Sensitive Groups | Orange | Sensitive groups may experience effects |
| 151-200 | Unhealthy | Red | Everyone may experience health effects |
| 201-300 | Very Unhealthy | Purple | Health alert |
| 301+ | Hazardous | Maroon | Emergency conditions |

## Database Schema

### Users
- `id`, `email`, `name`, `phone`
- `cumulative_exposure`, `alert_threshold`
- `notification_preferences`

### AirQualityReadings
- `pollutant`, `value`, `unit`
- `latitude`, `longitude`
- `location_name`, `city`, `country`
- `aqi`, `measured_at`

### UserExposures
- `user_id`, `pollutant`, `value`
- `duration_minutes`
- `latitude`, `longitude`
- `recorded_at`

### Alerts
- `user_id`, `severity`, `pollutant`
- `aqi`, `latitude`, `longitude`
- `message`, `active`, `expires_at`

## Frontend Integration

### CORS
CORS is enabled for `http://localhost:3000` by default. Update `FRONTEND_URL` in `.env` for production.

### Example React Fetch

```javascript
// Get air quality data
const response = await fetch(
  'http://localhost:4567/api/air-quality/pm25?lat=40.7128&lon=-74.0060'
);
const data = await response.json();

// Track user exposure
await fetch('http://localhost:4567/api/users/1/exposure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pollutant: 'pm25',
    value: 45.5,
    duration_minutes: 60,
    lat: 40.7128,
    lon: -74.0060
  })
});
```

## Development

### Database Tasks

```bash
# Create database
rake db:create

# Run migrations
rake db:migrate

# Rollback last migration
rake db:rollback

# Reset database (drop, create, migrate)
rake db:reset

# Seed with sample data
rake db:seed
```

### Auto-reload in Development

```bash
bundle exec rerun 'ruby app.rb'
```

## Production Deployment

### Heroku

```bash
# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set OPENAQ_API_KEY=your_key
heroku config:set WEATHER_API_KEY=your_key

# Deploy
git push heroku main
```

### Docker

```dockerfile
FROM ruby:3.2
WORKDIR /app
COPY Gemfile* ./
RUN bundle install
COPY . .
CMD ["bundle", "exec", "puma", "config.ru"]
```

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Background jobs for periodic data fetching
- [ ] Advanced ML models for predictions
- [ ] Integration with NASA FIRMS for wildfire data
- [ ] Traffic data integration
- [ ] Industrial zone mapping
- [ ] Push notifications via FCM
- [ ] GraphQL API option

## Contributing

This is a hackathon project for NASA Space Apps Challenge. Feel free to extend and improve!

## License

MIT

## Team

**Backend:** Kashyap, Albert  
**Frontend:** Ak, Sean

---

Built for NASA Space Apps Challenge 2025 🚀
