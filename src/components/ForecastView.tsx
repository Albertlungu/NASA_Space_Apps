import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";

interface ForecastData {
  time: string;
  aqi: number;
  trend: "up" | "down" | "stable";
  confidence: number;
}

const ForecastView = () => {
  // Mock forecast data - will be replaced with real predictions
  const forecastData: ForecastData[] = [
    { time: "Now", aqi: 45, trend: "stable", confidence: 100 },
    { time: "3 PM", aqi: 52, trend: "up", confidence: 95 },
    { time: "6 PM", aqi: 68, trend: "up", confidence: 90 },
    { time: "9 PM", aqi: 58, trend: "down", confidence: 85 },
    { time: "12 AM", aqi: 42, trend: "down", confidence: 80 },
    { time: "3 AM", aqi: 38, trend: "down", confidence: 75 },
    { time: "6 AM", aqi: 35, trend: "stable", confidence: 70 },
    { time: "9 AM", aqi: 48, trend: "up", confidence: 65 },
  ];

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "text-[hsl(var(--aqi-good))]";
    if (aqi <= 100) return "text-[hsl(var(--aqi-moderate))]";
    if (aqi <= 150) return "text-[hsl(var(--aqi-sensitive))]";
    return "text-[hsl(var(--aqi-unhealthy))]";
  };

  const getAQIBg = (aqi: number) => {
    if (aqi <= 50) return "bg-[hsl(var(--aqi-good))]/10";
    if (aqi <= 100) return "bg-[hsl(var(--aqi-moderate))]/10";
    if (aqi <= 150) return "bg-[hsl(var(--aqi-sensitive))]/10";
    return "bg-[hsl(var(--aqi-unhealthy))]/10";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-warning" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-secondary" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-2xl font-bold">24-Hour Forecast</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered predictions with confidence intervals
          </p>
        </div>
      </div>

      <Card className="p-6 glass-effect shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {forecastData.map((forecast, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl ${getAQIBg(forecast.aqi)} border border-border/50 hover:shadow-md transition-all`}
            >
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {forecast.time}
              </div>
              <div className={`text-2xl font-bold mb-1 ${getAQIColor(forecast.aqi)}`}>
                {forecast.aqi}
              </div>
              <div className="flex items-center justify-between">
                {getTrendIcon(forecast.trend)}
                <div className="text-xs text-muted-foreground">
                  {forecast.confidence}%
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-warning mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Forecast Summary</p>
              <p className="text-sm text-muted-foreground">
                Air quality expected to peak at 6 PM (AQI 68) due to evening traffic patterns. 
                Conditions will improve overnight and reach best levels at 6 AM (AQI 35). 
                Plan outdoor activities for early morning hours.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ForecastView;
