import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MapPin, Layers, Satellite, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useState } from "react";

const MapView = () => {
  const [opacity, setOpacity] = useState([70]);
  const [showSatellite, setShowSatellite] = useState(true);

  // Mock location markers - will be replaced with real data
  const locations = [
    { name: "San Francisco", lat: 37.7749, lng: -122.4194, aqi: 45, color: "bg-[hsl(var(--aqi-good))]" },
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437, aqi: 125, color: "bg-[hsl(var(--aqi-sensitive))]" },
    { name: "New York", lat: 40.7128, lng: -74.0060, aqi: 68, color: "bg-[hsl(var(--aqi-moderate))]" },
    { name: "Chicago", lat: 41.8781, lng: -87.6298, aqi: 52, color: "bg-[hsl(var(--aqi-moderate))]" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-2xl font-bold">Interactive Air Quality Map</h3>
          <p className="text-sm text-muted-foreground">
            Real-time TEMPO satellite data visualization
          </p>
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
            <Button variant="outline" size="sm">
              <Layers className="w-4 h-4 mr-2" />
              Layers
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

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Map Placeholder - Replace with actual map library integration */}
        <div className="relative w-full h-[600px] rounded-xl overflow-hidden bg-muted/30">
          {/* Gradient background simulating map */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          
          {/* Simulated satellite overlay */}
          {showSatellite && (
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--aqi-good))]/20 via-[hsl(var(--aqi-moderate))]/20 to-[hsl(var(--aqi-sensitive))]/20"
              style={{ opacity: opacity[0] / 100 }}
            />
          )}

          {/* Location markers */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="inline-block p-6 rounded-2xl glass-effect shadow-lg">
                <Satellite className="w-12 h-12 text-primary mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Map Integration Ready</h4>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Connect to Mapbox, Leaflet, or Google Maps API to display:
                </p>
                <ul className="text-sm text-left space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    NASA TEMPO satellite imagery overlay
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Real-time AQI heatmap
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Ground station sensor locations
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Wind pattern animations
                  </li>
                </ul>
                <Button>
                  <Layers className="w-4 h-4 mr-2" />
                  Configure Map API
                </Button>
              </div>
            </div>
          </div>

          {/* Simulated location pins */}
          {locations.map((loc, idx) => (
            <div
              key={idx}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{
                left: `${25 + idx * 20}%`,
                top: `${30 + (idx % 2) * 30}%`,
              }}
            >
              <div className={`w-8 h-8 rounded-full ${loc.color} shadow-lg flex items-center justify-center animate-pulse group-hover:scale-125 transition-transform`}>
                <span className="text-white text-xs font-bold">{loc.aqi}</span>
              </div>
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                  <div className="font-semibold text-sm">{loc.name}</div>
                  <div className="text-xs text-muted-foreground">AQI: {loc.aqi}</div>
                </div>
              </div>
            </div>
          ))}
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

      {/* Map Integration Instructions */}
      <Card className="p-4 glass-effect shadow-md border-primary/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Satellite className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium mb-1">Backend Team: Map Integration Points</p>
            <p className="text-muted-foreground">
              Connect TEMPO data API endpoint here. Map will display real-time satellite imagery, 
              ground station readings, and predictive overlays. Consider using Mapbox GL JS or Leaflet 
              for interactive features. API endpoints needed: /api/tempo-data, /api/ground-stations, /api/forecasts
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MapView;
