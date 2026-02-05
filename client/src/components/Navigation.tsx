import { Link, useLocation } from "wouter";
import { Home, Calendar, Users, Hand, Clock, Play, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/journey", icon: MapPin, label: "Journey" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/community", icon: Users, label: "Community" },
  { href: "/seva", icon: Hand, label: "Seva" },
  { href: "/play", icon: Play, label: "Play" },
  { href: "/legacy", icon: Clock, label: "Legacy" },
];

export function Navigation() {
  const [location] = useLocation();

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.slice(0, 6).map(({ href, icon: Icon, label }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href} className="w-full">
                <div className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-xl transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Top Navigation */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl font-bold text-foreground">
            Bhaktiras
          </Link>
          <div className="flex space-x-1">
            {navItems.map(({ href, label }) => {
              const isActive = location === href;
              return (
                <Link key={href} href={href}>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-primary/10 text-primary font-bold" 
                      : "text-muted-foreground hover:bg-golden-50 hover:text-foreground"
                  }`}>
                    {label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Spacer for content */}
      <div className="md:h-16" />
    </>
  );
}
