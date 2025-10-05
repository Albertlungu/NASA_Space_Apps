import { useEffect, useState, useMemo } from 'react';
import AQICard from "./AQICard";
import ExposureTracker from "./ExposureTracker";
import AlertPanel from "./AlertPanel";
import { Activity, TrendingUp, Wind, Droplets, Search, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAirQuality, useTempoData } from "@/hooks/useAirQuality";
import { getAQIColor, getLocationFromCoords, getCoordsFromLocation, getNearbyAQIStations, getWAQIDataByCoords } from "@/lib/api";

const Dashboard = () => {
  // Geolocation and search state
  const { location: geoLocation } = useGeolocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocationName, setCurrentLocationName] = useState('Current Location');
  
  // Set selected location to geolocation when available
  useEffect(() => {
    if (geoLocation && !selectedLocation) {
      setSelectedLocation(geoLocation);
    }
  }, [geoLocation, selectedLocation]);
  
  // Active coordinates for all API calls
  const activeLat = selectedLocation?.lat;
  const activeLon = selectedLocation?.lon;
  
  // Fetch air quality data for active location
  const { data: pm25Data, isLoading: pm25Loading } = useAirQuality(activeLat, activeLon, 'pm25');
  const { data: no2Data } = useAirQuality(activeLat, activeLon, 'no2');
  const { data: o3Data } = useAirQuality(activeLat, activeLon, 'o3');
  const { data: tempoData } = useTempoData(activeLat, activeLon);
  
  const [aqiCardsData, setAqiCardsData] = useState([]);
  const [waqiPollutants, setWaqiPollutants] = useState(null);
  
  // Fetch real WAQI pollutant data
  useEffect(() => {
    const fetchWAQIData = async () => {
      if (!activeLat || !activeLon) return;
      
      const data = await getWAQIDataByCoords(
        activeLat,
        activeLon,
        import.meta.env.VITE_AQI_TOKEN
      );
      
      if (data) {
        setWaqiPollutants(data);
      }
    };
    
    fetchWAQIData();
  }, [activeLat, activeLon]);
  
  // Get location name for current coordinates
  useEffect(() => {
    const fetchLocationName = async () => {
      if (!activeLat || !activeLon) return;
      
      const location = await getLocationFromCoords(activeLat, activeLon);
      if (location) {
        setCurrentLocationName(`${location.city}, ${location.country}`);
      }
    };
    
    fetchLocationName();
  }, [activeLat, activeLon]);
  
  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Fetch nearby stations and prepare AQI cards using WAQI
  useEffect(() => {
    const fetchNearbyLocations = async () => {
      if (!activeLat || !activeLon) return;
      
      // Fetch REAL WAQI data for main location
      const mainWaqiData = await getWAQIDataByCoords(
        activeLat,
        activeLon,
        import.meta.env.VITE_AQI_TOKEN
      );
      
      if (!mainWaqiData) return;
      
      // Main location card with REAL WAQI data
      const mainCard = {
        location: currentLocationName,
        aqi: mainWaqiData.aqi,
        pollutant: "PM2.5",
        timestamp: "Live",
        isMain: true
      };
      
      // Fetch WAQI data for nearby locations (offset by ~50km in different directions)
      const nearbyOffsets = [
        { lat: 0.5, lon: 0, label: 'North' },
        { lat: -0.5, lon: 0, label: 'South' },
        { lat: 0, lon: 0.5, label: 'East' },
        { lat: 0, lon: -0.5, label: 'West' }
      ];
      
      const nearbyCards = [];
      
      for (const offset of nearbyOffsets) {
        const nearbyLat = activeLat + offset.lat;
        const nearbyLon = activeLon + offset.lon;
        
        try {
          const nearbyData = await getWAQIDataByCoords(
            nearbyLat,
            nearbyLon,
            import.meta.env.VITE_AQI_TOKEN
          );
          
          if (nearbyData && nearbyData.station !== mainWaqiData.station) {
            const location = await getLocationFromCoords(nearbyLat, nearbyLon);
            const locationName = location ? `${location.city}, ${location.country}` : nearbyData.station;
            
            // Check if we already have this station
            if (!nearbyCards.some(card => card.location === locationName)) {
              nearbyCards.push({
                location: locationName,
                aqi: nearbyData.aqi,
                pollutant: "PM2.5",
                timestamp: "Live",
                isMain: false
              });
            }
          }
        } catch (error) {
          console.log(`Failed to fetch nearby data for ${offset.label}`);
        }
        
        // Stop if we have 2 nearby stations
        if (nearbyCards.length >= 2) break;
      }
      
      // Set the cards data
      if (nearbyCards.length > 0) {
        setAqiCardsData([mainCard, ...nearbyCards.slice(0, 2)]);
      } else {
        // No nearby stations found
        setAqiCardsData([
          mainCard,
          { location: "No nearby monitoring stations", aqi: 0, pollutant: "PM2.5", timestamp: "N/A", isMain: false },
          { location: "Try searching another city", aqi: 0, pollutant: "PM2.5", timestamp: "N/A", isMain: false }
        ]);
      }
    };
    
    fetchNearbyLocations();
  }, [activeLat, activeLon, currentLocationName]);
  
  // Search handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const coords = await getCoordsFromLocation(searchQuery);
      
      if (coords) {
        setSelectedLocation(coords);
        setSearchQuery('');
      } else {
        alert("Could not find the location. Please try a different search term.");
      }
    } catch (error) {
      console.error('Search error:', error);
      alert("An error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle Enter key in search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Reset to user's geolocation
  const resetToGeolocation = () => {
    if (geoLocation) {
      setSelectedLocation(geoLocation);
    }
  };
  
  // Pollutant data with REAL WAQI values
  const pollutantData = useMemo(() => {
    // Use WAQI data first, fallback to other sources
    const pm25Value = waqiPollutants?.pm25 ?? tempoData?.data?.pm25?.value ?? pm25Data?.results?.[0]?.value;
    const pm25Aqi = waqiPollutants?.aqi ?? tempoData?.data?.pm25?.aqi ?? pm25Data?.results?.[0]?.aqi ?? 0;
    
    const no2Value = waqiPollutants?.no2 ?? tempoData?.data?.no2?.value ?? no2Data?.results?.[0]?.value;
    const no2Aqi = waqiPollutants?.aqi ?? tempoData?.data?.no2?.aqi ?? no2Data?.results?.[0]?.aqi ?? 0;
    
    const o3Value = waqiPollutants?.o3 ?? tempoData?.data?.o3?.value ?? o3Data?.results?.[0]?.value;
    const o3Aqi = waqiPollutants?.aqi ?? tempoData?.data?.o3?.aqi ?? o3Data?.results?.[0]?.aqi ?? 0;
    
    const pollutants = [
      { 
        name: "PM2.5", 
        value: pm25Value !== undefined && pm25Value !== null ? pm25Value.toFixed(1) : 'N/A',
        unit: "µg/m³", 
        icon: Droplets, 
        color: pm25Aqi > 0 ? getAQIColor(pm25Aqi) : "#9ca3af",
        aqi: pm25Aqi
      },
      { 
        name: "NO2", 
        value: no2Value !== undefined && no2Value !== null ? no2Value.toFixed(1) : 'N/A',
        unit: "ppb", 
        icon: Activity, 
        color: no2Aqi > 0 ? getAQIColor(no2Aqi) : "#9ca3af",
        aqi: no2Aqi
      },
      { 
        name: "O3", 
        value: o3Value !== undefined && o3Value !== null ? o3Value.toFixed(1) : 'N/A',
        unit: "ppb", 
        icon: TrendingUp, 
        color: o3Aqi > 0 ? getAQIColor(o3Aqi) : "#9ca3af",
        aqi: o3Aqi
      },
      { 
        name: "PM10", 
        value: 'N/A',
        unit: "µg/m³", 
        icon: Wind, 
        color: "#9ca3af",
        aqi: 0
      },
    ];
    
    console.log('Computed pollutant data:', pollutants); // Debug log
    return pollutants;
  }, [waqiPollutants, tempoData, pm25Data, no2Data, o3Data]);
  
  // Loading placeholder cards (only 3 total)
  const loadingCards = [
    { location: "Loading your location...", aqi: 0, pollutant: "PM2.5", timestamp: "...", isMain: true },
    { location: "Finding nearby area 1...", aqi: 0, pollutant: "PM2.5", timestamp: "...", isMain: false },
    { location: "Finding nearby area 2...", aqi: 0, pollutant: "PM2.5", timestamp: "...", isMain: false }
  ];

  return (
    <section className="py-16 px-4 md:px-6">
      <div className="container">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Air Quality Dashboard</h2>
          <p className="text-muted-foreground">Real-time monitoring and forecasts across locations</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="flex-grow">
              <Input
                type="text"
                placeholder="Search for any city worldwide (e.g., Tokyo, London, New York)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full"
                disabled={isSearching}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
              {selectedLocation && geoLocation && 
               (selectedLocation.lat !== geoLocation.lat || selectedLocation.lon !== geoLocation.lon) && (
                <Button variant="outline" onClick={resetToGeolocation}>
                  <MapPin className="w-4 h-4 mr-2" />
                  My Location
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Alert Panel */}
        <div className="mb-8">
          <AlertPanel 
            lat={activeLat} 
            lon={activeLon}
            currentAqi={pm25Data?.results?.[0]?.aqi || 0}
            currentLocationName={currentLocationName}
          />
        </div>

        {/* AQI Cards Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            {currentLocationName} & Nearby Areas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(pm25Loading ? loadingCards : aqiCardsData.length > 0 ? aqiCardsData : loadingCards).map((loc, idx) => (
              <AQICard 
                key={idx} 
                {...loc}
                isLoading={pm25Loading}
              />
            ))}
          </div>
        </div>

        {/* Pollutant Details */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">
            Pollutant Breakdown for {currentLocationName}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pollutantData.map((pollutant, idx) => (
              <Card key={idx} className="p-6 glass-effect shadow-md hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <pollutant.icon className="w-8 h-8" style={{ color: pollutant.color }} />
                </div>
                <div className="text-2xl font-bold mb-1">{pollutant.value}</div>
                <div className="text-sm text-muted-foreground">{pollutant.unit}</div>
                <div className="text-xs font-semibold mt-2">{pollutant.name}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Exposure Tracker - Removed as requested */}
      </div>
    </section>
  );
};

export default Dashboard;