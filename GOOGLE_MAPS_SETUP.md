# 🗺️ Google Maps Setup Guide

## ⚠️ Current Issue

**Error**: `BillingNotEnabledMapError`

The Google Maps API key requires billing to be enabled. Here's how to fix it:

---

## 🔧 Option 1: Enable Billing (Recommended)

### Step 1: Get Valid API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Maps JavaScript API**
4. Go to **Billing** → Link a billing account
   - Google provides $200/month free credit
   - Map loads are very cheap (~$7 per 1000 loads)
5. Create credentials → API Key
6. Copy your API key

### Step 2: Add to Project

```bash
# Edit .env.local
echo "VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_KEY_HERE" > .env.local
```

### Step 3: Restart

```bash
npm run dev
```

---

## 🎯 Option 2: Use Leaflet (Free Alternative)

If you don't want to enable billing, use Leaflet instead:

### Install Leaflet

```bash
npm install react-leaflet leaflet
npm install -D @types/leaflet
```

### Update MapView Component

Replace Google Maps with Leaflet (free, no API key needed).

---

## 📊 Current Status

**What's Working**:
- ✅ 30 world cities displayed
- ✅ Click-to-query functionality
- ✅ AQI color coding
- ✅ Historical data with fallback

**What Needs Billing**:
- ❌ Google Maps display
- ❌ Satellite imagery
- ❌ Street view

**Workaround**:
- Map shows loading state
- City data still works
- Click functionality ready
- Just needs valid API key

---

## 💡 Quick Fix

### For Demo/Testing

Use OpenStreetMap (free) instead:

```bash
npm install react-leaflet leaflet
```

Then I can update the map to use Leaflet which requires no API key or billing.

---

## 🚀 Recommended Solution

**Enable Google Maps Billing**:
- Cost: ~$0.007 per map load
- Free tier: $200/month credit
- For demo: Costs almost nothing
- Best user experience

**Or Use Leaflet**:
- Cost: $0 (completely free)
- No API key needed
- Good user experience
- Open source

---

Would you like me to:
1. Wait for you to enable billing and provide a valid API key?
2. Switch to Leaflet (free, no API key)?
