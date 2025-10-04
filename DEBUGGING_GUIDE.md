# Debugging Guide

## Backend Debug Results

### ✅ What's Working

1. **Database**: 100 air quality readings, 1 user, 1 alert
2. **Historical Data**: 
   - NO2: 26 readings (average AQI: 105)
   - PM2.5: 36 readings (average AQI: 117)
   - O3: 38 readings (average AQI: 123)
3. **Alerts**: 1 active alert for high PM2.5
4. **API Endpoints**: All responding correctly

### ⚠️ Known Issues

1. **Current Air Quality Readings**: Returns empty because:
   - Sample data doesn't have matching coordinates
   - OpenAQ API key not configured (optional)

2. **User Exposure**: Empty (no exposure data tracked yet)

---

## Debug Scripts

### 1. Full Debug Report
```bash
cd backend
ruby debug.rb
```

Shows:
- Database status
- Historical data for all pollutants
- Sample API responses
- Active alerts
- Tips for fixing issues

### 2. Test API Endpoints
```bash
cd backend
ruby test_endpoints.rb
```

Tests all API endpoints and shows actual responses.

---

## Frontend Debugging

### Check Browser Console

1. Open `http://localhost:3000` in Chrome/Firefox
2. Press `F12` or `Cmd+Option+I` (Mac)
3. Go to **Console** tab
4. Look for errors (red text)

Common errors:
- `Failed to fetch` → Backend not running
- `CORS error` → Backend CORS not configured
- `undefined` → Data structure mismatch

### Check Network Tab

1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Refresh page
4. Look for API calls to `localhost:4567`
5. Click on each request to see:
   - **Headers**: Request details
   - **Response**: What backend returned
   - **Preview**: Formatted JSON

### Expected API Calls

When frontend loads, you should see:
```
GET http://localhost:4567/api/air-quality/pm25?lat=40.7128&lon=-74.006...
GET http://localhost:4567/api/historical?pollutant=pm25&lat=40.7128&lon=-74.006&days=7
GET http://localhost:4567/api/alerts?lat=40.7128&lon=-74.006
GET http://localhost:4567/api/users/1/exposure?days=7
```

---

## Why Frontend Shows "No Data"

### Possible Reasons

1. **Backend not running**
   ```bash
   # Check if backend is running
   curl http://localhost:4567
   
   # If not, start it
   cd backend
   ruby app.rb
   ```

2. **CORS issues**
   - Check backend `.env` has: `FRONTEND_URL=http://localhost:3000`
   - Restart backend after changing `.env`

3. **Data structure mismatch**
   - Frontend expects certain fields
   - Backend returns different structure
   - Check browser console for errors

4. **Empty results from API**
   - Current readings endpoint returns empty (expected without API key)
   - Historical data should work (has 34 data points)
   - Alerts should work (has 1 alert)

---

## Quick Fixes

### Fix 1: Ensure Backend is Running

```bash
# Terminal 1: Backend
cd backend
ruby app.rb

# Should see: Sinatra has taken the stage on 4567
```

### Fix 2: Check Frontend API Calls

Open browser console and look for:
```javascript
// Should see these logs
console.log('Geolocation timeout, using default location')
// Or
console.log('Geolocation error: ...')
```

### Fix 3: Verify Data is Returned

```bash
# Test historical endpoint (should return 34 data points)
curl "http://localhost:4567/api/historical?pollutant=pm25&days=7"

# Test alerts endpoint (should return 1 alert)
curl "http://localhost:4567/api/alerts?lat=40.7128&lon=-74.006"
```

---

## Expected Frontend Behavior

### What Should Work

1. **Dashboard loads** - Shows header and layout
2. **Location detected** - Shows "40.7128, -74.0060" or your location
3. **Historical Chart** - Shows 7-day trend with 34 data points
4. **Alerts** - Shows 1 alert: "High PM2.5 levels detected"
5. **Exposure Tracker** - Shows "No exposure data" (expected)

### What Might Be Empty

1. **Current Readings Grid** - Empty (needs OpenAQ API key or matching coordinates)
2. **AQI Gauge** - Shows 0 (because current readings are empty)

---

## Adding OpenAQ API Key (Optional)

To get real-time current readings:

1. Sign up at https://openaq.org/
2. Get your API key
3. Add to `backend/.env`:
   ```
   OPENAQ_API_KEY=your_actual_key_here
   ```
4. Restart backend
5. Frontend will now show real-time data

---

## Troubleshooting Checklist

- [ ] Backend running on port 4567
- [ ] Frontend running on port 3000
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows API calls being made
- [ ] Historical endpoint returns data
- [ ] Alerts endpoint returns data
- [ ] Database has 100 readings (`ruby debug.rb`)

---

## Console Commands

### Backend
```bash
# Check database
cd backend
ruby debug.rb

# Test endpoints
ruby test_endpoints.rb

# Start server
ruby app.rb
```

### Frontend
```bash
# Start dev server
cd frontend
npm start

# Check for errors
# Open browser console (F12)
```

---

## Common Error Messages

### "Failed to fetch"
**Cause**: Backend not running or wrong URL  
**Fix**: Start backend, check `src/utils/api.js` has correct URL

### "CORS policy"
**Cause**: Backend CORS not configured  
**Fix**: Check `backend/.env` has `FRONTEND_URL=http://localhost:3000`

### "Cannot read property 'map' of undefined"
**Cause**: Data structure doesn't match expected format  
**Fix**: Check browser console, verify API response structure

### "Geolocation timeout"
**Cause**: Browser blocked location or slow response  
**Fix**: Allow location in browser, or it defaults to NYC automatically

---

## Success Indicators

### Backend
```
✅ Database: 100 readings
✅ Historical data: 34 data points (PM2.5)
✅ Alerts: 1 active alert
✅ API responding: All endpoints return 200 OK
```

### Frontend
```
✅ Page loads without errors
✅ Location shown in header
✅ Chart displays with data points
✅ Alert banner shows "1 Active Alert"
✅ Exposure tracker shows (even if empty)
```

---

## Need More Help?

1. Run `ruby debug.rb` and share output
2. Check browser console and share errors
3. Check Network tab and share failed requests
4. Share screenshots of what you see

---

**Most likely issue**: Frontend is working, but current readings are empty because sample data doesn't match coordinates. Historical chart and alerts should work!
