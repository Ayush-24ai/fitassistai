import { Link, useLocation } from "react-router-dom";
import { Home, Activity, FileText, User, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/symptom-checker", icon: Activity, label: "Symptoms" },
  { href: "/health-reports", icon: FileText, label: "Reports" },
  { href: "/fitness-agent", icon: Crown, label: "AI Agent" },
  { href: "/dashboard", icon: User, label: "Profile" },
];

export function MobileNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          // Hide dashboard if not authenticated
          if (item.href === "/dashboard" && !isAuthenticated) {
            return (
              <Link
                key="/signin"
                to="/signin"
                className="flex flex-col items-center justify-center gap-1 flex-1 py-2"
              >
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Sign In
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className={cn(
                "text-xs",
                isActive ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
