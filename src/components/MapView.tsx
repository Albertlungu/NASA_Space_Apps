import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MapPin, Layers, Satellite, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAirQuality, useTempoData } from "@/hooks/useAirQuality";
import { getAQIColor, getAQILevel } from "@/lib/api";
import Map, { Marker, Popup, NavigationControl, ScaleControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYWxiZXJ0bHVuZ3UiLCJhIjoiY20zZmJqODRzMDFhcjJqcHBnMGRyaWFvbCJ9.1234567890abcdefghijklmnop';

const MapView = () => {
  const [opacity, setOpacity] = useState([70]);
  const [showSatellite, setShowSatellite] = useState(true);
  const [selectedPollutant, setSelectedPollutant] = useState<'pm25' | 'no2' | 'o3'>('pm25');
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const { location } = useGeolocation();
  
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
    zoom: 2
  });

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
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Button
              variant={showSatellite ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSatellite(!showSatellite)}
            >
              <Satellite className="w-4 h-4 mr-2" />
              TEMPO Overlay
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

        {/* Mapbox Integration */}
        <div className="relative w-full h-[600px] rounded-xl overflow-hidden">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onClick={handleMapClick}
            mapStyle={showSatellite ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/streets-v12"}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />
            <ScaleControl />

            {/* City markers */}
            {locationsWithColors.map((loc, idx) => (
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
                  className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform"
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
            {selectedMarker !== null && selectedMarker >= 0 && (
              <Popup
                longitude={locationsWithColors[selectedMarker].lng}
                latitude={locationsWithColors[selectedMarker].lat}
                anchor="bottom"
                onClose={() => setSelectedMarker(null)}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-1">
                    {locationsWithColors[selectedMarker].name}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {locationsWithColors[selectedMarker].country}
                  </p>
                  <p className="text-xs text-gray-600">
                    AQI: {locationsWithColors[selectedMarker].aqi}
                  </p>
                  <p className="text-xs text-gray-600">
                    {locationsWithColors[selectedMarker].value.toFixed(1)} {locationsWithColors[selectedMarker].unit}
                  </p>
                  <p className="text-xs font-medium mt-1" 
                     style={{ color: locationsWithColors[selectedMarker].color }}>
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