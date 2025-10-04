import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Calendar, TrendingDown, TrendingUp } from "lucide-react";
import { useUserExposure } from "@/hooks/useAirQuality";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAirQuality } from "@/hooks/useAirQuality";

const ExposureTracker = () => {
  const { location } = useGeolocation();
  const userId = 1; // Demo user - in production, get from auth context
  const { data: exposureData } = useUserExposure(userId, 30); // Get 30 days for monthly trend
  const { data: currentAQ } = useAirQuality(location?.lat, location?.lon, 'pm25');

  // Calculate real exposure metrics
  const dailyData = exposureData?.daily_data || [];
  const today = dailyData[0] || { total_exposure: 0, duration_minutes: 0 };
  
  // Today's exposure as percentage of safe limit (WHO guideline: 15 µg/m³ for 24h)
  const safeLimit = 15 * 24 * 60; // 15 µg/m³ * 24 hours * 60 minutes
  const dailyExposure = Math.min((today.total_exposure / safeLimit) * 100, 100);
  
  // 7-day average
  const last7Days = dailyData.slice(0, 7);
  const weeklyAverage = last7Days.length > 0
    ? (last7Days.reduce((sum, day) => sum + day.total_exposure, 0) / last7Days.length / safeLimit) * 100
    : 0;
  
  // Monthly trend (compare first 15 days vs last 15 days)
  const firstHalf = dailyData.slice(0, 15);
  const secondHalf = dailyData.slice(15, 30);
  const firstHalfAvg = firstHalf.length > 0
    ? firstHalf.reduce((sum, day) => sum + day.total_exposure, 0) / firstHalf.length
    : 0;
  const secondHalfAvg = secondHalf.length > 0
    ? secondHalf.reduce((sum, day) => sum + day.total_exposure, 0) / secondHalf.length
    : 0;
  const monthlyTrend = secondHalfAvg > 0
    ? ((firstHalfAvg - secondHalfAvg) / secondHalfAvg) * 100
    : 0;

  // Get current AQI for recommendations
  const currentAQI = currentAQ?.results?.[0]?.aqi || 0;
  
  // Generate personalized recommendations based on real data
  const getRecommendations = () => {
    const recommendations = [];
    
    if (dailyExposure > 80) {
      recommendations.push("⚠️ Your exposure is high today. Consider staying indoors and using air purifiers.");
    } else if (dailyExposure > 50) {
      recommendations.push("Your exposure is moderate. Limit outdoor activities during peak hours.");
    } else {
      recommendations.push("✓ Your exposure is within safe limits. Continue monitoring throughout the day.");
    }
    
    if (currentAQI > 150) {
      recommendations.push("🚨 Current AQI is unhealthy. Avoid outdoor exercise and close windows.");
    } else if (currentAQI > 100) {
      recommendations.push("⚠️ Sensitive groups should reduce prolonged outdoor exertion.");
    } else if (currentAQI <= 50) {
      recommendations.push("✓ Air quality is good. Great time for outdoor activities!");
    }
    
    if (weeklyAverage > 70) {
      recommendations.push("📊 Your weekly average is elevated. Consider adjusting your routine to reduce exposure.");
    }
    
    if (monthlyTrend > 0) {
      recommendations.push(`📈 Good news! Your exposure has decreased by ${Math.abs(monthlyTrend).toFixed(1)}% this month.`);
    } else if (monthlyTrend < -10) {
      recommendations.push(`📉 Your exposure has increased by ${Math.abs(monthlyTrend).toFixed(1)}% this month. Review your activities.`);
    }
    
    // Time-based recommendations
    const hour = new Date().getHours();
    if (hour >= 14 && hour <= 17 && currentAQI > 100) {
      recommendations.push("🕐 Peak pollution hours (2-5 PM). Consider indoor activities.");
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Your Exposure Tracker</h3>
        <p className="text-muted-foreground">Monitor your cumulative pollution exposure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Exposure */}
        <Card className="p-6 glass-effect shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Today's Exposure</div>
              <div className="text-2xl font-bold">{dailyExposure}%</div>
            </div>
          </div>
          <Progress value={dailyExposure} className="h-2" />
          <div className="text-xs text-muted-foreground mt-2">
            of recommended daily limit
          </div>
        </Card>

        {/* Weekly Average */}
        <Card className="p-6 glass-effect shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-secondary/10">
              <Calendar className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">7-Day Average</div>
              <div className="text-2xl font-bold">{weeklyAverage}%</div>
            </div>
          </div>
          <Progress value={weeklyAverage} className="h-2" />
          <div className="text-xs text-muted-foreground mt-2">
            weekly exposure average
          </div>
        </Card>

        {/* Monthly Trend */}
        <Card className="p-6 glass-effect shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-full ${monthlyTrend >= 0 ? 'bg-[hsl(var(--aqi-good))]/10' : 'bg-[hsl(var(--aqi-unhealthy))]/10'}`}>
              {monthlyTrend >= 0 ? (
                <TrendingDown className="w-5 h-5 text-[hsl(var(--aqi-good))]" />
              ) : (
                <TrendingUp className="w-5 h-5 text-[hsl(var(--aqi-unhealthy))]" />
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Monthly Trend</div>
              <div className={`text-2xl font-bold ${monthlyTrend >= 0 ? 'text-[hsl(var(--aqi-good))]' : 'text-[hsl(var(--aqi-unhealthy))]'}`}>
                {monthlyTrend >= 0 ? '-' : '+'}{Math.abs(monthlyTrend).toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {monthlyTrend >= 0 ? 'Improvement' : 'Increase'} from last month
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-6 glass-effect shadow-md">
        <h4 className="font-semibold mb-3">Personalized Recommendations</h4>
        <div className="space-y-2 text-sm">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
              <p>{rec}</p>
            </div>
          ))}
          {recommendations.length === 0 && (
            <p className="text-muted-foreground">Loading personalized recommendations...</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ExposureTracker;
