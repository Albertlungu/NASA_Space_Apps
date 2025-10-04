import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calendar, TrendingUp, BarChart3 } from "lucide-react";

const HistoricalDataExplorer = () => {
  // Mock historical data - will be replaced with real TEMPO data
  const dailyData = [
    { date: "Mon", pm25: 12, pm10: 28, no2: 18, o3: 45, aqi: 45 },
    { date: "Tue", pm25: 15, pm10: 32, no2: 22, o3: 52, aqi: 52 },
    { date: "Wed", pm25: 18, pm10: 38, no2: 25, o3: 58, aqi: 58 },
    { date: "Thu", pm25: 22, pm10: 45, no2: 30, o3: 68, aqi: 68 },
    { date: "Fri", pm25: 16, pm10: 35, no2: 20, o3: 48, aqi: 48 },
    { date: "Sat", pm25: 10, pm10: 25, no2: 15, o3: 38, aqi: 38 },
    { date: "Sun", pm25: 14, pm10: 30, no2: 19, o3: 42, aqi: 42 },
  ];

  const monthlyData = [
    { month: "Jan", avgAqi: 45, maxAqi: 85, minAqi: 25 },
    { month: "Feb", avgAqi: 42, maxAqi: 78, minAqi: 22 },
    { month: "Mar", avgAqi: 48, maxAqi: 92, minAqi: 28 },
    { month: "Apr", avgAqi: 52, maxAqi: 95, minAqi: 32 },
    { month: "May", avgAqi: 58, maxAqi: 105, minAqi: 35 },
    { month: "Jun", avgAqi: 65, maxAqi: 125, minAqi: 42 },
  ];

  const eventData = [
    { event: "Wildfire\nJuly 15", impact: 185, duration: 3 },
    { event: "Holiday\nTraffic", impact: 95, duration: 2 },
    { event: "Industrial\nAccident", impact: 142, duration: 1 },
    { event: "Weather\nInversion", impact: 118, duration: 4 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-2xl font-bold">Historical Data Explorer</h3>
          <p className="text-sm text-muted-foreground">
            Analyze past trends and identify seasonal patterns
          </p>
        </div>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="weekly">7-Day Trends</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Patterns</TabsTrigger>
          <TabsTrigger value="events">Event Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-6">
          <Card className="p-6 glass-effect shadow-md">
            <div className="mb-4">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                7-Day AQI Trend
              </h4>
              <p className="text-sm text-muted-foreground">
                Daily air quality index over the past week
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="aqi" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorAqi)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 glass-effect shadow-md">
            <div className="mb-4">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Pollutant Breakdown
              </h4>
              <p className="text-sm text-muted-foreground">
                Individual pollutant levels throughout the week
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="pm25" stroke="hsl(var(--aqi-good))" name="PM2.5" strokeWidth={2} />
                <Line type="monotone" dataKey="pm10" stroke="hsl(var(--aqi-moderate))" name="PM10" strokeWidth={2} />
                <Line type="monotone" dataKey="no2" stroke="hsl(var(--aqi-sensitive))" name="NO₂" strokeWidth={2} />
                <Line type="monotone" dataKey="o3" stroke="hsl(var(--aqi-unhealthy))" name="O₃" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card className="p-6 glass-effect shadow-md">
            <div className="mb-4">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                6-Month Overview
              </h4>
              <p className="text-sm text-muted-foreground">
                Seasonal patterns and monthly averages
              </p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Legend />
                <Bar dataKey="maxAqi" fill="hsl(var(--aqi-unhealthy))" name="Max AQI" />
                <Bar dataKey="avgAqi" fill="hsl(var(--primary))" name="Avg AQI" />
                <Bar dataKey="minAqi" fill="hsl(var(--aqi-good))" name="Min AQI" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <strong>Seasonal Insight:</strong> Air quality typically worsens in summer months 
                (May-June) due to increased ozone formation and wildfire activity. Winter months 
                show improvement with increased precipitation and lower temperatures.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card className="p-6 glass-effect shadow-md">
            <div className="mb-4">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Major Events Impact
              </h4>
              <p className="text-sm text-muted-foreground">
                How significant events affected air quality
              </p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={eventData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" />
                <YAxis dataKey="event" type="category" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Bar dataKey="impact" fill="hsl(var(--aqi-unhealthy))" name="Peak AQI" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {eventData.map((event, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/50 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{event.event.replace("\n", " ")}</span>
                    <span className="text-muted-foreground">
                      Duration: {event.duration} day{event.duration > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoricalDataExplorer;
