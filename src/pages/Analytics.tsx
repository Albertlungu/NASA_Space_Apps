import Navigation from "@/components/Navigation";
import HistoricalDataExplorer from "@/components/HistoricalDataExplorer";
import WeatherCorrelation from "@/components/WeatherCorrelation";

const AnalyticsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container px-4 md:px-6 py-8 space-y-16">
        <HistoricalDataExplorer />
        <WeatherCorrelation />
      </div>
    </div>
  );
};

export default AnalyticsPage;
