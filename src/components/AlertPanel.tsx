import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, CheckCircle, Wind } from "lucide-react";
import { api, getAQILevel, getAQIRecommendation } from "@/lib/api";

const AlertPanel = ({ lat, lon, currentAqi, currentLocationName }) => {
  const [apiAlerts, setApiAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!lat || !lon) return;
      
      setIsLoading(true);
      try {
        const response = await api.getAlerts(lat, lon);
        if (response.status === 'success' && response.alerts) {
          setApiAlerts(response.alerts);
        }
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, [lat, lon]);

  // Generate dynamic alerts based on current AQI
  const generateDynamicAlerts = () => {
    const alerts = [];
    
    if (!currentAqi) return alerts;

    // AQI-based alert
    if (currentAqi > 150) {
      alerts.push({
        type: "danger",
        title: "Unhealthy Air Quality Alert",
        description: `${getAQILevel(currentAqi)} conditions in ${currentLocationName}. ${getAQIRecommendation(currentAqi)}`,
        icon: AlertTriangle,
      });
    } else if (currentAqi > 100) {
      alerts.push({
        type: "warning",
        title: "Air Quality Advisory",
        description: `${getAQILevel(currentAqi)} air quality in ${currentLocationName}. Sensitive groups should limit prolonged outdoor exposure.`,
        icon: AlertTriangle,
      });
    } else if (currentAqi > 50) {
      alerts.push({
        type: "info",
        title: "Moderate Air Quality",
        description: `${getAQILevel(currentAqi)} conditions in ${currentLocationName}. Air quality is acceptable for most people.`,
        icon: Info,
      });
    } else {
      alerts.push({
        type: "success",
        title: "Good Air Quality",
        description: `Excellent air quality in ${currentLocationName}. Perfect conditions for outdoor activities!`,
        icon: CheckCircle,
      });
    }

    return alerts;
  };

  // Convert API alerts to display format
  const convertApiAlerts = () => {
    return apiAlerts.map(alert => {
      let type = "info";
      let icon = Info;
      
      if (alert.severity === "high" || alert.severity === "critical") {
        type = "danger";
        icon = AlertTriangle;
      } else if (alert.severity === "medium" || alert.severity === "moderate") {
        type = "warning";
        icon = AlertTriangle;
      } else if (alert.severity === "low") {
        type = "info";
        icon = Wind;
      }

      return {
        type,
        title: `${alert.pollutant.toUpperCase()} Alert`,
        description: alert.message,
        icon,
        timestamp: new Date(alert.created_at).toLocaleString(),
      };
    });
  };

  const getAlertStyles = (type) => {
    switch (type) {
      case "danger":
        return "border-red-500/50 bg-red-500/10 text-red-900 dark:text-red-100";
      case "warning":
        return "border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-100";
      case "info":
        return "border-blue-500/50 bg-blue-500/10 text-blue-900 dark:text-blue-100";
      case "success":
        return "border-green-500/50 bg-green-500/10 text-green-900 dark:text-green-100";
      default:
        return "";
    }
  };

  // Combine API alerts with dynamic alerts
  const dynamicAlerts = generateDynamicAlerts();
  const convertedApiAlerts = convertApiAlerts();
  const allAlerts = [...convertedApiAlerts, ...dynamicAlerts];

  // If no alerts and not loading, show a default good message
  if (!isLoading && allAlerts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Active Alerts</h3>
          <span className="text-sm text-muted-foreground">0 active</span>
        </div>
        
        <Alert className="glass-effect shadow-md border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="font-semibold text-green-900 dark:text-green-100">
            No Active Alerts
          </AlertTitle>
          <AlertDescription className="text-sm text-green-800 dark:text-green-200">
            Air quality is within acceptable levels. Continue to monitor conditions throughout the day.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Active Alerts</h3>
        <span className="text-sm text-muted-foreground">
          {isLoading ? "Loading..." : `${allAlerts.length} active`}
        </span>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          <Alert className="glass-effect shadow-md">
            <Info className="h-5 w-5" />
            <AlertTitle className="font-semibold">Loading Alerts...</AlertTitle>
            <AlertDescription className="text-sm">
              Fetching air quality alerts for your location.
            </AlertDescription>
          </Alert>
        ) : (
          allAlerts.map((alert, idx) => (
            <Alert key={idx} className={`glass-effect shadow-md ${getAlertStyles(alert.type)}`}>
              <alert.icon className="h-5 w-5" />
              <AlertTitle className="font-semibold">{alert.title}</AlertTitle>
              <AlertDescription className="text-sm">
                {alert.description}
                {alert.timestamp && (
                  <span className="block mt-1 text-xs opacity-75">
                    {alert.timestamp}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertPanel;