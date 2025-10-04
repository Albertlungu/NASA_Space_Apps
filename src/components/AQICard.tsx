import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Wind } from "lucide-react";

interface AQICardProps {
  location: string;
  aqi: number;
  pollutant: string;
  timestamp: string;
}

const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return "bg-[hsl(var(--aqi-good))]";
  if (aqi <= 100) return "bg-[hsl(var(--aqi-moderate))]";
  if (aqi <= 150) return "bg-[hsl(var(--aqi-sensitive))]";
  if (aqi <= 200) return "bg-[hsl(var(--aqi-unhealthy))]";
  if (aqi <= 300) return "bg-[hsl(var(--aqi-very-unhealthy))]";
  return "bg-[hsl(var(--aqi-hazardous))]";
};

const getAQILabel = (aqi: number) => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

const AQICard = ({ location, aqi, pollutant, timestamp }: AQICardProps) => {
  return (
    <Card className="p-6 glass-effect shadow-md hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">{location}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          Live
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <div className={`text-5xl font-bold ${getAQIColor(aqi)} bg-clip-text text-transparent`}>
            {aqi}
          </div>
          <div className="text-sm text-muted-foreground">AQI</div>
        </div>

        <div className={`inline-block px-4 py-2 rounded-full text-white text-sm font-semibold ${getAQIColor(aqi)}`}>
          {getAQILabel(aqi)}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
          <Wind className="w-4 h-4" />
          <span>Main pollutant: {pollutant}</span>
        </div>

        <div className="text-xs text-muted-foreground">
          Updated {timestamp}
        </div>
      </div>
    </Card>
  );
};

export default AQICard;
