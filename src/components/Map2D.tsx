import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Map2DProps {
  opacity: number;
  showSatellite: boolean;
}

const Map2D = ({ opacity, showSatellite }: Map2DProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [tokenSaved, setTokenSaved] = useState(false);

  // Mock location markers
  const locations = [
    { name: "San Francisco", lat: 37.7749, lng: -122.4194, aqi: 45 },
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437, aqi: 125 },
    { name: "New York", lat: 40.7128, lng: -74.0060, aqi: 68 },
    { name: "Chicago", lat: 41.8781, lng: -87.6298, aqi: 52 },
  ];

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#22c55e';
    if (aqi <= 100) return '#eab308';
    if (aqi <= 150) return '#f97316';
    return '#ef4444';
  };

  useEffect(() => {
    if (!mapContainer.current || !tokenSaved || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.5795, 39.8283],
      zoom: 3.5,
      projection: 'globe' as any,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      // Add AQI markers
      locations.forEach((location) => {
        const el = document.createElement('div');
        el.className = 'aqi-marker';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = getAQIColor(location.aqi);
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '14px';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.transition = 'transform 0.2s';
        el.textContent = location.aqi.toString();

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        new mapboxgl.Marker(el)
          .setLngLat([location.lng, location.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px;">
                  <h3 style="font-weight: bold; margin-bottom: 4px;">${location.name}</h3>
                  <p style="margin: 0; font-size: 14px;">AQI: ${location.aqi}</p>
                </div>
              `)
          )
          .addTo(map.current!);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [tokenSaved, mapboxToken]);

  if (!tokenSaved) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-muted/30 rounded-xl">
        <div className="max-w-md w-full p-6 space-y-4 glass-effect rounded-xl">
          <h3 className="text-lg font-semibold">Enter Mapbox Token</h3>
          <p className="text-sm text-muted-foreground">
            To display the 2D map, please enter your Mapbox public token. 
            Get one at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
          </p>
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
            <Input
              id="mapbox-token"
              type="text"
              placeholder="pk.eyJ1..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
          </div>
          <button
            onClick={() => setTokenSaved(true)}
            disabled={!mapboxToken}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      {showSatellite && (
        <div 
          className="absolute inset-0 pointer-events-none bg-gradient-to-br from-green-500/20 via-yellow-500/20 to-orange-500/20"
          style={{ opacity: opacity / 100 }}
        />
      )}
    </div>
  );
};

export default Map2D;