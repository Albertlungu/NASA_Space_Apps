import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

const AlertPanel = () => {
  // Mock alerts - will be replaced with real alert system
  const alerts = [
    {
      type: "warning",
      title: "Air Quality Alert",
      description: "Moderate air quality expected in your area between 2-5 PM. Consider limiting outdoor activities.",
      icon: AlertTriangle,
    },
    {
      type: "info",
      title: "Forecast Update",
      description: "Conditions improving tomorrow. Good air quality expected throughout the day.",
      icon: Info,
    },
  ];

  const getAlertStyles = (type: string) => {
    switch (type) {
      case "warning":
        return "border-warning/50 bg-warning/5 text-warning-foreground";
      case "info":
        return "border-primary/50 bg-primary/5 text-foreground";
      case "success":
        return "border-secondary/50 bg-secondary/5 text-foreground";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Active Alerts</h3>
        <span className="text-sm text-muted-foreground">{alerts.length} active</span>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert, idx) => (
          <Alert key={idx} className={`glass-effect shadow-md ${getAlertStyles(alert.type)}`}>
            <alert.icon className="h-5 w-5" />
            <AlertTitle className="font-semibold">{alert.title}</AlertTitle>
            <AlertDescription className="text-sm">
              {alert.description}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
};

export default AlertPanel;
