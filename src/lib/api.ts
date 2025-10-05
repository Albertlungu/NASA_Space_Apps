// API client for NASA TEMPO Air Quality Backend
// Backend runs on http://localhost:4567

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4567';

interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
  error?: string;
}

// Air Quality Types
export interface AirQualityReading {
  locationId: number;
  location: string;
  city: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  value: number;
  unit: string;
  date: {
    utc: string;
  };
  aqi: number;
  category?: {
    level: string;
    color: string;
    description: string;
  };
}

export interface HistoricalDataPoint {
  timestamp: string;
  value: number;
  aqi: number;
  count: number;
}

export interface Alert {
  id: number;
  severity: string;
  pollutant: string;
  aqi: number;
  message: string;
  location: {
    lat: number;
    lon: number;
  };
  created_at: string;
}

export interface UserExposure {
  date: string;
  total_exposure: number;
  duration_minutes: number;
  pollutants: Record<string, number>;
}


// API Client
export const api = {
  // Air Quality Endpoints
  async getAirQuality(lat: number, lon: number, radius = 25000, limit = 100) {
    const response = await fetch(
      `${API_BASE_URL}/api/air-quality?lat=${lat}&lon=${lon}&radius=${radius}&limit=${limit}`
    );
    return response.json();
  },

  async getPollutantData(
    pollutant: string,
    lat: number,
    lon: number,
    radius = 25000,
    limit = 100
  ) {
    const response = await fetch(
      `${API_BASE_URL}/api/air-quality/${pollutant}?lat=${lat}&lon=${lon}&radius=${radius}&limit=${limit}`
    );
    return response.json();
  },

  async getTempoData(lat: number, lon: number) {
    const response = await fetch(
      `${API_BASE_URL}/api/tempo?lat=${lat}&lon=${lon}`
    );
    return response.json();
  },

  async getHistoricalData(
    pollutant: string,
    lat: number,
    lon: number,
    days = 7
  ): Promise<{
    status: string;
    pollutant: string;
    days: number;
    data_points: number;
    data: HistoricalDataPoint[];
  }> {
    const response = await fetch(
      `${API_BASE_URL}/api/historical?pollutant=${pollutant}&lat=${lat}&lon=${lon}&days=${days}`
    );
    return response.json();
  },

  async getTemperatureGrid(bounds: { north: number; south: number; east: number; west: number }) {
    const response = await fetch(
      `${API_BASE_URL}/api/weather/grid?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}`
    );
    return response.json();
  },

  async getWeather(lat: number, lon: number) {
    const response = await fetch(
      `${API_BASE_URL}/api/weather?lat=${lat}&lon=${lon}`
    );
    return response.json();
  },


  // Prediction Endpoints
  async predictDangerZones(lat: number, lon: number, hours = 24) {
    const response = await fetch(`${API_BASE_URL}/api/predictions/danger-zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon, hours }),
    });
    return response.json();
  },

  async predictHealth(symptoms: string[], exposureLevel: number) {
    const response = await fetch(`${API_BASE_URL}/api/predictions/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, exposure_level: exposureLevel }),
    });
    return response.json();
  },

  // User Endpoints
  async createUser(
    email: string,
    name: string,
    phone?: string,
    notificationPreferences?: Record<string, any>
  ) {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name,
        phone,
        notification_preferences: notificationPreferences,
      }),
    });
    return response.json();
  },

  async trackExposure(
    userId: number,
    pollutant: string,
    value: number,
    durationMinutes: number,
    lat: number,
    lon: number
  ) {
    const response = await fetch(
      `${API_BASE_URL}/api/users/${userId}/exposure`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollutant,
          value,
          duration_minutes: durationMinutes,
          lat,
          lon,
        }),
      }
    );
    return response.json();
  },

  async getUserExposure(
    userId: number,
    days = 7
  ): Promise<{
    status: string;
    user_id: number;
    cumulative_exposure: number;
    daily_data: UserExposure[];
  }> {
    const response = await fetch(
      `${API_BASE_URL}/api/users/${userId}/exposure?days=${days}`
    );
    return response.json();
  },

  // Alert Endpoints
  async getAlerts(
    lat: number,
    lon: number
  ): Promise<{
    status: string;
    count: number;
    alerts: Alert[];
  }> {
    const response = await fetch(
      `${API_BASE_URL}/api/alerts?lat=${lat}&lon=${lon}`
    );
    return response.json();
  },

  async subscribeToAlerts(
    userId: number,
    threshold: number,
    notificationPreferences: Record<string, any>
  ) {
    const response = await fetch(`${API_BASE_URL}/api/alerts/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        threshold,
        notification_preferences: notificationPreferences,
      }),
    });
    return response.json();
  },

  async testNotification(lat: number, lon: number) {
    const response = await fetch(`${API_BASE_URL}/api/alerts/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon }),
    });
    return response.json();
  },
};

// AQI Utility Functions
export const AQI_COLORS = {
  good: '#00e400',
  moderate: '#ffff00',
  sensitive: '#ff7e00',
  unhealthy: '#ff0000',
  veryUnhealthy: '#8f3f97',
  hazardous: '#7e0023',
} as const;

export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return AQI_COLORS.good;
  if (aqi <= 100) return AQI_COLORS.moderate;
  if (aqi <= 150) return AQI_COLORS.sensitive;
  if (aqi <= 200) return AQI_COLORS.unhealthy;
  if (aqi <= 300) return AQI_COLORS.veryUnhealthy;
  return AQI_COLORS.hazardous;
}

export function getAQILevel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function getAQIDescription(aqi: number): string {
  if (aqi <= 50) return 'Air quality is satisfactory';
  if (aqi <= 100) return 'Acceptable for most people';
  if (aqi <= 150) return 'Sensitive groups may experience health effects';
  if (aqi <= 200) return 'Everyone may begin to experience health effects';
  if (aqi <= 300) return 'Health alert: everyone may experience serious effects';
  return 'Health warnings of emergency conditions';
}

export function getAQIRecommendation(aqi: number): string {
  if (aqi <= 50) return 'Enjoy outdoor activities';
  if (aqi <= 100) return 'Normal outdoor activities are acceptable';
  if (aqi <= 150) return 'Sensitive groups should limit prolonged outdoor exertion';
  if (aqi <= 200) return 'Everyone should limit prolonged outdoor exertion';
  if (aqi <= 300) return 'Avoid outdoor activities';
  return 'Stay indoors and keep windows closed';
}

export const getCoordsFromLocation = async (locationQuery: string) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'NASA-TEMPO-Air-Quality-App' // Required by Nominatim
        }
      }
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
};

export const getNearbyAQIStations = async (lat: number, lon: number, radius = 25000) => {
  try {
    // Use the existing API to get nearby stations
    const response = await api.getPollutantData('pm25', lat, lon, radius, 5);
    
    if (response.status === 'success' && response.results) {
      // Filter out the results to return only unique nearby stations
      return response.results.map((reading: AirQualityReading) => ({
        coordinates: reading.coordinates,
        aqi: reading.aqi,
        value: reading.value,
        date: reading.date,
        location: reading.location,
        city: reading.city,
        country: reading.country
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch nearby AQI stations:', error);
    return [];
  }
};

export const getLocationFromCoords = async (lat: number, lon: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'User-Agent': 'NASA-TEMPO-Air-Quality-App' // Required by Nominatim
        }
      }
    );
    const data = await response.json();
    
    const city = data.address.city || 
                 data.address.town || 
                 data.address.village || 
                 data.address.county;
    const country = data.address.country;
    
    return { city, country };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
};
