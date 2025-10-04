import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Calendar, TrendingDown } from "lucide-react";

const ExposureTracker = () => {
  // Mock data - will be replaced with real tracking data
  const dailyExposure = 72; // percentage of safe limit
  const weeklyAverage = 65;
  const monthlyTrend = -8; // percentage change

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
            <div className="p-3 rounded-full bg-[hsl(var(--aqi-good))]/10">
              <TrendingDown className="w-5 h-5 text-[hsl(var(--aqi-good))]" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Monthly Trend</div>
              <div className="text-2xl font-bold text-[hsl(var(--aqi-good))]">
                {monthlyTrend}%
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Improvement from last month
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-6 glass-effect shadow-md">
        <h4 className="font-semibold mb-3">Personalized Recommendations</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary mt-1.5" />
            <p>Your exposure is within safe limits. Keep monitoring throughout the day.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary mt-1.5" />
            <p>Consider indoor activities during peak afternoon hours (2-5 PM).</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary mt-1.5" />
            <p>Air quality is expected to improve tomorrow morning.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExposureTracker;
