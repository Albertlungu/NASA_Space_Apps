import Navigation from "@/components/Navigation";
import PredictionsView from "@/components/PredictionsView";

const ForecastPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container px-4 md:px-6 py-8">
        <PredictionsView />
      </div>
    </div>
  );
};

export default ForecastPage;
