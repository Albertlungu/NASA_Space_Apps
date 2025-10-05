import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import AQICard from "@/components/AQICard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Map, Heart, BarChart3, BookOpen, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { getWAQIDataByCoords } from "@/lib/api";

const Index = () => {
  // Fetch real data from backend for major cities
  const cities = [
    { name: "New York, NY", lat: 40.7128, lon: -74.0060 },
    { name: "Los Angeles, CA", lat: 34.0522, lon: -118.2437 },
    { name: "Chicago, IL", lat: 41.8781, lon: -87.6298 },
  ];
  const [cityData, setCityData] = useState({
    ny: null,
    la: null,
    chi: null
  });

  useEffect(() => {
    const fetchCityData = async () => {
      try {
        const [nyData, laData, chiData] = await Promise.all([
          getWAQIDataByCoords(cities[0].lat, cities[0].lon, import.meta.env.VITE_AQI_TOKEN),
          getWAQIDataByCoords(cities[1].lat, cities[1].lon, import.meta.env.VITE_AQI_TOKEN),
          getWAQIDataByCoords(cities[2].lat, cities[2].lon, import.meta.env.VITE_AQI_TOKEN)
        ]);
        
        setCityData({
          ny: nyData,
          la: laData,
          chi: chiData
        });
      } catch (error) {
        console.error('Failed to fetch city AQI data:', error);
      }
    };
    
    fetchCityData();
  }, []);

  
  
  

  // Use real data or fallback to loading state
  const quickStats = [
    {
      location: cities[0].name,
      aqi: cityData.ny?.aqi || '--',
      pollutant: "PM2.5",
      timestamp: "Live"
    },
    {
      location: cities[1].name,
      aqi: cityData.la?.aqi || '--',
      pollutant: "PM2.5",
      timestamp: "Live"
    },
    {
      location: cities[2].name,
      aqi: cityData.chi?.aqi || '--',
      pollutant: "PM2.5",
      timestamp: "Live"
    },
  ];

  const features = [
    {
      title: "Live Dashboard",
      description: "Real-time air quality monitoring across multiple locations",
      icon: TrendingUp,
      link: "/dashboard",
      color: "text-primary",
    },
    {
      title: "24-Hour Forecast",
      description: "AI-powered predictions with confidence intervals",
      icon: Calendar,
      link: "/forecast",
      color: "text-secondary",
    },
    {
      title: "Interactive Map",
      description: "TEMPO satellite overlay with pollution heatmaps",
      icon: Map,
      link: "/map",
      color: "text-[hsl(var(--aqi-moderate))]",
    },
    {
      title: "Health Guidance",
      description: "Personalized recommendations for all stakeholders",
      icon: Heart,
      link: "/health",
      color: "text-[hsl(var(--aqi-unhealthy))]",
    },
    {
      title: "Analytics & Trends",
      description: "Historical data and weather correlation analysis",
      icon: BarChart3,
      link: "/analytics",
      color: "text-[hsl(var(--aqi-sensitive))]",
    },
    {
      title: "Educational Resources",
      description: "Learn about air quality and pollutants",
      icon: BookOpen,
      link: "/education",
      color: "text-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      
      <div className="container px-4 md:px-6 py-16 space-y-16">
        {/* Quick Overview */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Current Air Quality</h2>
              <p className="text-muted-foreground">Live readings from major cities</p>
            </div>
            <Link to="/dashboard">
              <Button>
                View Full Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickStats.map((stat, idx) => (
              <AQICard key={idx} {...stat} />
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Explore AirWatch Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive air quality monitoring and analysis tools powered by NASA TEMPO satellite data
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Link key={idx} to={feature.link} className="block group">
                <div className="p-6 rounded-2xl glass-effect shadow-md hover:shadow-lg transition-all h-full border border-border/50 group-hover:border-primary/50">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors">
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
