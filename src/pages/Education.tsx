import Navigation from "@/components/Navigation";
import EducationalPanel from "@/components/EducationalPanel";

const EducationPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container px-4 md:px-6 py-8">
        <EducationalPanel />
      </div>
    </div>
  );
};

export default EducationPage;
