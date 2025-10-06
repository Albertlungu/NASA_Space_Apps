## Setup Instructions

### 1. Get Mapbox Token

1. Go to https://account.mapbox.com/
2. Sign up (free account)
3. Go to "Access tokens"
4. Copy your default public token
5. Or create a new token

### 2. Add to Environment

```bash
# In .env.local
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNtM2Ziajg0czAxYXIyanBwZzBkcmlhb2wifQ.your_actual_token
```

### 3. Restart Frontend

```bash
npm run dev
```

---

## Package Changes

### package.json

**Removed:**
```json
"@react-google-maps/api": "^2.20.7"
```

**Added:**
```json
"mapbox-gl": "^3.15.0",
"react-map-gl": "^7.1.7"
```

---

## Map Features

### Interactive Elements

**City Markers (30 cities)**
- Circular markers with AQI numbers
- Color-coded by AQI level
- Click to show popup with details
- Hover effect (scale up)

**Click-to-Query**
- Click anywhere on map
- Fetches real air quality data
- Shows custom marker
- Displays popup with coordinates and AQI

**Map Controls**
- Navigation controls (zoom, rotate)
- Scale control
- Satellite/street toggle
- Smooth pan and zoom

**Popups**
- City name and country
- AQI value
- Pollutant concentration
- AQI level (Good/Moderate/Unhealthy)
- Close button

---

## Map Styles

### Street View
```typescript
mapStyle="mapbox://styles/mapbox/streets-v12"
```

### Satellite View
```typescript
mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
```

Toggle with the "TEMPO Overlay" button!

---
## 🎯 Next Steps

1. **Get your Mapbox token**: https://account.mapbox.com/
2. **Add to .env.local**: `VITE_MAPBOX_TOKEN=your_token`
3. **Restart app**: `npm run dev`
4. **Test map**: Navigate to `/map` page

---

## 💡 Tips

### Custom Styles
Mapbox allows custom map styles:
- Dark mode
- Custom colors
- Hide/show features
- Add custom layers

### Advanced Features
- Heatmaps
- 3D buildings
- Animated routes
- Custom icons
- Clustering

---
