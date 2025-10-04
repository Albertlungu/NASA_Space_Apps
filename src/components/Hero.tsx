import { Button } from "@/components/ui/button";
import { ArrowRight, Wind, AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 animate-gradient" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/20 animate-pulse"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect shadow-md">
            <Wind className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Real-time Air Quality Monitoring</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl max-w-4xl font-extrabold">
            Breathe Easy with{" "}
            <span className="bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent animate-gradient">
              AirWatch
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Advanced air quality forecasting powered by NASA TEMPO satellite data.
            Get real-time alerts, track your exposure, and make informed decisions for your health.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/dashboard">
              <Button size="lg" className="group shadow-lg hover:shadow-glow transition-all">
                View Dashboard
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/education">
              <Button size="lg" variant="outline" className="shadow-md">
                Learn More
              </Button>
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 w-full max-w-4xl">
            <div className="glass-effect rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
              <AlertTriangle className="w-8 h-8 text-warning mb-3" />
              <h3 className="font-semibold text-lg mb-2">Smart Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Proactive notifications when air quality affects your health
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
              <TrendingUp className="w-8 h-8 text-secondary mb-3" />
              <h3 className="font-semibold text-lg mb-2">Exposure Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your cumulative pollution exposure like a fitness tracker
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
              <Wind className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2">Predictive Insights</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered forecasts combining satellite and ground data
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
