import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Target, Image, CheckSquare, Info, Bookmark } from "lucide-react";
import { AuthButton } from "./AuthButton";

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/results", label: "Results", icon: Target },
    { path: "/prompt", label: "AI Prompt", icon: Image },
    { path: "/journey", label: "Journey", icon: CheckSquare },
    { path: "/saved-plans", label: "My Plans", icon: Bookmark },
    { path: "/about", label: "About", icon: Info },
  ];

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🏠</span>
            <span className="text-xl font-bold text-primary">BuildMyDream</span>
          </Link>
          
          <div className="hidden md:flex space-x-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button
                  variant={location.pathname === path ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Button>
              </Link>
            ))}
          </div>

          <div className="md:hidden flex space-x-1">
            {navItems.map(({ path, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button
                  variant={location.pathname === path ? "default" : "ghost"}
                  size="sm"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </Link>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;