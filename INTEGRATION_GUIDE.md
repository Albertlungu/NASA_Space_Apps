# Backend Integration Guide

## ✅ Backend API Integration Complete!

I've created a complete TypeScript API client to connect your Vite + React + Shadcn UI frontend with the Ruby backend.

---

## 📁 Files Created

### 1. API Client (`src/lib/api.ts`)
- ✅ Complete TypeScript API client
- ✅ All backend endpoints integrated
- ✅ Type-safe interfaces
- ✅ AQI utility functions (colors, levels, descriptions)

### 2. React Hooks (`src/hooks/useAirQuality.ts`)
- ✅ `useAirQuality` - Current air quality data
- ✅ `useHistoricalData` - 7-day trends
- ✅ `useAlerts` - Active alerts
- ✅ `useUserExposure` - Exposure tracking
- ✅ `useWeather` - Weather data
- ✅ `useTempoData` - NASA TEMPO satellite data

### 3. Geolocation Hook (`src/hooks/useGeolocation.ts`)
- ✅ Detects user's location
- ✅ Falls back to NYC if denied
- ✅ Detailed console logging
- ✅ TypeScript types

### 4. Environment Config (`.env.example.frontend`)
- ✅ Template for environment variables
- ✅ Backend API URL configuration

---

## 🚀 Quick Start

### 1. Set Up Environment Variables

```bash
# Create .env.local file
cp .env.example.frontend .env.local
```

Edit `.env.local`:
```env
VITE_API_URL=http://localhost:4567
```

### 2. Start Backend

```bash
cd backend
ruby app.rb
```

Backend runs on `http://localhost:4567`

### 3. Start Frontend

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` (Vite default)

---

## 💻 Usage Examples

### Example 1: Display Current Air Quality

```tsx
import { useAirQuality } from '@/hooks/useAirQuality';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getAQIColor, getAQILevel } from '@/lib/api';

export function AirQualityCard() {
  const { location } = useGeolocation();
  const { data, isLoading, error } = useAirQuality(
    location?.lat,
    location?.lon,
    'pm25'
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const currentReading = data?.results?.[0];
  const aqi = currentReading?.aqi || 0;

  return (
    <div className="p-6 rounded-lg border">
      <h2 className="text-2xl font-bold">Current AQI</h2>
      <div 
        className="text-4xl font-bold mt-4"
        style={{ color: getAQIColor(aqi) }}
      >
        {aqi}
      </div>
      <p className="text-sm text-muted-foreground">
        {getAQILevel(aqi)}
      </p>
    </div>
  );
}
```

### Example 2: Historical Chart

```tsx
import { useHistoricalData } from '@/hooks/useAirQuality';
import { useGeolocation } from '@/hooks/useGeolocation';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export function HistoricalChart() {
  const { location } = useGeolocation();
  const { data, isLoading } = useHistoricalData(
    location?.lat,
    location?.lon,
    'pm25',
    7
  );

  if (isLoading) return <div>Loading chart...</div>;

  return (
    <LineChart width={600} height={300} data={data?.data}>
      <XAxis 
        dataKey="timestamp" 
        tickFormatter={(value) => new Date(value).toLocaleDateString()}
      />
      <YAxis />
      <Tooltip />
      <Line 
        type="monotone" 
        dataKey="aqi" 
        stroke="#8884d8" 
        strokeWidth={2}
      />
    </LineChart>
  );
}
```

### Example 3: Alerts Display

```tsx
import { useAlerts } from '@/hooks/useAirQuality';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function AlertsList() {
  const { location } = useGeolocation();
  const { data, isLoading } = useAlerts(location?.lat, location?.lon);

  if (isLoading) return <div>Loading alerts...</div>;

  const alerts = data?.alerts || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Active Alerts ({alerts.length})</h2>
      {alerts.map((alert) => (
        <Alert key={alert.id} variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{alert.pollutant.toUpperCase()} Alert</AlertTitle>
          <AlertDescription>
            {alert.message} (AQI: {alert.aqi})
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
```

### Example 4: Exposure Tracker

```tsx
import { useUserExposure } from '@/hooks/useAirQuality';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ExposureTracker() {
  const userId = 1; // Get from auth context
  const { data, isLoading } = useUserExposure(userId, 7);

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cumulative Exposure</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {data?.cumulative_exposure.toFixed(1)}
        </div>
        <p className="text-sm text-muted-foreground">
          Total pollution units
        </p>
        
        <div className="mt-4 space-y-2">
          {data?.daily_data.map((day) => (
            <div key={day.date} className="flex justify-between">
              <span>{new Date(day.date).toLocaleDateString()}</span>
              <span className="font-semibold">
                {day.total_exposure.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🎨 Available API Functions

### Air Quality
```typescript
api.getAirQuality(lat, lon, radius?, limit?)
api.getPollutantData(pollutant, lat, lon, radius?, limit?)
api.getTempoData(lat, lon)
api.getHistoricalData(pollutant, lat, lon, days?)
api.getWeather(lat, lon)
```

### Predictions
```typescript
api.predictDangerZones(lat, lon, hours?)
api.predictHealth(symptoms, exposureLevel)
```

### Users
```typescript
api.createUser(email, name, phone?, notificationPreferences?)
api.trackExposure(userId, pollutant, value, durationMinutes, lat, lon)
api.getUserExposure(userId, days?)
```

### Alerts
```typescript
api.getAlerts(lat, lon)
api.subscribeToAlerts(userId, threshold, notificationPreferences)
api.testNotification(lat, lon)
```

### Utility Functions
```typescript
getAQIColor(aqi: number): string
getAQILevel(aqi: number): string
getAQIDescription(aqi: number): string
getAQIRecommendation(aqi: number): string
```

---

## 🎯 React Query Benefits

All hooks use `@tanstack/react-query` which provides:

- ✅ **Automatic caching** - Reduces API calls
- ✅ **Background refetching** - Keeps data fresh
- ✅ **Loading states** - `isLoading`, `isFetching`
- ✅ **Error handling** - `error` object
- ✅ **Automatic retries** - On failure
- ✅ **Stale-while-revalidate** - Shows cached data while fetching new

### Query Configuration

```typescript
// Air quality: Refreshes every 15 minutes
refetchInterval: 15 * 60 * 1000

// Alerts: Refreshes every 5 minutes
refetchInterval: 5 * 60 * 1000

// Historical: Doesn't auto-refresh (data doesn't change often)
staleTime: 30 * 60 * 1000
```

---

## 🔧 TypeScript Types

All API responses are fully typed:

```typescript
interface AirQualityReading {
  locationId: number;
  location: string;
  city: string;
  country: string;
  coordinates: { latitude: number; longitude: number };
  value: number;
  unit: string;
  date: { utc: string };
  aqi: number;
  category?: {
    level: string;
    color: string;
    description: string;
  };
}

interface HistoricalDataPoint {
  timestamp: string;
  value: number;
  aqi: number;
  count: number;
}

interface Alert {
  id: number;
  severity: string;
  pollutant: string;
  aqi: number;
  message: string;
  location: { lat: number; lon: number };
  created_at: string;
}
```

---

## 🌍 Geolocation

The `useGeolocation` hook:

1. Requests browser location permission
2. Returns user's coordinates
3. Falls back to NYC if denied/unavailable
4. Logs detailed info to console

```typescript
const { location, error, loading } = useGeolocation();

// location: { lat: number, lon: number } | null
// error: string | null
// loading: boolean
```

---

## 🐛 Debugging

### Check Backend Connection

```bash
# Test if backend is running
curl http://localhost:4567

# Test historical endpoint
curl "http://localhost:4567/api/historical?pollutant=pm25&days=7"
```

### Console Logs

The hooks log useful information:
```
🌍 Attempting to get your location...
📡 Requesting location permission...
✅ Got your location: { lat: XX.XXXX, lon: XX.XXXX }
```

### React Query DevTools

Add to your app for debugging:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

---

## 📦 Dependencies

Already in your `package.json`:
- ✅ `@tanstack/react-query` - Data fetching
- ✅ `react-router-dom` - Routing
- ✅ `lucide-react` - Icons
- ✅ `recharts` - Charts
- ✅ `date-fns` - Date formatting

---

## 🚨 CORS Configuration

Backend already has CORS enabled for `http://localhost:3000`.

If using Vite (default port 5173), update backend `.env`:

```env
FRONTEND_URL=http://localhost:5173
```

Then restart backend.

---

## 📝 Next Steps

1. ✅ Backend integration complete
2. 🎨 Use the hooks in your components
3. 📊 Build dashboards with the data
4. 🗺️ Add map visualizations
5. 📱 Implement notifications
6. 🚀 Deploy!

---

## 💡 Tips

- **Use React Query DevTools** to inspect queries
- **Check browser console** for geolocation logs
- **Test with mock data** first (backend has sample data)
- **Add loading skeletons** for better UX
- **Handle errors gracefully** with error boundaries

---

**Your frontend is now fully integrated with the backend!** 🎉

Start building amazing air quality visualizations!
