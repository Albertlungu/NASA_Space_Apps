import Navigation from "@/components/Navigation";
import HealthRecommendations from "@/components/HealthRecommendations";

const HealthPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container px-4 md:px-6 py-8">
        <HealthRecommendations aqi={45} />
      </div>
    </div>
  );
};

export default HealthPage;
