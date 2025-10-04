# Quick Start Guide

Get the backend running in 5 minutes!

## Prerequisites

- Ruby 3.0+ installed
- Bundler installed (`gem install bundler`)

## Setup Steps

### 1. Install Dependencies

```bash
cd backend
bundle install
```

### 2. Get API Keys (Free!)

**OpenAQ (Required):**
1. Go to https://openaq.org/
2. Sign up for a free account
3. Get your API key from the dashboard

**OpenWeatherMap (Optional but recommended):**
1. Go to https://openweathermap.org/api
2. Sign up for free
3. Get your API key

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAQ API key:
```env
OPENAQ_API_KEY=your_actual_key_here
WEATHER_API_KEY=your_weather_key_here  # optional
```

### 4. Setup Database

```bash
rake db:create
rake db:migrate
rake db:seed  # Optional: adds sample data
```

### 5. Start Server

**Option A: Using the start script (recommended)**
```bash
chmod +x start.sh
./start.sh
```

**Option B: Manual start**
```bash
bundle exec rerun 'ruby app.rb'
```

The server will start on `http://localhost:4567`

## Test It!

Open your browser and go to:
```
http://localhost:4567
```

You should see:
```json
{
  "message": "NASA TEMPO Air Quality API 🚀",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

## Try Some API Calls

**Get air quality for New York:**
```bash
curl "http://localhost:4567/api/air-quality/pm25?lat=40.7128&lon=-74.0060"
```

**Get historical data:**
```bash
curl "http://localhost:4567/api/historical?pollutant=no2&lat=40.7128&lon=-74.0060&days=7"
```

**Create a user:**
```bash
curl -X POST http://localhost:4567/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

## Frontend Integration

Your React frontend can now connect to:
```
http://localhost:4567/api/*
```

CORS is already configured for `http://localhost:3000`

## Common Issues

**"Database not found"**
```bash
rake db:create
rake db:migrate
```

**"API key invalid"**
- Check your `.env` file
- Make sure you copied the key correctly from OpenAQ
- Restart the server after changing `.env`

**"Port 4567 already in use"**
```bash
# Find and kill the process
lsof -ti:4567 | xargs kill -9
```

## Next Steps

1. ✅ Backend is running
2. 🎨 Start your React frontend
3. 🔗 Connect frontend to `http://localhost:4567/api/*`
4. 🚀 Build amazing features!

## Need Help?

Check the full README.md for:
- Complete API documentation
- All available endpoints
- Database schema
- Deployment guides

---

Happy coding! 🚀
