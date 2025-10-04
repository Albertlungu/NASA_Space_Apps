# API Reference for Frontend Team

Quick reference for integrating the backend with your React frontend.

## Base URL
```
http://localhost:4567
```

## All Endpoints

### 🌍 Air Quality Data

#### Get Real-time Air Quality
```javascript
const response = await fetch(
  `http://localhost:4567/api/air-quality?lat=${lat}&lon=${lon}&radius=25000&limit=100`
);
const data = await response.json();

// Response:
{
  status: "ok",
  count: 10,
  results: [
    {
      id: 123,
      name: "Station Name",
      city: "New York",
      country: "US",
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      parameters: ["pm25", "no2", "o3"],
      lastUpdated: "2025-10-04T01:00:00Z"
    }
  ]
}
```

#### Get Specific Pollutant
```javascript
// Pollutants: no2, pm25, pm10, o3, so2, co
const response = await fetch(
  `http://localhost:4567/api/air-quality/pm25?lat=${lat}&lon=${lon}&limit=50`
);
const data = await response.json();

// Response:
{
  status: "ok",
  pollutant: "pm25",
  count: 50,
  results: [
    {
      locationId: 123,
      location: "Station Name",
      city: "New York",
      country: "US",
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      value: 35.5,
      unit: "µg/m³",
      date: { utc: "2025-10-04T01:00:00Z" },
      aqi: 101,
      category: {
        level: "Unhealthy for Sensitive Groups",
        color: "#ff7e00",
        description: "Sensitive groups may experience health effects"
      }
    }
  ]
}
```

#### Get NASA TEMPO Data
```javascript
const response = await fetch(
  `http://localhost:4567/api/tempo?lat=${lat}&lon=${lon}`
);
const data = await response.json();

// Response:
{
  status: "ok",
  location: { lat: 40.7128, lon: -74.0060 },
  timestamp: "2025-10-04T01:00:00Z",
  data: {
    no2: {
      value: 45.2,
      unit: "ppb",
      aqi: 85,
      measurements_count: 10
    },
    o3: { ... },
    pm25: { ... }
  }
}
```

#### Get Historical Data (for graphs)
```javascript
const response = await fetch(
  `http://localhost:4567/api/historical?pollutant=no2&lat=${lat}&lon=${lon}&days=7`
);
const data = await response.json();

// Response:
{
  status: "ok",
  pollutant: "no2",
  days: 7,
  data_points: 168,
  data: [
    {
      timestamp: "2025-10-03T00:00:00Z",
      value: 42.5,
      aqi: 82,
      count: 5
    },
    // ... more hourly data points
  ]
}
```

#### Get Weather Data
```javascript
const response = await fetch(
  `http://localhost:4567/api/weather?lat=${lat}&lon=${lon}`
);
const data = await response.json();

// Response:
{
  status: "ok",
  weather: {
    temperature: 22.5,
    humidity: 65,
    pressure: 1013,
    wind_speed: 5.2,
    wind_direction: 180,
    description: "clear sky",
    icon: "01d"
  }
}
```

### 🔮 Predictions

#### Predict Dangerous Zones
```javascript
const response = await fetch('http://localhost:4567/api/predictions/danger-zones', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lat: 40.7128,
    lon: -74.0060,
    hours: 24
  })
});
const data = await response.json();

// Response:
{
  status: "ok",
  location: { lat: 40.7128, lon: -74.0060 },
  prediction: {
    hours_ahead: 24,
    predicted_aqi: 145,
    category: {
      level: "Unhealthy for Sensitive Groups",
      color: "#ff7e00",
      description: "..."
    },
    confidence: 0.75,
    factors: [
      { factor: "Rush hour traffic", impact: "high" }
    ]
  }
}
```

#### Health Prediction
```javascript
const response = await fetch('http://localhost:4567/api/predictions/health', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symptoms: ["cough", "headache", "eye irritation"],
    exposure_level: 150
  })
});
const data = await response.json();

// Response:
{
  status: "ok",
  risk_score: 65,
  risk_level: "Moderate",
  recommendations: [
    "Limit prolonged outdoor exertion",
    "Consider wearing a mask outdoors",
    "Keep windows closed"
  ],
  should_seek_medical_attention: false
}
```

### 👤 User Management

#### Create/Update User
```javascript
const response = await fetch('http://localhost:4567/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "user@example.com",
    name: "John Doe",
    phone: "+1234567890",
    notification_preferences: {
      email: true,
      sms: false,
      browser: true,
      alerts_enabled: true,
      min_severity: "moderate"
    }
  })
});
const data = await response.json();

// Response:
{
  status: "ok",
  user: {
    id: 1,
    email: "user@example.com",
    name: "John Doe",
    cumulative_exposure: 0.0
  }
}
```

#### Track User Exposure
```javascript
const response = await fetch(`http://localhost:4567/api/users/${userId}/exposure`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pollutant: "pm25",
    value: 45.5,
    duration_minutes: 60,
    lat: 40.7128,
    lon: -74.0060
  })
});
const data = await response.json();

// Response:
{
  status: "ok",
  exposure: {
    id: 123,
    pollutant: "pm25",
    value: 45.5,
    duration_minutes: 60
  },
  cumulative_exposure: 1250.5,
  daily_exposure: 125.0
}
```

#### Get User Exposure History
```javascript
const response = await fetch(
  `http://localhost:4567/api/users/${userId}/exposure?days=7`
);
const data = await response.json();

// Response:
{
  status: "ok",
  user_id: 1,
  cumulative_exposure: 1250.5,
  daily_data: [
    {
      date: "2025-10-03",
      total_exposure: 125.0,
      duration_minutes: 180,
      pollutants: {
        pm25: 75.0,
        no2: 50.0
      }
    }
  ]
}
```

### 🚨 Alerts

#### Get Active Alerts
```javascript
const response = await fetch(
  `http://localhost:4567/api/alerts?lat=${lat}&lon=${lon}`
);
const data = await response.json();

// Response:
{
  status: "ok",
  count: 2,
  alerts: [
    {
      id: 1,
      severity: "high",
      pollutant: "pm25",
      aqi: 175,
      message: "High PM2.5 levels detected",
      location: { lat: 40.7128, lon: -74.0060 },
      created_at: "2025-10-04T01:00:00Z"
    }
  ]
}
```

#### Subscribe to Alerts
```javascript
const response = await fetch('http://localhost:4567/api/alerts/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 1,
    threshold: 100,
    notification_preferences: {
      email: true,
      sms: true,
      browser: true
    }
  })
});
const data = await response.json();

// Response:
{
  status: "ok",
  message: "Successfully subscribed to alerts",
  user_id: 1
}
```

#### Get Browser Notification Payload
```javascript
const response = await fetch(`http://localhost:4567/api/alerts/${alertId}/notification`);
const data = await response.json();

// Response:
{
  status: "ok",
  notification: {
    title: "Air Quality Alert",
    body: "High PM2.5 levels detected",
    icon: "/icons/alert-high.png",
    badge: "/icons/badge.png",
    tag: "alert-1",
    data: {
      alert_id: 1,
      severity: "high",
      aqi: 175,
      pollutant: "pm25",
      location: { lat: 40.7128, lon: -74.0060 }
    },
    actions: [
      { action: "view", title: "View Details" },
      { action: "dismiss", title: "Dismiss" }
    ],
    requireInteraction: false
  }
}
```

#### Test Notification
```javascript
const response = await fetch('http://localhost:4567/api/alerts/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lat: 40.7128,
    lon: -74.0060
  })
});
const data = await response.json();

// Use data.notification with the Notification API
```

## AQI Color Scale

Use these colors for visualizations:

```javascript
const AQI_COLORS = {
  good: '#00e400',           // 0-50
  moderate: '#ffff00',       // 51-100
  sensitive: '#ff7e00',      // 101-150
  unhealthy: '#ff0000',      // 151-200
  veryUnhealthy: '#8f3f97',  // 201-300
  hazardous: '#7e0023'       // 301+
};

function getAQIColor(aqi) {
  if (aqi <= 50) return AQI_COLORS.good;
  if (aqi <= 100) return AQI_COLORS.moderate;
  if (aqi <= 150) return AQI_COLORS.sensitive;
  if (aqi <= 200) return AQI_COLORS.unhealthy;
  if (aqi <= 300) return AQI_COLORS.veryUnhealthy;
  return AQI_COLORS.hazardous;
}
```

## Browser Notifications Setup

```javascript
// Request permission
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Show notification from API payload
async function showAirQualityAlert(alertId) {
  const response = await fetch(
    `http://localhost:4567/api/alerts/${alertId}/notification`
  );
  const { notification } = await response.json();
  
  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      tag: notification.tag,
      data: notification.data,
      actions: notification.actions,
      requireInteraction: notification.requireInteraction
    });
  }
}
```

## React Hooks Examples

### useAirQuality Hook
```javascript
import { useState, useEffect } from 'react';

function useAirQuality(lat, lon, pollutant = 'pm25') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:4567/api/air-quality/${pollutant}?lat=${lat}&lon=${lon}`
        );
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (lat && lon) {
      fetchData();
      // Refresh every 15 minutes
      const interval = setInterval(fetchData, 15 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [lat, lon, pollutant]);

  return { data, loading, error };
}
```

### useHistoricalData Hook
```javascript
function useHistoricalData(lat, lon, pollutant, days = 7) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(
        `http://localhost:4567/api/historical?pollutant=${pollutant}&lat=${lat}&lon=${lon}&days=${days}`
      );
      const result = await response.json();
      setData(result.data);
      setLoading(false);
    }

    if (lat && lon) fetchData();
  }, [lat, lon, pollutant, days]);

  return { data, loading };
}
```

### useAlerts Hook
```javascript
function useAlerts(lat, lon) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function fetchAlerts() {
      const response = await fetch(
        `http://localhost:4567/api/alerts?lat=${lat}&lon=${lon}`
      );
      const result = await response.json();
      setAlerts(result.alerts);
    }

    if (lat && lon) {
      fetchAlerts();
      // Check for new alerts every 5 minutes
      const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [lat, lon]);

  return alerts;
}
```

## Chart.js Integration

```javascript
import { Line } from 'react-chartjs-2';

function AirQualityChart({ historicalData }) {
  const chartData = {
    labels: historicalData.map(d => new Date(d.timestamp).toLocaleString()),
    datasets: [{
      label: 'AQI',
      data: historicalData.map(d => d.aqi),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Air Quality Trend' }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 300,
        ticks: {
          callback: function(value) {
            if (value <= 50) return 'Good';
            if (value <= 100) return 'Moderate';
            if (value <= 150) return 'Sensitive';
            if (value <= 200) return 'Unhealthy';
            return 'Hazardous';
          }
        }
      }
    }
  };

  return <Line data={chartData} options={options} />;
}
```

## Error Handling

All endpoints return errors in this format:

```javascript
{
  status: "error",
  message: "Error description"
}
```

Example error handling:
```javascript
async function fetchAirQuality(lat, lon) {
  try {
    const response = await fetch(
      `http://localhost:4567/api/air-quality/pm25?lat=${lat}&lon=${lon}`
    );
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message);
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch air quality:', error);
    // Show user-friendly error message
    return null;
  }
}
```

## Tips for Frontend

1. **Caching**: Cache API responses for 5-15 minutes to reduce load
2. **Loading States**: Always show loading indicators during API calls
3. **Error Boundaries**: Wrap components in error boundaries
4. **Geolocation**: Use browser's geolocation API to get user's lat/lon
5. **Polling**: For real-time updates, poll every 5-15 minutes
6. **Notifications**: Request permission early in user flow
7. **Offline Support**: Consider service workers for offline functionality

---

Need help? Check the main README.md or ask the backend team!
