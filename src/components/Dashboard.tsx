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
import { getAQIColor, getLocationFromCoords, getCoordsFromLocation, getNearbyAQIStations } from "@/lib/api";

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

  // Fetch nearby stations and prepare AQI cards
  useEffect(() => {
    const fetchNearbyLocations = async () => {
      if (!activeLat || !activeLon || !pm25Data?.results) return;
      
      // Get the main location reading (first result)
      const mainReading = pm25Data.results[0];
      
      console.log('Main reading data:', mainReading); // Debug log
      
      // Main location card
      const mainCard = {
        location: currentLocationName,
        aqi: mainReading?.aqi ?? 0,
        pollutant: "PM2.5",
        timestamp: mainReading?.date?.local 
          ? new Date(mainReading.date.local).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : mainReading?.date?.utc 
          ? new Date(mainReading.date.utc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : "Live",
        isMain: true
      };
      
      // Filter readings to only include those within 100km and skip the first one (main location)
      const nearbyReadings = pm25Data.results.slice(1).filter(reading => {
        if (!reading.coordinates) return false;
        
        const distance = calculateDistance(
          activeLat,
          activeLon,
          reading.coordinates.latitude,
          reading.coordinates.longitude
        );
        
        // Only include stations within 100km
        return distance <= 100;
      });
      
      // Process nearby readings
      const nearbyCardsWithDistance = await Promise.all(
        nearbyReadings.map(async (reading) => {
          const coords = reading.coordinates;
          let locationLabel = 'Unknown Location';
          
          if (coords) {
            const location = await getLocationFromCoords(coords.latitude, coords.longitude);
            if (location) {
              locationLabel = `${location.city}, ${location.country}`;
            }
          }
          
          const distance = calculateDistance(
            activeLat,
            activeLon,
            coords.latitude,
            coords.longitude
          );
          
          return {
            location: locationLabel,
            aqi: reading.aqi,
            pollutant: "PM2.5",
            timestamp: reading.date?.local 
              ? new Date(reading.date.local).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
              : "Live",
            isMain: false,
            distance: distance
          };
        })
      );
      
      // Filter out duplicate city names and sort by distance
      const uniqueNearbyCards = nearbyCardsWithDistance
        .filter((card, index, self) => 
          card.location !== currentLocationName &&
          card.location !== 'Unknown Location' &&
          self.findIndex(c => c.location === card.location) === index
        )
        .sort((a, b) => a.distance - b.distance);
      
      // If we have nearby cities, use them. Otherwise show message
      if (uniqueNearbyCards.length > 0) {
        setAqiCardsData([mainCard, ...uniqueNearbyCards.slice(0, 2)]);
      } else {
        // No nearby cities found within 100km
        setAqiCardsData([
          mainCard,
          { location: "No nearby monitoring stations", aqi: 0, pollutant: "PM2.5", timestamp: "N/A", isMain: false },
          { location: "Try searching another city", aqi: 0, pollutant: "PM2.5", timestamp: "N/A", isMain: false }
        ]);
      }
    };
    
    fetchNearbyLocations();
  }, [pm25Data, activeLat, activeLon, currentLocationName]);
  
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
  
  // Pollutant data with real values
  const pollutantData = useMemo(() => {
    console.log('Pollutant data sources:', { tempoData, pm25Data, no2Data, o3Data }); // Debug log
    
    const pm25Value = tempoData?.data?.pm25?.value ?? pm25Data?.results?.[0]?.value;
    const pm25Aqi = tempoData?.data?.pm25?.aqi ?? pm25Data?.results?.[0]?.aqi ?? 0;
    
    const no2Value = tempoData?.data?.no2?.value ?? no2Data?.results?.[0]?.value;
    const no2Aqi = tempoData?.data?.no2?.aqi ?? no2Data?.results?.[0]?.aqi ?? 0;
    
    const o3Value = tempoData?.data?.o3?.value ?? o3Data?.results?.[0]?.value;
    const o3Aqi = tempoData?.data?.o3?.aqi ?? o3Data?.results?.[0]?.aqi ?? 0;
    
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
  }, [tempoData, pm25Data, no2Data, o3Data]);
  
  // Loading placeholder cards (only 3 total)
  const loadingCards = [
    { location: "Loading your location...", aqi: 0, pollutant: "PM2.5", timestamp: "...", isMain: true },
    { location: "Finding nearby area 1...", aqi: 0, pollutant: "PM2.5", timestamp: "...", isMain: false },
    { location: "Finding nearby area 2...", aqi: 0, pollutant: "PM2.5", timestamp: "...", isMain: false },
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