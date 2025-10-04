import Navigation from "@/components/Navigation";
import MapView from "@/components/MapView";

const MapPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container px-4 md:px-6 py-8">
        <MapView />
      </div>
    </div>
  );
};

export default MapPage;
