import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MapPin, Layers, Satellite, Loader2, Globe } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAirQuality, useTempoData } from "@/hooks/useAirQuality";
import { getAQIColor, getAQILevel } from "@/lib/api";
import Map, { Marker, Popup, NavigationControl, ScaleControl, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { api } from "@/lib/api";
import { WindParticles } from './WindParticles';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// World's most polluted cities for ranking
const RANKED_CITIES = [
  { name: "Lahore", lat: 31.5204, lon: 69.7492, country: "Pakistan", flag: "🇵🇰" },
  { name: "Jakarta", lat: -6.2088, lon: 106.8456, country: "Indonesia", flag: "🇮🇩" },
  { name: "Delhi", lat: 28.7041, lon: 77.1025, country: "India", flag: "🇮🇳" },
  { name: "Kinshasa", lat: -4.4419, lon: 15.2663, country: "DR Congo", flag: "🇨🇩" },
  { name: "Manila", lat: 14.5995, lon: 120.9842, country: "Philippines", flag: "🇵🇭" },
  { name: "Cairo", lat: 30.0444, lon: 31.2357, country: "Egypt", flag: "🇪🇬" },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777, country: "India", flag: "🇮🇳" },
];
type OverlayLegendConfig = {
  title: string;
  stops: Array<{ color: string; position: number }>;
  labels: string[];
};

const OVERLAY_LEGENDS: Record<'temperature' | 'wind', OverlayLegendConfig> = {
  temperature: {
    title: 'Temperature (°C)',
    stops: [
      { color: '#0B1D51', position: 0 },
      { color: '#1464B4', position: 16 },
      { color: '#1E9BFF', position: 32 },
      { color: '#40E0D0', position: 48 },
      { color: '#F5D300', position: 64 },
      { color: '#FF8C00', position: 80 },
      { color: '#FF4000', position: 90 },
      { color: '#7F0000', position: 100 }
    ],
    labels: ['-40', '-20', '0', '10', '20', '30', '40', '50']
  },
  wind: {
    title: 'Wind Speed (m/s)',
    stops: [
      { color: '#F1FCFF', position: 0 },
      { color: '#A8E8FF', position: 20 },
      { color: '#68C7FF', position: 40 },
      { color: '#3994FF', position: 60 },
      { color: '#784CFF', position: 80 },
      { color: '#FF2F92', position: 100 }
    ],
    labels: ['0', '10', '20', '30', '40', '50']
  }
};

const MapView = () => {
  const [opacity, setOpacity] = useState([70]);
  const [showSatellite, setShowSatellite] = useState(true);
  const [selectedPollutant, setSelectedPollutant] = useState<'pm25' | 'no2' | 'o3'>('pm25');
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [cityDataMap, setCityDataMap] = useState<Record<string, any>>(() => {
    // Initialize with fallback data immediately
    const initial: Record<string, any> = {};
    RANKED_CITIES.forEach(city => {
      initial[city.name] = { ...city, aqi: 150, value: 100, unit: 'µg/m³' };
    });
    return initial;
  });
  const [overlayType, setOverlayType] = useState<'pollution' | 'temperature' | 'wind' | 'none'>('pollution');
  const mapRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [temperatureData, setTemperatureData] = useState<any[]>([]);
  const [windData, setWindData] = useState<Array<{ lat: number; lon: number; speed: number; direction: number }>>([]);
  const [windDataTimestamp, setWindDataTimestamp] = useState(Date.now());
  // Get yesterday's date for NASA GIBS (today's data not available yet)
  const gibsDate = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }, []);
  
  const { location } = useGeolocation();
  
  // Fetch real data for ranked cities
  useEffect(() => {
    RANKED_CITIES.forEach(city => {
      api.getPollutantData(selectedPollutant, city.lat, city.lon, 50000, 20)
        .then(data => {
          if (data.results && data.results.length > 0) {
            const avgValue = data.results.reduce((sum: number, r: any) => sum + (r.value || 0), 0) / data.results.length;
            const avgAQI = data.results.reduce((sum: number, r: any) => sum + (r.aqi || 0), 0) / data.results.length;
            setCityDataMap(prev => ({
              ...prev,
              [city.name]: {
                ...city,
                aqi: Math.round(avgAQI) || 150,
                value: avgValue || 100,
                unit: data.results[0].unit || 'µg/m³'
              }
            }));
          } else {
            // Set estimated data if API returns no results
            setCityDataMap(prev => ({
              ...prev,
              [city.name]: {
                ...city,
                aqi: 150,
                value: 100,
                unit: 'µg/m³'
              }
            }));
          }
        })
        .catch(() => {
          // Use fallback data if API fails
          setCityDataMap(prev => ({
            ...prev,
            [city.name]: {
              ...city,
              aqi: 150,
              value: 100,
              unit: 'µg/m³'
            }
          }));
        });
    });
  }, [selectedPollutant]);
  
  // Get sorted cities by AQI
  const rankedCities = useMemo(() => {
    return Object.values(cityDataMap).filter((c: any) => c.aqi > 0).sort((a: any, b: any) => b.aqi - a.aqi);
  }, [cityDataMap]);

  const legendConfig = useMemo(() => {
    if (overlayType === 'temperature' || overlayType === 'wind') {
      return OVERLAY_LEGENDS[overlayType];
    }
    return null;
  }, [overlayType]);

  const legendGradient = useMemo(() => {
    if (!legendConfig) return '';
    return `linear-gradient(to right, ${legendConfig.stops
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ')})`;
  }, [legendConfig]);
  
  // Create GeoJSON for heat map visualization
  const heatmapData = useMemo(() => {
    const features = rankedCities.map((city: any) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [city.lon, city.lat]
      },
      properties: {
        aqi: city.aqi,
        value: city.value
      }
    }));
    
    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [rankedCities]);
  
  // Heat map layer configuration
  const heatmapLayer = {
    id: 'pollution-heatmap',
    type: 'heatmap' as const,
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'aqi'], 0, 0, 300, 1] as any,
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3] as any,
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(0, 228, 0, 0)',
        0.2, 'rgb(0, 228, 0)',
        0.4, 'rgb(255, 255, 0)',
        0.6, 'rgb(255, 126, 0)',
        0.8, 'rgb(255, 0, 0)',
        1, 'rgb(126, 0, 35)'
      ] as any,
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 9, 50] as any,
      'heatmap-opacity': opacity[0] / 100
    }
  };
  
  // Circle layer for markers
  const circleLayer = {
    id: 'pollution-circles',
    type: 'circle' as const,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 9, 12] as any,
      'circle-color': [
        'interpolate',
        ['linear'],
        ['get', 'aqi'],
        0, '#00e400',
        50, '#ffff00',
        100, '#ff7e00',
        150, '#ff0000',
        200, '#8f3f97',
        300, '#7e0023'
      ] as any,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  };
  
  // Major world cities
  const cities = [
    // North America
    { name: "New York", lat: 40.7128, lon: -74.0060, country: "USA" },
    { name: "Los Angeles", lat: 34.0522, lon: -118.2437, country: "USA" },
    { name: "Chicago", lat: 41.8781, lon: -87.6298, country: "USA" },
    { name: "Toronto", lat: 43.6532, lon: -79.3832, country: "Canada" },
    { name: "Mexico City", lat: 19.4326, lon: -99.1332, country: "Mexico" },
    
    // South America
    { name: "São Paulo", lat: -23.5505, lon: -46.6333, country: "Brazil" },
    { name: "Buenos Aires", lat: -34.6037, lon: -58.3816, country: "Argentina" },
    { name: "Lima", lat: -12.0464, lon: -77.0428, country: "Peru" },
    
    // Europe
    { name: "London", lat: 51.5074, lon: -0.1278, country: "UK" },
    { name: "Paris", lat: 48.8566, lon: 2.3522, country: "France" },
    { name: "Berlin", lat: 52.5200, lon: 13.4050, country: "Germany" },
    { name: "Madrid", lat: 40.4168, lon: -3.7038, country: "Spain" },
    { name: "Rome", lat: 41.9028, lon: 12.4964, country: "Italy" },
    { name: "Moscow", lat: 55.7558, lon: 37.6173, country: "Russia" },
    
    // Asia
    { name: "Tokyo", lat: 35.6762, lon: 139.6503, country: "Japan" },
    { name: "Beijing", lat: 39.9042, lon: 116.4074, country: "China" },
    { name: "Shanghai", lat: 31.2304, lon: 121.4737, country: "China" },
    { name: "Delhi", lat: 28.7041, lon: 77.1025, country: "India" },
    { name: "Mumbai", lat: 19.0760, lon: 72.8777, country: "India" },
    { name: "Seoul", lat: 37.5665, lon: 126.9780, country: "South Korea" },
    { name: "Bangkok", lat: 13.7563, lon: 100.5018, country: "Thailand" },
    { name: "Singapore", lat: 1.3521, lon: 103.8198, country: "Singapore" },
    { name: "Dubai", lat: 25.2048, lon: 55.2708, country: "UAE" },
    
    // Africa
    { name: "Cairo", lat: 30.0444, lon: 31.2357, country: "Egypt" },
    { name: "Lagos", lat: 6.5244, lon: 3.3792, country: "Nigeria" },
    { name: "Johannesburg", lat: -26.2041, lon: 28.0473, country: "South Africa" },
    
    // Oceania
    { name: "Sydney", lat: -33.8688, lon: 151.2093, country: "Australia" },
    { name: "Melbourne", lat: -37.8136, lon: 144.9631, country: "Australia" },
  ];

  // Fetch data for clicked location
  const { data: clickedData } = useAirQuality(
    clickedLocation?.lat, 
    clickedLocation?.lng, 
    selectedPollutant
  );
  
  // Get TEMPO satellite data for current location
  const { data: tempoData, isLoading: tempoLoading } = useTempoData(location?.lat, location?.lon);

  // Use memoized locations with estimated AQI for all cities
  const locations = useMemo(() => cities.map((city, idx) => {
    // Estimate AQI based on typical pollution levels by region
    let estimatedAQI = 50; // Default moderate
    
    // Asia typically higher
    if (['China', 'India', 'Thailand'].includes(city.country)) estimatedAQI = 150;
    // Middle East
    else if (city.country === 'UAE') estimatedAQI = 120;
    // Europe typically better
    else if (['UK', 'France', 'Germany', 'Spain', 'Italy'].includes(city.country)) estimatedAQI = 45;
    // North America varies
    else if (city.country === 'USA') estimatedAQI = 85;
    // South America
    else if (['Brazil', 'Argentina', 'Peru'].includes(city.country)) estimatedAQI = 95;
    // Africa
    else if (['Egypt', 'Nigeria', 'South Africa'].includes(city.country)) estimatedAQI = 110;
    // Oceania typically good
    else if (city.country === 'Australia') estimatedAQI = 40;
    
    return {
      name: city.name,
      country: city.country,
      lat: city.lat,
      lng: city.lon,
      aqi: estimatedAQI,
      value: estimatedAQI * 0.7, // Rough PM2.5 estimate
      unit: 'µg/m³'
    };
  }), [cities]);

  // Get color for each location based on AQI
  const locationsWithColors = useMemo(() => locations.map(loc => ({
    ...loc,
    color: getAQIColor(loc.aqi)
  })), [locations]);
  
  // Mapbox viewport state
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 2,
    pitch: 0,
    bearing: 0
  });

  // Update view when switching modes
  useEffect(() => {
    setMapError(null);
    if (viewMode === '3d') {
      setViewState(prev => ({ ...prev, zoom: 1.5, pitch: 0 }));
    } else {
      setViewState(prev => ({ ...prev, zoom: 2, pitch: 0 }));
    }
    // Brief loading indicator for mode switch, then clear
    setIsMapLoading(true);
    const timer = setTimeout(() => setIsMapLoading(false), 500);
    return () => clearTimeout(timer);
  }, [viewMode]);


  // Fetch temperature grid data when temperature overlay is active
  useEffect(() => {
    if (overlayType !== 'temperature' || !mapRef.current) return;

    const fetchTemperatureData = async () => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      if (!map.loaded()) {
        map.once('idle', fetchTemperatureData);
        return;
      }

      try {
        const bounds = map.getBounds();

        const data = await api.getTemperatureGrid({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        });

        if (data.status === 'ok' && data.grid) {
          setTemperatureData(data.grid);
        }
      } catch (error) {
        console.log('Temperature data not available yet');
      }
    };

    const timer = setTimeout(fetchTemperatureData, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [overlayType]);

  // Fetch wind data for particle animation (2D only)
  useEffect(() => {
    if (overlayType !== 'wind' || viewMode !== '2d' || !mapRef.current) return;
    
    const fetchWindData = async () => {
      try {
        const map = mapRef.current?.getMap();
        if (!map) return;

        if (!map.loaded()) {
          map.once('idle', fetchWindData);
          return;
        }
        
        const bounds = map.getBounds();
        const north = bounds.getNorth();
        const south = bounds.getSouth();
        const east = bounds.getEast();
        const west = bounds.getWest();
        
        // Create a grid of points to fetch wind data
        const latStep = (north - south) / 8;
        const lonStep = (east - west) / 8;
        
        const promises = [];
        for (let i = 0; i <= 8; i++) {
          for (let j = 0; j <= 8; j++) {
            let lat = south + (i * latStep);
            let lon = west + (j * lonStep);
            
            // Normalize coordinates to valid ranges
            lat = Math.max(-85, Math.min(85, lat)); // Lat must be -85 to 85
            // Normalize lon to -180 to 180
            while (lon > 180) lon -= 360;
            while (lon < -180) lon += 360;
            
            promises.push(
              fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=c8e28a232f71b820576f88f0599c8a09`)
                .then(res => res.json())
                .then(data => ({
                  lat,
                  lon,
                  speed: data.wind?.speed || 0,
                  direction: data.wind?.deg || 0
                }))
                .catch(() => ({ lat, lon, speed: 0, direction: 0 }))
            );
          }
        }
        
        const results = await Promise.all(promises);
        setWindData(results);
        setWindDataTimestamp(Date.now()); // Update timestamp to force particle recreation
      } catch (error) {
        console.log('Wind data not available');
      }
    };
    
    fetchWindData();
    
    // Refetch when map moves/zooms
    const map = mapRef.current.getMap();
    const handleMoveEnd = () => {
      if (overlayType === 'wind') fetchWindData();
    };
    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [overlayType, viewMode]);

  // Handle map click
  const handleMapClick = (event: any) => {
    if (event.lngLat) {
      setClickedLocation({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng
      });
      setSelectedMarker(-1); // Special marker for clicked location
    }
  };

  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  // Create GeoJSON from temperature data
  const temperatureGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: temperatureData.map((point: any) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [point.lon, point.lat]
        },
        properties: {
          temperature: point.temperature,
          // Normalize temperature for heatmap weight (-20°C to 45°C range)
          weight: Math.max(0, Math.min(1, (point.temperature + 20) / 65))
        }
      }))
    };
  }, [temperatureData]);

  // Check if MapBox token is configured
  if (!MAPBOX_TOKEN) {
    return (
      <Card className="p-8 glass-effect shadow-md">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-4xl">⚠️</div>
          <h3 className="text-xl font-bold">MapBox Token Missing</h3>
          <p className="text-muted-foreground">
            Please add your MapBox access token to the <code className="bg-muted px-2 py-1 rounded">.env</code> file:
          </p>
          <pre className="bg-muted p-4 rounded text-left text-sm overflow-x-auto">
            VITE_MAPBOX_TOKEN=your_mapbox_token_here
          </pre>
          <p className="text-sm text-muted-foreground">
            Get your token from <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-primary underline">MapBox Account</a>
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-2xl font-bold">Interactive Air Quality Map</h3>
            <p className="text-sm text-muted-foreground">
              Real-time TEMPO satellite data visualization {tempoLoading && <Loader2 className="inline w-4 h-4 animate-spin ml-2" />}
            </p>
          </div>
        </div>
        
        {/* Pollutant Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Pollutant:</span>
          <div className="flex gap-2">
            <Button
              variant={selectedPollutant === 'pm25' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPollutant('pm25')}
            >
              PM2.5
            </Button>
            <Button
              variant={selectedPollutant === 'no2' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPollutant('no2')}
            >
              NO₂
            </Button>
            <Button
              variant={selectedPollutant === 'o3' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPollutant('o3')}
            >
              O₃
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-6 glass-effect shadow-md">
        {/* Map Controls */}
        <div className="space-y-3 mb-4 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === '2d' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('2d')}
              >
                <MapPin className="w-4 h-4 mr-2" />
                2D Map
              </Button>
              <Button
                variant={viewMode === '3d' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('3d')}
              >
                <Globe className="w-4 h-4 mr-2" />
                3D Globe
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Opacity:</span>
              <div className="w-32">
                <Slider
                  value={opacity}
                  onValueChange={setOpacity}
                  max={100}
                  step={1}
                />
              </div>
              <span className="text-sm font-medium w-12">{opacity[0]}%</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium mr-2">Overlays:</span>
            <Button
              variant={overlayType === 'pollution' ? "default" : "outline"}
              size="sm"
              onClick={() => setOverlayType('pollution')}
            >
              <Satellite className="w-4 h-4 mr-2" />
              Pollution
            </Button>
            <Button
              variant={overlayType === 'temperature' ? "default" : "outline"}
              size="sm"
              onClick={() => setOverlayType('temperature')}
            >
              <Layers className="w-4 h-4 mr-2" />
              Temperature
            </Button>
            <Button
              variant={overlayType === 'wind' ? "default" : "outline"}
              size="sm"
              onClick={() => setOverlayType('wind')}
            >
              <Layers className="w-4 h-4 mr-2" />
              Wind
            </Button>
            <Button
              variant={overlayType === 'none' ? "default" : "outline"}
              size="sm"
              onClick={() => setOverlayType('none')}
            >
              None
            </Button>
          </div>
        </div>

        {/* Mapbox Integration */}
        <div className="relative w-full h-[600px] rounded-xl overflow-hidden">
          <Map
            key={viewMode}
            ref={mapRef}
            {...viewState}
            projection={(viewMode === '3d' ? { name: 'globe' } : { name: 'mercator' }) as any}
            onMove={evt => setViewState(evt.viewState)}
            onClick={handleMapClick}
            onLoad={() => {
              console.log('Map loaded in mode:', viewMode);
              setIsMapLoading(false);
              // Apply fog only for 3D
              if (mapRef.current && viewMode === '3d') {
                const map = mapRef.current.getMap();
                map.setFog({
                  range: [0.5, 10],
                  color: '#1a1f3a',
                  'horizon-blend': 0.3,
                  'high-color': '#1e3a8a',
                  'space-color': '#0a0e1a',
                  'star-intensity': 0.25
                });
              }
            }}
            onError={(e) => {
              console.error('Map error:', e);
              setMapError('Failed to load map');
              setIsMapLoading(false);
            }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="bottom-right" />
            <ScaleControl />
            
            {/* Overlay layers - Pollution Heat map */}
            {overlayType === 'pollution' && heatmapData.features.length > 0 && (
              <Source id="pollution-source" type="geojson" data={heatmapData}>
                <Layer {...heatmapLayer} />
                <Layer {...circleLayer} />
              </Source>
            )}
            
            {/* Temperature Overlay - OpenWeatherMap temperature tiles */}
            {overlayType === 'temperature' && (
              <Source
                id="temperature-source"
                type="raster"
                tiles={[
                  `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=c8e28a232f71b820576f88f0599c8a09`
                ]}
                tileSize={256}
                minzoom={0}
                maxzoom={10}
              >
                <Layer
                  id="temperature-layer"
                  type="raster"
                  paint={{
                    'raster-opacity': opacity[0] / 100,
                    'raster-fade-duration': 300
                  }}
                />
              </Source>
            )}
            
            {/* Wind Overlay - OpenWeatherMap wind speed tiles */}
            {overlayType === 'wind' && (
              <Source
                id="wind-source"
                type="raster"
                tiles={[
                  `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=c8e28a232f71b820576f88f0599c8a09`
                ]}
                tileSize={256}
                minzoom={0}
                maxzoom={10}
              >
                <Layer
                  id="wind-layer"
                  type="raster"
                  paint={{
                    'raster-opacity': opacity[0] / 100 * 0.7,
                    'raster-fade-duration': 300
                  }}
                />
              </Source>
            )}

            {/* City markers - show all locations in both modes */}
            {locationsWithColors.map((loc: any, idx) => (
              <Marker
                key={idx}
                longitude={loc.lng}
                latitude={loc.lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedMarker(idx);
                }}
              >
                <div 
                  className="cursor-pointer flex items-center justify-center rounded-full border-2 border-white shadow-xl hover:scale-125 transition-all duration-200 w-10 h-10"
                  style={{ backgroundColor: loc.color }}
                >
                  <span className="text-white text-xs font-bold">{loc.aqi}</span>
                </div>
              </Marker>
            ))}

            {/* Clicked location marker */}
            {clickedLocation && (
              <Marker
                longitude={clickedLocation.lng}
                latitude={clickedLocation.lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedMarker(-1);
                }}
              >
                <div 
                  className="cursor-pointer flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-xl hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: clickedData?.results?.[0]?.aqi 
                      ? getAQIColor(clickedData.results[0].aqi) 
                      : '#666666'
                  }}
                >
                  {clickedData?.results?.[0]?.aqi && (
                    <span className="text-white text-xs font-bold">
                      {clickedData.results[0].aqi}
                    </span>
                  )}
                </div>
              </Marker>
            )}

            {/* Popup for selected city */}
            {selectedMarker !== null && selectedMarker >= 0 && locationsWithColors[selectedMarker] && (
              <Popup
                longitude={locationsWithColors[selectedMarker].lng}
                latitude={locationsWithColors[selectedMarker].lat}
                anchor="bottom"
                onClose={() => setSelectedMarker(null)}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="p-2 min-w-[160px]">
                  <h3 className="font-semibold text-sm mb-1">
                    {locationsWithColors[selectedMarker].name}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {locationsWithColors[selectedMarker].country}
                  </p>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">AQI:</span>
                    {/* Inline style required for dynamic AQI color */}
                    <span className="text-sm font-bold" style={{ color: getAQIColor(locationsWithColors[selectedMarker].aqi) }}>
                      {locationsWithColors[selectedMarker].aqi}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{selectedPollutant.toUpperCase()}:</span>
                    <span className="text-xs font-medium">
                      {locationsWithColors[selectedMarker].value?.toFixed(1)} {locationsWithColors[selectedMarker].unit}
                    </span>
                  </div>
                  {/* Inline style required for dynamic AQI color */}
                  <p className="text-xs font-medium mt-2" style={{ color: getAQIColor(locationsWithColors[selectedMarker].aqi) }}>
                    {getAQILevel(locationsWithColors[selectedMarker].aqi)}
                  </p>
                </div>
              </Popup>
            )}

            {/* Popup for clicked location */}
            {selectedMarker === -1 && clickedLocation && (
              <Popup
                longitude={clickedLocation.lng}
                latitude={clickedLocation.lat}
                anchor="bottom"
                onClose={() => {
                  setSelectedMarker(null);
                  setClickedLocation(null);
                }}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-1">Custom Location</h3>
                  <p className="text-xs text-gray-600">
                    {clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)}
                  </p>
                  {clickedData?.results?.[0] ? (
                    <>
                      <p className="text-xs text-gray-600">
                        AQI: {clickedData.results[0].aqi}
                      </p>
                      <p className="text-xs text-gray-600">
                        {clickedData.results[0].value?.toFixed(1)} {clickedData.results[0].unit}
                      </p>
                      <p className="text-xs font-medium mt-1" 
                         style={{ color: getAQIColor(clickedData.results[0].aqi) }}>
                        {getAQILevel(clickedData.results[0].aqi)}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Loading data...</p>
                  )}
                </div>
              </Popup>
            )}
          </Map>
          {legendConfig && (
            <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-xl px-5 py-4 text-white z-10 w-[360px] max-w-[90%] shadow-lg">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                <span>{legendConfig.title}</span>
                <span>{viewMode === '3d' ? '3D View' : '2D View'}</span>
              </div>
              <div className="h-3 rounded-full mb-2" style={{ background: legendGradient }} />
              <div className="flex justify-between text-[10px] text-white/80">
                {legendConfig.labels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          )}
          {/* Wind Particles Animation Overlay */}
          {overlayType === 'wind' && viewMode === '2d' && windData.length > 0 && mapRef.current && (
            <WindParticles
              key={`wind-${windDataTimestamp}`}
              windData={windData}
              bounds={{
                north: mapRef.current.getMap().getBounds().getNorth(),
                south: mapRef.current.getMap().getBounds().getSouth(),
                east: mapRef.current.getMap().getBounds().getEast(),
                west: mapRef.current.getMap().getBounds().getWest()
              }}
              zoom={viewState.zoom}
              opacity={opacity[0] / 100}
              viewMode={viewMode}
            />
          )}
          
          {/* Loading indicator */}
          {isMapLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading {viewMode === '3d' ? '3D Globe' : 'Map'}...</span>
              </div>
            </div>
          )}
          
          {/* Error display */}
          {mapError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg">
              {mapError}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[hsl(var(--aqi-good))]" />
            <span>Good (0-50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[hsl(var(--aqi-moderate))]" />
            <span>Moderate (51-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[hsl(var(--aqi-sensitive))]" />
            <span>Unhealthy (101-150)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[hsl(var(--aqi-unhealthy))]" />
            <span>Very Unhealthy (151+)</span>
          </div>
        </div>
      </Card>

      {/* TEMPO Satellite Data Display */}
      {tempoData?.data && (
        <Card className="p-6 glass-effect shadow-md border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-primary/10">
              <Satellite className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">NASA TEMPO Satellite Data</h4>
              <p className="text-xs text-muted-foreground">
                Current location: {location?.lat.toFixed(4)}, {location?.lon.toFixed(4)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {tempoData.data.pm25 && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">PM2.5</div>
                <div className="text-2xl font-bold">{tempoData.data.pm25.value.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">{tempoData.data.pm25.unit}</div>
                <div className="text-xs font-medium mt-2" style={{ color: getAQIColor(tempoData.data.pm25.aqi) }}>
                  AQI: {tempoData.data.pm25.aqi}
                </div>
              </div>
            )}
            {tempoData.data.no2 && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">NO₂</div>
                <div className="text-2xl font-bold">{tempoData.data.no2.value.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">{tempoData.data.no2.unit}</div>
                <div className="text-xs font-medium mt-2" style={{ color: getAQIColor(tempoData.data.no2.aqi) }}>
                  AQI: {tempoData.data.no2.aqi}
                </div>
              </div>
            )}
            {tempoData.data.o3 && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">O₃</div>
                <div className="text-2xl font-bold">{tempoData.data.o3.value.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">{tempoData.data.o3.unit}</div>
                <div className="text-xs font-medium mt-2" style={{ color: getAQIColor(tempoData.data.o3.aqi) }}>
                  AQI: {tempoData.data.o3.aqi}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground">
            <p>Last updated: {new Date(tempoData.timestamp).toLocaleString()}</p>
            <p className="mt-1">Data aggregated from {tempoData.data.pm25?.measurements_count || 0} ground stations</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MapView;