import { Card } from "@/components/ui/card";
import { Cloud, Wind, Droplets, Thermometer, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const WeatherCorrelation = () => {
  // Mock weather data - will be integrated with real weather API
  const weatherData = {
    temperature: 72,
    humidity: 45,
    windSpeed: 8,
    windDirection: "NW",
    precipitation: 0,
    visibility: 10,
    pressure: 1013,
  };

  const correlations = [
    {
      factor: "Wind Speed",
      icon: Wind,
      value: weatherData.windSpeed,
      unit: "mph",
      impact: "Positive",
      description: "Good wind speed helping disperse pollutants",
      percentage: 75,
      color: "bg-[hsl(var(--aqi-good))]",
    },
    {
      factor: "Temperature",
      icon: Thermometer,
      value: weatherData.temperature,
      unit: "°F",
      impact: "Moderate",
      description: "Moderate temps may increase ozone formation",
      percentage: 60,
      color: "bg-[hsl(var(--aqi-moderate))]",
    },
    {
      factor: "Humidity",
      icon: Droplets,
      value: weatherData.humidity,
      unit: "%",
      impact: "Positive",
      description: "Low humidity reduces particle formation",
      percentage: 70,
      color: "bg-[hsl(var(--aqi-good))]",
    },
    {
      factor: "Visibility",
      icon: Eye,
      value: weatherData.visibility,
      unit: "mi",
      impact: "Positive",
      description: "Excellent visibility indicates clear air",
      percentage: 90,
      color: "bg-[hsl(var(--aqi-good))]",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Cloud className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-2xl font-bold">Weather Impact Analysis</h3>
          <p className="text-sm text-muted-foreground">
            How current weather conditions affect air quality
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {correlations.map((item, idx) => (
          <Card key={idx} className="p-6 glass-effect shadow-md hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-full bg-muted/50">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.unit}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold mb-1">{item.factor}</div>
                <Progress value={item.percentage} className="h-2" />
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-xs font-medium">{item.impact} Impact</span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Detailed Weather-AQI Relationship */}
      <Card className="p-6 glass-effect shadow-md">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Wind className="w-5 h-5 text-primary" />
          Weather-Pollution Dynamics
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Wind className="w-4 h-4" />
                Wind Patterns
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Current: {weatherData.windSpeed} mph from {weatherData.windDirection}
              </p>
              <p className="text-xs text-muted-foreground">
                Northwest winds are dispersing pollutants away from urban areas. 
                Wind speeds above 7 mph effectively reduce pollution concentration.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                Temperature Effects
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Current: {weatherData.temperature}°F
              </p>
              <p className="text-xs text-muted-foreground">
                Moderate temperatures promote some ozone formation but are not in the 
                critical range (above 85°F) where ozone production accelerates significantly.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Humidity & Precipitation
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Humidity: {weatherData.humidity}% | Rain: {weatherData.precipitation}"
              </p>
              <p className="text-xs text-muted-foreground">
                Low humidity reduces secondary particle formation. No precipitation means 
                pollutants aren't being washed from the atmosphere, but dry conditions 
                are generally favorable at this humidity level.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Atmospheric Stability
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Pressure: {weatherData.pressure} mb
              </p>
              <p className="text-xs text-muted-foreground">
                Normal atmospheric pressure with no temperature inversion detected. 
                Pollutants can disperse vertically. Watch for evening inversions that 
                may trap pollutants near ground level.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm">
            <strong className="text-primary">Forecast Impact:</strong> Current weather conditions 
            are favorable for air quality. Wind will continue to disperse pollutants through the 
            evening. Slight deterioration expected tomorrow afternoon due to increased 
            temperature and reduced wind speed.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default WeatherCorrelation;
