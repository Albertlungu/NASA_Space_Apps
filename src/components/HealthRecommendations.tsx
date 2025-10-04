import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Activity, 
  Users, 
  Baby, 
  Wind, 
  Home,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface Recommendation {
  icon: React.ElementType;
  title: string;
  description: string;
  level: "safe" | "caution" | "warning";
  audience: string[];
}

const HealthRecommendations = ({ aqi = 45 }: { aqi?: number }) => {
  const getRecommendations = (aqiValue: number): Recommendation[] => {
    if (aqiValue <= 50) {
      return [
        {
          icon: Activity,
          title: "Safe for All Activities",
          description: "Air quality is excellent. Perfect for outdoor exercise and activities.",
          level: "safe",
          audience: ["Everyone"],
        },
        {
          icon: Users,
          title: "Great Day for Outdoor Events",
          description: "Schools and organizations can proceed with all outdoor activities.",
          level: "safe",
          audience: ["Schools", "Communities"],
        },
      ];
    } else if (aqiValue <= 100) {
      return [
        {
          icon: Heart,
          title: "Generally Acceptable",
          description: "Air quality is acceptable for most people. Unusually sensitive individuals should consider reducing prolonged outdoor exertion.",
          level: "caution",
          audience: ["Sensitive Groups"],
        },
        {
          icon: Activity,
          title: "Monitor Sensitive Individuals",
          description: "People with respiratory conditions should be aware of symptoms.",
          level: "caution",
          audience: ["Health-Sensitive Groups"],
        },
        {
          icon: Wind,
          title: "Consider Indoor Activities",
          description: "Peak hours may affect those with asthma or heart disease.",
          level: "caution",
          audience: ["Eldercare Facilities"],
        },
      ];
    } else {
      return [
        {
          icon: AlertCircle,
          title: "Limit Outdoor Exposure",
          description: "Everyone should reduce prolonged outdoor exertion. Keep outdoor activities short.",
          level: "warning",
          audience: ["Everyone"],
        },
        {
          icon: Baby,
          title: "Protect Vulnerable Groups",
          description: "Children, elderly, and people with respiratory conditions should avoid outdoor activities.",
          level: "warning",
          audience: ["Schools", "Eldercare", "Parents"],
        },
        {
          icon: Home,
          title: "Stay Indoors When Possible",
          description: "Close windows and doors. Use air purifiers if available. Consider postponing outdoor events.",
          level: "warning",
          audience: ["Everyone"],
        },
        {
          icon: Wind,
          title: "Wear N95 Masks Outdoors",
          description: "If you must go outside, wear a properly fitted N95 or KN95 mask.",
          level: "warning",
          audience: ["Everyone"],
        },
      ];
    }
  };

  const recommendations = getRecommendations(aqi);

  const getLevelStyles = (level: string) => {
    switch (level) {
      case "safe":
        return "border-[hsl(var(--aqi-good))]/50 bg-[hsl(var(--aqi-good))]/5";
      case "caution":
        return "border-[hsl(var(--aqi-moderate))]/50 bg-[hsl(var(--aqi-moderate))]/5";
      case "warning":
        return "border-[hsl(var(--aqi-unhealthy))]/50 bg-[hsl(var(--aqi-unhealthy))]/5";
      default:
        return "";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "safe":
        return <CheckCircle className="w-5 h-5 text-[hsl(var(--aqi-good))]" />;
      case "caution":
        return <AlertCircle className="w-5 h-5 text-[hsl(var(--aqi-moderate))]" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-[hsl(var(--aqi-unhealthy))]" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-2xl font-bold">Health Recommendations</h3>
          <p className="text-sm text-muted-foreground">
            Personalized guidance for current air quality (AQI: {aqi})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, idx) => (
          <Card
            key={idx}
            className={`p-6 glass-effect shadow-md hover:shadow-lg transition-all ${getLevelStyles(rec.level)}`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-full bg-background/50">
                <rec.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getLevelIcon(rec.level)}
                  <h4 className="font-semibold">{rec.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {rec.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {rec.audience.map((group, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Stakeholder-specific guidance */}
      <Card className="p-6 glass-effect shadow-md">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Stakeholder-Specific Guidance
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="font-medium mb-1">🏫 Schools & Athletics</div>
            <p className="text-muted-foreground">
              {aqi <= 50
                ? "All outdoor activities approved"
                : aqi <= 100
                ? "Monitor student athletes during practice"
                : "Move activities indoors or postpone"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="font-medium mb-1">🏛️ Policy Makers</div>
            <p className="text-muted-foreground">
              {aqi <= 50
                ? "Continue standard operations"
                : aqi <= 100
                ? "Consider advisory for sensitive groups"
                : "Issue air quality alert, advise traffic reduction"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="font-medium mb-1">🚒 Emergency Response</div>
            <p className="text-muted-foreground">
              {aqi <= 50
                ? "Standard protocols"
                : aqi <= 100
                ? "Alert respiratory teams"
                : "Prepare for increased emergency calls"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HealthRecommendations;
