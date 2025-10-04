# ✅ Backend Integration Complete!

Your Vite + React + TypeScript + Shadcn UI frontend is now fully integrated with the Ruby backend!

---

## 📁 Files Created

### API Integration
- ✅ `src/lib/api.ts` - Complete TypeScript API client with all endpoints
- ✅ `src/hooks/useAirQuality.ts` - React Query hooks for data fetching
- ✅ `src/hooks/useGeolocation.ts` - Location detection hook
- ✅ `src/components/AirQualityDashboard.tsx` - Example dashboard component

### Configuration
- ✅ `.env.example.frontend` - Environment variable template
- ✅ `INTEGRATION_GUIDE.md` - Complete integration documentation

---

## 🚀 Quick Start

### 1. Set Up Environment

```bash
# Create environment file
echo "VITE_API_URL=http://localhost:4567" > .env.local
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

Frontend runs on `http://localhost:5173`

---

## 💻 Use the Integration

### Option 1: Use the Example Dashboard

Add to your routing:

```tsx
import { AirQualityDashboard } from '@/components/AirQualityDashboard';

// In your router
<Route path="/air-quality" element={<AirQualityDashboard />} />
```

### Option 2: Build Custom Components

```tsx
import { useAirQuality } from '@/hooks/useAirQuality';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getAQIColor, getAQILevel } from '@/lib/api';

export function MyComponent() {
  const { location } = useGeolocation();
  const { data, isLoading } = useAirQuality(
    location?.lat,
    location?.lon,
    'pm25'
  );

  if (isLoading) return <div>Loading...</div>;

  const aqi = data?.results?.[0]?.aqi || 0;

  return (
    <div style={{ color: getAQIColor(aqi) }}>
      <h1>AQI: {aqi}</h1>
      <p>{getAQILevel(aqi)}</p>
    </div>
  );
}
```

---

## 🎯 Available Hooks

All hooks use React Query for automatic caching and refetching:

```typescript
// Air quality data (refreshes every 15 min)
const { data, isLoading, error } = useAirQuality(lat, lon, 'pm25');

// Historical data (7 days)
const { data } = useHistoricalData(lat, lon, 'pm25', 7);

// Active alerts (refreshes every 5 min)
const { data } = useAlerts(lat, lon);

// User exposure tracking
const { data } = useUserExposure(userId, 7);

// Weather data (refreshes every 30 min)
const { data } = useWeather(lat, lon);

// NASA TEMPO satellite data
const { data } = useTempoData(lat, lon);

// User's location
const { location, error, loading } = useGeolocation();
```

---

## 📊 API Functions

Direct API calls (if you don't want to use hooks):

```typescript
import { api } from '@/lib/api';

// Get air quality
const data = await api.getPollutantData('pm25', lat, lon);

// Get historical data
const history = await api.getHistoricalData('pm25', lat, lon, 7);

// Get alerts
const alerts = await api.getAlerts(lat, lon);

// Track exposure
await api.trackExposure(userId, 'pm25', value, duration, lat, lon);
```

---

## 🎨 Utility Functions

```typescript
import { getAQIColor, getAQILevel, getAQIDescription, getAQIRecommendation } from '@/lib/api';

// Get color for AQI value
const color = getAQIColor(150); // '#ff7e00' (orange)

// Get level name
const level = getAQILevel(150); // 'Unhealthy for Sensitive Groups'

// Get description
const desc = getAQIDescription(150); // 'Sensitive groups may experience...'

// Get recommendation
const rec = getAQIRecommendation(150); // 'Sensitive groups should limit...'
```

---

## 🌍 Location Detection

The `useGeolocation` hook:
- ✅ Requests browser permission
- ✅ Returns user's coordinates
- ✅ Falls back to NYC if denied
- ✅ Logs detailed info to console

```typescript
const { location, error, loading } = useGeolocation();

// location: { lat: number, lon: number } | null
// error: string | null (e.g., "Location permission denied")
// loading: boolean
```

---

## 📦 TypeScript Types

All responses are fully typed:

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
```

---

## 🐛 Debugging

### Check Backend Connection

```bash
# Test if backend is running
curl http://localhost:4567

# Should return:
# {"message":"NASA TEMPO Air Quality API 🚀","version":"1.0.0",...}
```

### Check Console Logs

Open browser console (F12) and look for:
```
🌍 Attempting to get your location...
📡 Requesting location permission...
✅ Got your location: { lat: XX.XXXX, lon: XX.XXXX }
```

### Use React Query DevTools

Add to your `App.tsx`:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

---

## 🚨 CORS Configuration

If you get CORS errors:

1. Check backend `.env` has:
   ```env
   FRONTEND_URL=http://localhost:5173
   ```

2. Restart backend:
   ```bash
   cd backend
   ruby app.rb
   ```

---

## 📝 Example Dashboard Features

The `AirQualityDashboard` component shows:

1. ✅ **Current AQI** - Large gauge with color coding
2. ✅ **Current Readings** - List of nearby stations
3. ✅ **7-Day Trend** - Historical data points
4. ✅ **Active Alerts** - Pollution warnings
5. ✅ **Location Display** - User's coordinates
6. ✅ **Loading States** - Skeleton loaders
7. ✅ **Error Handling** - Fallback to NYC

---

## 🎯 Next Steps

1. ✅ **Integration complete** - Backend connected!
2. 🎨 **Build UI** - Use the hooks in your components
3. 📊 **Add charts** - Use Recharts with historical data
4. 🗺️ **Add maps** - Show stations on a map
5. 📱 **Add notifications** - Browser notifications for alerts
6. 🚀 **Deploy** - Build and deploy your app

---

## 💡 Pro Tips

- **Use React Query DevTools** to inspect queries and cache
- **Check browser console** for geolocation logs
- **Test with backend debug script** (`ruby backend/debug.rb`)
- **Add loading skeletons** for better UX
- **Handle errors gracefully** with error boundaries
- **Use Shadcn UI components** for consistent design

---

## 📚 Documentation

- **INTEGRATION_GUIDE.md** - Detailed usage examples
- **backend/README.md** - Backend API documentation
- **backend/API_REFERENCE.md** - All endpoints reference
- **backend/DEBUGGING_GUIDE.md** - Backend debugging

---

## ✨ What You Can Build

With this integration, you can build:

- 📊 **Real-time dashboards** - Live air quality monitoring
- 📈 **Historical charts** - Trend analysis
- 🗺️ **Interactive maps** - Station locations and heatmaps
- 🚨 **Alert systems** - Push notifications
- 👤 **User profiles** - Personalized tracking
- 📱 **Mobile-responsive** - Works on all devices
- 🎨 **Beautiful UI** - Using Shadcn components

---

**Your frontend and backend are now fully integrated!** 🎉

Start building amazing air quality visualizations with your Vite + React + TypeScript + Shadcn UI stack!
