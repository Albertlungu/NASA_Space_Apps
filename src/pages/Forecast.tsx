import Navigation from "@/components/Navigation";
import ForecastView from "@/components/ForecastView";

const ForecastPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container px-4 md:px-6 py-8">
        <ForecastView />
      </div>
    </div>
  );
};

export default ForecastPage;
