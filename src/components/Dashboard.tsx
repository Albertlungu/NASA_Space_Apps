import { useEffect, useState } from 'react';
import AQICard from "./AQICard";
import ExposureTracker from "./ExposureTracker";
import AlertPanel from "./AlertPanel";
import { Activity, TrendingUp, Wind, Droplets } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAirQuality, useTempoData } from "@/hooks/useAirQuality";
import { getAQIColor, getLocationFromCoords } from "@/lib/api";

const Dashboard = () => {
  const { location } = useGeolocation();
  
  // Fetch real air quality data for current location
  const { data: pm25Data, isLoading: pm25Loading } = useAirQuality(location?.lat, location?.lon, 'pm25');
  const { data: no2Data } = useAirQuality(location?.lat, location?.lon, 'no2');
  const { data: o3Data } = useAirQuality(location?.lat, location?.lon, 'o3');
  const { data: tempoData } = useTempoData(location?.lat, location?.lon);
  
  const [enrichedLocations, setEnrichedLocations] = useState([]);

  useEffect(() => {
    const enrichLocations = async () => {
      if (!pm25Data?.results) return;
      
      const locations = await Promise.all(
        pm25Data.results.slice(0, 3).map(async (reading) => {
          const coords = reading.coordinates;
          let locationLabel = 'Unknown Location';
          
          if (coords) {
            const location = await getLocationFromCoords(coords.latitude, coords.longitude);
            if (location) {
              locationLabel = `${location.city}, ${location.country}`;
            }
          }
          
          return {
            location: locationLabel,
            aqi: reading.aqi,
            pollutant: "PM2.5",
            timestamp: reading.date?.local 
              ? new Date(reading.date.local).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
              : "Live"
          };
        })
      );
      
      setEnrichedLocations(locations);
    };
    
    enrichLocations();
  }, [pm25Data]);

  const mockLocations = enrichedLocations.length > 0 ? enrichedLocations : [
    { location: "Manhattan, US", aqi: 198, pollutant: "PM2.5", timestamp: "Live" },
    { location: "Brooklyn, US", aqi: 181, pollutant: "PM2.5", timestamp: "Live" },
    { location: "Queens, US", aqi: 169, pollutant: "PM2.5", timestamp: "Live" },
  ];

  // Get real pollutant data from TEMPO
  const pollutantData = [
    { 
      name: "PM2.5", 
      value: tempoData?.data?.pm25?.value || pm25Data?.results?.[0]?.value || 145.92,
      unit: "µg/m³", 
      icon: Droplets, 
      color: `text-[${getAQIColor(tempoData?.data?.pm25?.aqi || 198)}]`
    },
    { 
      name: "NO2", 
      value: tempoData?.data?.no2?.value || no2Data?.results?.[0]?.value || 45.2,
      unit: "ppb", 
      icon: Activity, 
      color: `text-[${getAQIColor(tempoData?.data?.no2?.aqi || 85)}]`
    },
    { 
      name: "O3", 
      value: tempoData?.data?.o3?.value || o3Data?.results?.[0]?.value || 38.5,
      unit: "ppb", 
      icon: TrendingUp, 
      color: `text-[${getAQIColor(tempoData?.data?.o3?.aqi || 72)}]`
    },
    { 
      name: "PM10", 
      value: 28.3, 
      unit: "µg/m³", 
      icon: Wind, 
      color: "text-[hsl(var(--aqi-moderate))]"
    },
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