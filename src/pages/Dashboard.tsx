import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Crown, 
  Activity, 
  FileText, 
  Brain,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Link, useNavigate } from "react-router-dom";

const quickActions = [
  {
    icon: Activity,
    title: "Symptom Checker",
    description: "Analyze your symptoms",
    href: "/symptom-checker",
    color: "health-teal",
  },
  {
    icon: FileText,
    title: "Health Reports",
    description: "Analyze lab results",
    href: "/health-reports",
    color: "health-blue",
  },
  {
    icon: Brain,
    title: "AI Fitness Agent",
    description: "Get personalized plans",
    href: "/fitness-agent",
    color: "health-emerald",
    pro: true,
  },
];

export default function Dashboard() {
  const { isAuthenticated, isPro, user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-6">
            You need to sign in to access your dashboard.
          </p>
          <Link to="/signin">
            <Button variant="hero">Sign In</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Welcome, {user?.name || "User"}
                </h1>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            {isPro ? (
              <div className="px-4 py-2 rounded-full pro-gradient text-primary-foreground flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Pro Member
              </div>
            ) : (
              <Link to="/upgrade">
                <Button variant="pro">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.href} to={action.href}>
                  <Card className="hover:shadow-health-md hover:border-primary/30 transition-all cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-${action.color}/10 flex items-center justify-center`}>
                          <action.icon className={`w-6 h-6 text-${action.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{action.title}</h3>
                            {action.pro && (
                              <span className="px-2 py-0.5 rounded-full pro-gradient text-[10px] font-medium text-primary-foreground">
                                PRO
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Subscription</p>
                  <p className="text-sm text-muted-foreground">
                    {isPro ? "Pro Plan - $3/month" : "Free Plan"}
                  </p>
                </div>
                {!isPro && (
                  <Link to="/upgrade">
                    <Button variant="pro" size="sm">Upgrade</Button>
                  </Link>
                )}
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-foreground">Sign Out</p>
                  <p className="text-sm text-muted-foreground">Sign out of your account</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
