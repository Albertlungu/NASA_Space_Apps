# Bug Fix Summary: Dashboard AQI Display Issues

## Problem
The full dashboard was showing:
- AQI score of 0 instead of real values
- "N/A" for breakdown of all pollutants
- Icons not displaying with correct colors

## Root Causes Identified

### 1. **Tailwind Dynamic Class Generation Issue**
**Location**: `src/components/Dashboard.tsx` (pollutantData useMemo, ~line 209)

**Problem**: 
```typescript
color: pm25Aqi ? `text-[${getAQIColor(pm25Aqi)}]` : "text-gray-400"
```
Tailwind CSS cannot generate classes dynamically at runtime using arbitrary values like `text-[#00e400]`. These classes must be present in the source code at build time for Tailwind to include them in the CSS bundle.

**Solution**: 
Changed to use inline styles instead:
```typescript
color: pm25Aqi > 0 ? getAQIColor(pm25Aqi) : "#9ca3af"
```

Then applied in the JSX:
```jsx
<pollutant.icon className="w-8 h-8" style={{ color: pollutant.color }} />
```

### 2. **Loose Null Checking**
**Problem**: 
Using `||` operator for defaults caused issues when AQI value was legitimately 0:
```typescript
const pm25Aqi = tempoData?.data?.pm25?.aqi || pm25Data?.results?.[0]?.aqi || 0;
```
If the first value is 0, it would fall through to try the second value unnecessarily.

**Solution**: 
Use nullish coalescing operator (`??`) which only falls through on `null` or `undefined`:
```typescript
const pm25Aqi = tempoData?.data?.pm25?.aqi ?? pm25Data?.results?.[0]?.aqi ?? 0;
```

### 3. **Insufficient Value Validation**
**Problem**:
```typescript
value: pm25Value !== undefined ? pm25Value.toFixed(1) : 'N/A'
```
This doesn't check for `null`, which could still cause "N/A" to display.

**Solution**:
```typescript
value: pm25Value !== undefined && pm25Value !== null ? pm25Value.toFixed(1) : 'N/A'
```

### 4. **Date Handling**
**Problem**: Only checking for `date.local` which might not always be present in API responses.

**Solution**: Added fallback to `date.utc`:
```typescript
timestamp: mainReading?.date?.local 
  ? new Date(mainReading.date.local).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  : mainReading?.date?.utc 
  ? new Date(mainReading.date.utc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  : "Live"
```

## Changes Made

### File: `src/components/Dashboard.tsx`

1. **Line ~73**: Added debug logging for main reading data
2. **Line ~78**: Changed `||` to `??` for AQI default value
3. **Line ~81-84**: Added fallback date handling for UTC timestamps
4. **Line ~200**: Added debug logging for pollutant data sources
5. **Line ~203-207**: Changed all `||` to `??` for value extraction
6. **Line ~211-242**: 
   - Improved null checking for values
   - Changed color from Tailwind class string to hex color
   - Added AQI property to pollutant objects
7. **Line ~246**: Added debug logging for computed pollutant data
8. **Line ~323**: Changed icon styling from Tailwind class to inline style

## Testing Recommendations

1. **Test with zero AQI values**: Ensure that legitimate 0 AQI values display correctly
2. **Test with missing data**: Verify that "N/A" displays when data is truly unavailable
3. **Check browser console**: Review the debug logs to confirm data is being received
4. **Verify colors**: Ensure pollutant icons show correct colors based on AQI levels
5. **Test different locations**: Try various cities to ensure consistent behavior

## Debug Logs Added

Console logs have been added at key points:
- `console.log('Main reading data:', mainReading)`
- `console.log('Pollutant data sources:', { tempoData, pm25Data, no2Data, o3Data })`
- `console.log('Computed pollutant data:', pollutants)`

These can be removed once the issue is confirmed fixed.

## Backend Dependency Note

The fixes assume the backend returns data in this format (per API_REFERENCE.md):
```javascript
{
  status: "ok",
  pollutant: "pm25",
  results: [
    {
      locationId: 123,
      value: 35.5,
      unit: "µg/m³",
      date: { utc: "2025-10-04T01:00:00Z" },
      aqi: 101,
      // ...
    }
  ]
}
```

If the backend is not running or returning errors, the frontend will still show loading/placeholder states correctly.
