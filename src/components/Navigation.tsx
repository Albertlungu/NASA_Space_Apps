import { Button } from "@/components/ui/button";
import { Wind, Menu, Bell, User } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      isActive(path) ? "text-primary" : "hover:text-primary"
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full glass-effect border-b shadow-sm">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-md">
              <Wind className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              AirWatch
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className={navLinkClass("/dashboard")}>
              Dashboard
            </Link>
            <Link to="/forecast" className={navLinkClass("/forecast")}>
              Forecast
            </Link>
            <Link to="/map" className={navLinkClass("/map")}>
              Map
            </Link>
            <Link to="/analytics" className={navLinkClass("/analytics")}>
              Analytics
            </Link>
            <Link to="/health" className={navLinkClass("/health")}>
              Health
            </Link>
            <Link to="/education" className={navLinkClass("/education")}>
              Learn
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-warning rounded-full" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t">
            <Link
              to="/dashboard"
              className={`block py-2 ${navLinkClass("/dashboard")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/forecast"
              className={`block py-2 ${navLinkClass("/forecast")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Forecast
            </Link>
            <Link
              to="/map"
              className={`block py-2 ${navLinkClass("/map")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Map
            </Link>
            <Link
              to="/analytics"
              className={`block py-2 ${navLinkClass("/analytics")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Analytics
            </Link>
            <Link
              to="/health"
              className={`block py-2 ${navLinkClass("/health")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Health
            </Link>
            <Link
              to="/education"
              className={`block py-2 ${navLinkClass("/education")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Learn
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
