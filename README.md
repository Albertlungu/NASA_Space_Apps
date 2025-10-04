# 🌍 NASA TEMPO Air Quality Monitor

Real-time air quality monitoring application using NASA TEMPO satellite data with Ruby backend and React TypeScript frontend.

![NASA Space Apps Challenge](https://img.shields.io/badge/NASA-Space%20Apps%20Challenge-blue)
![Ruby](https://img.shields.io/badge/Ruby-3.4.6-red)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Frontend Pages](#-frontend-pages)
- [Configuration](#-configuration)
- [Performance](#-performance)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## ✨ Features

### Real-Time Monitoring
- 🌡️ **Live Air Quality Data** - PM2.5, NO2, O3, PM10 from 10,000+ stations
- 🛰️ **NASA TEMPO Satellite** - Real-time satellite pollution measurements
- 🌍 **30 World Cities** - Major cities across all continents
- 🗺️ **Interactive Map** - Click anywhere to query air quality data
- 🔄 **Auto-Refresh** - Updates every 15 minutes

### Analytics & Predictions
- 📊 **Historical Trends** - 7-day and monthly patterns
- 🔮 **24-Hour Forecast** - ML-based predictions with confidence intervals
- 📈 **Data Visualization** - Interactive charts and graphs
- 🎯 **Event Detection** - Identifies pollution spikes

### Health & Safety
- 💚 **Exposure Tracking** - Monitor your daily pollution exposure
- 🏥 **Health Recommendations** - Personalized advice based on AQI
- 🚨 **Alert System** - Real-time notifications for high pollution
- 📚 **Educational Resources** - Learn about air quality and health

### User Experience
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Modern UI** - Shadcn UI + Tailwind CSS
- ⚡ **Fast Loading** - Optimized with caching (1-2 second load times)
- 🌈 **Color-Coded AQI** - EPA standard color scale

---

## 🛠️ Tech Stack

### Backend
- **Ruby** 3.4.6
- **Sinatra** 3.2.0 - Web framework
- **SQLite3** - Database
- **HTTParty** - API client
- **Dotenv** - Environment configuration

### Frontend
- **React** 18.3.1
- **TypeScript** 5.8.3
- **Vite** 5.4.19 - Build tool
- **TanStack React Query** - Data fetching & caching
- **Shadcn UI** - Component library
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Google Maps API** - Interactive mapping
- **React Router** - Navigation

### APIs
- **OpenAQ** - Air quality data
- **NASA TEMPO** - Satellite measurements
- **OpenWeatherMap** - Weather data

---

## 🚀 Quick Start

### Prerequisites
- Ruby 3.4.6+
- Node.js 18+
- npm or yarn

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/NASA_Space_Apps.git
cd NASA_Space_Apps
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
bundle install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys:
# - OPENAQ_API_KEY
# - NASA_EARTHDATA_TOKEN
# - WEATHER_API_KEY

# Start server
ruby app.rb
```

Backend runs on `http://localhost:4567`

### 3. Frontend Setup

```bash
# From project root
npm install

# Set up environment
echo "VITE_API_URL=http://localhost:4567" > .env.local

# Start development server
npm run dev
```

Frontend runs on `http://localhost:8080`

### 4. Access Application

Open your browser to `http://localhost:8080`

---

## 📁 Project Structure

```
NASA_Space_Apps/
├── backend/
│   ├── app.rb                 # Main API server
│   ├── Gemfile                # Ruby dependencies
│   ├── db/
│   │   └── setup.rb          # Database schema
│   ├── lib/
│   │   ├── openaq_client.rb  # OpenAQ API client
│   │   ├── tempo_client.rb   # NASA TEMPO client
│   │   └── weather_client.rb # Weather API client
│   └── .env                   # Backend configuration
├── src/
│   ├── pages/                 # React pages
│   │   ├── Index.tsx         # Home page
│   │   ├── Dashboard.tsx     # Real-time monitoring
│   │   ├── Map.tsx           # Interactive map
│   │   ├── Forecast.tsx      # 24-hour predictions
│   │   ├── Analytics.tsx     # Historical data
│   │   ├── Health.tsx        # Health recommendations
│   │   └── Education.tsx     # Learning resources
│   ├── components/            # React components
│   ├── hooks/                 # Custom hooks
│   │   ├── useAirQuality.ts  # Air quality data hook
│   │   └── useGeolocation.ts # Location detection
│   ├── lib/
│   │   └── api.ts            # API client
│   └── main.tsx              # App entry point
├── .env.local                 # Frontend configuration
├── package.json               # Node dependencies
└── README.md                  # This file
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:4567/api
```

### Endpoints

#### Air Quality
```bash
# Get air quality by pollutant
GET /air-quality/:pollutant?lat={lat}&lon={lon}&radius={radius}&limit={limit}

# Pollutants: pm25, pm10, no2, o3, so2, co
```

#### NASA TEMPO Data
```bash
# Get satellite data
GET /tempo?lat={lat}&lon={lon}
```

#### Historical Data
```bash
# Get historical trends
GET /historical?pollutant={pollutant}&lat={lat}&lon={lon}&days={days}
```

#### Weather
```bash
# Get weather data
GET /weather?lat={lat}&lon={lon}
```

#### Predictions
```bash
# Predict danger zones
POST /predictions/danger-zones
Body: { "lat": 40.7128, "lon": -74.006, "hours": 24 }

# Health predictions
POST /predictions/health
Body: { "symptoms": ["cough"], "exposure_level": 150 }
```

#### Alerts
```bash
# Get active alerts
GET /alerts?lat={lat}&lon={lon}

# Subscribe to alerts
POST /alerts/subscribe
Body: { "user_id": 1, "threshold": 100 }
```

#### User Exposure
```bash
# Create user
POST /users
Body: { "email": "user@example.com", "name": "John" }

# Track exposure
POST /users/:id/exposure
Body: { "pollutant": "pm25", "value": 45, "duration_minutes": 60 }

# Get exposure data
GET /users/:id/exposure?days={days}
```

---

## 🖥️ Frontend Pages

### 1. Home (`/`)
- Quick overview of current air quality
- Featured cities with live AQI
- Navigation to all features

### 2. Dashboard (`/dashboard`)
- Real-time air quality monitoring
- Current pollutant levels (PM2.5, NO2, O3, PM10)
- Nearby monitoring stations
- Alert panel
- Exposure tracker

### 3. Interactive Map (`/map`)
- **30 major world cities** with real-time data
- **Click-to-query** - Click anywhere for air quality data
- Color-coded markers by AQI level
- Satellite/roadmap toggle
- TEMPO satellite data panel

### 4. 24-Hour Forecast (`/forecast`)
- ML-based predictions
- 8 data points (3-hour intervals)
- Confidence levels
- Dynamic summary

### 5. Analytics (`/analytics`)
- 7-day AQI trends (area charts)
- Pollutant breakdown (bar charts)
- Monthly patterns (line charts)
- Event detection (pollution spikes)
- Weather correlation

### 6. Health (`/health`)
- Personalized recommendations
- Activity suggestions
- Sensitive group warnings
- Health impact information

### 7. Education (`/education`)
- Learn about pollutants
- Health effects
- Protection measures
- AQI scale explanation

---

## ⚙️ Configuration

### Backend Environment Variables (`.env`)

```bash
# API Keys (Required)
OPENAQ_API_KEY=your_openaq_api_key
NASA_EARTHDATA_TOKEN=your_nasa_token
WEATHER_API_KEY=your_weather_api_key

# Server Configuration
PORT=4567
RACK_ENV=development
FRONTEND_URL=http://localhost:8080

# Optional: Notifications
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Optional: Redis
REDIS_URL=redis://localhost:6379/0
```

### Frontend Environment Variables (`.env.local`)

```bash
# Backend API URL
VITE_API_URL=http://localhost:4567

# Mapbox API Token (for map feature)
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### Getting API Keys

1. **OpenAQ API**: https://openaq.org/
2. **NASA Earthdata**: https://urs.earthdata.nasa.gov/
3. **OpenWeatherMap**: https://openweathermap.org/api
4. **Mapbox**: https://account.mapbox.com/ (Free tier: 50,000 map loads/month)

---

## ⚡ Performance

### Optimizations Implemented

- **React Query Caching** - 1-hour cache for historical data
- **Memoization** - useMemo for expensive calculations
- **Lazy Loading** - Components load on demand
- **API Call Reduction** - 66% fewer calls (12 → 4)
- **Loading States** - Skeleton screens and spinners

### Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Historical Data Load | 5-10s | 1-2s | 80% faster |
| Cached Data Load | N/A | Instant | ∞ faster |
| API Calls per Page | 12 | 4 | 66% reduction |

---

## 🎨 Color Coding (EPA AQI Scale)

- 🟢 **Good** (0-50): Air quality is satisfactory
- 🟡 **Moderate** (51-100): Acceptable for most people
- 🟠 **Unhealthy for Sensitive Groups** (101-150): Sensitive groups may experience effects
- 🔴 **Unhealthy** (151-200): Everyone may experience effects
- 🟣 **Very Unhealthy** (201-300): Health alert
- 🟤 **Hazardous** (301+): Health warnings of emergency conditions

---

## 🐛 Troubleshooting

### Backend Issues

**Port 4567 already in use:**
```bash
lsof -ti:4567 | xargs kill -9
ruby app.rb
```

**Missing API keys:**
- Check `.env` file exists
- Verify all required keys are set
- Restart backend after adding keys

**Database errors:**
```bash
cd backend
ruby db/setup.rb
```

### Frontend Issues

**CORS errors:**
- Ensure backend `.env` has `FRONTEND_URL=http://localhost:8080`
- Restart backend

**Map not loading:**
- Google Maps requires billing enabled
- Alternative: Use Leaflet (free)

**Data not loading:**
- Check backend is running on port 4567
- Verify API keys are valid
- Check browser console for errors

**Historical data slow:**
- First load takes 1-2 seconds
- Subsequent loads are instant (cached)
- Clear cache: Hard refresh (Ctrl+Shift+R)

---

## 🧪 Testing

### Test Backend

```bash
# Health check
curl http://localhost:4567

# Test air quality endpoint
curl "http://localhost:4567/api/air-quality/pm25?lat=40.7128&lon=-74.006"

# Test historical data
curl "http://localhost:4567/api/historical?pollutant=pm25&days=7"
```

### Test Frontend

1. Navigate to http://localhost:8080
2. Check all pages load
3. Test interactive features:
   - Click city markers on map
   - Click custom locations
   - Switch pollutants
   - View charts

---

## 📚 Additional Documentation

- `backend/API_REFERENCE.md` - Detailed API documentation
- `COMMIT_SUMMARY.md` - Complete project overview
- `PERFORMANCE_OPTIMIZATION.md` - Performance improvements
- `GOOGLE_MAPS_SETUP.md` - Map configuration guide

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🏆 NASA Space Apps Challenge

This project was created for the NASA Space Apps Challenge 2024.

**Challenge**: Monitor air quality using NASA TEMPO satellite data

**Team**: [Your Team Name]

**Features**:
- ✅ Real-time air quality monitoring
- ✅ NASA TEMPO satellite integration
- ✅ Interactive world map
- ✅ 24-hour predictions
- ✅ Health recommendations
- ✅ Educational resources

---

## 🙏 Acknowledgments

- **NASA TEMPO** - Satellite data
- **OpenAQ** - Air quality measurements
- **OpenWeatherMap** - Weather data
- **Shadcn UI** - Component library
- **React Community** - Amazing ecosystem

---

## 📞 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for cleaner air and healthier communities** 🌍
