import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Layers, Satellite, Globe2 } from "lucide-react";
import { useState } from "react";
import Map2D from "./Map2D";
import Map3D from "./Map3D";

const MapView = () => {
  const [opacity, setOpacity] = useState([70]);
  const [showSatellite, setShowSatellite] = useState(true);

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

        {/* Map Tabs */}
        <Tabs defaultValue="2d" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-4">
            <TabsTrigger value="2d" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              2D Map
            </TabsTrigger>
            <TabsTrigger value="3d" className="flex items-center gap-2">
              <Globe2 className="w-4 h-4" />
              3D Globe
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="2d" className="mt-0">
            <Map2D opacity={opacity[0]} showSatellite={showSatellite} />
          </TabsContent>
          
          <TabsContent value="3d" className="mt-0">
            <Map3D opacity={opacity[0]} showSatellite={showSatellite} />
          </TabsContent>
        </Tabs>

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