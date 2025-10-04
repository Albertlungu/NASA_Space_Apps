import AQICard from "./AQICard";
import ExposureTracker from "./ExposureTracker";
import AlertPanel from "./AlertPanel";
import { Activity, TrendingUp, Wind, Droplets } from "lucide-react";
import { Card } from "@/components/ui/card";

const Dashboard = () => {
  // Mock data - will be replaced with real API data
  const mockLocations = [
    { location: "San Francisco, CA", aqi: 45, pollutant: "PM2.5", timestamp: "5 mins ago" },
    { location: "Los Angeles, CA", aqi: 125, pollutant: "Ozone", timestamp: "3 mins ago" },
    { location: "New York, NY", aqi: 68, pollutant: "NO2", timestamp: "2 mins ago" },
  ];

  const pollutantData = [
    { name: "PM2.5", value: 12.5, unit: "µg/m³", icon: Droplets, color: "text-[hsl(var(--aqi-good))]" },
    { name: "PM10", value: 28.3, unit: "µg/m³", icon: Wind, color: "text-[hsl(var(--aqi-moderate))]" },
    { name: "NO2", value: 18.7, unit: "ppb", icon: Activity, color: "text-[hsl(var(--aqi-good))]" },
    { name: "O3", value: 45.2, unit: "ppb", icon: TrendingUp, color: "text-[hsl(var(--aqi-moderate))]" },
  ];

  return (
    <section className="py-16 px-4 md:px-6">
      <div className="container">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Air Quality Dashboard</h2>
          <p className="text-muted-foreground">Real-time monitoring and forecasts across locations</p>
        </div>

        {/* Alert Panel */}
        <div className="mb-8">
          <AlertPanel />
        </div>

        {/* AQI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {mockLocations.map((loc, idx) => (
            <AQICard key={idx} {...loc} />
          ))}
        </div>

        {/* Pollutant Details */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Pollutant Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pollutantData.map((pollutant, idx) => (
              <Card key={idx} className="p-6 glass-effect shadow-md hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <pollutant.icon className={`w-8 h-8 ${pollutant.color}`} />
                </div>
                <div className="text-2xl font-bold mb-1">{pollutant.value}</div>
                <div className="text-sm text-muted-foreground">{pollutant.unit}</div>
                <div className="text-xs font-semibold mt-2">{pollutant.name}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Exposure Tracker */}
        <ExposureTracker />
      </div>
    </section>
  );
};

export default Dashboard;
