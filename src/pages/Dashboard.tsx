import { useEffect } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Activity, 
  FileText, 
  Brain,
  Camera,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProStatus } from "@/hooks/useProStatus";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ProStatusCard } from "@/components/dashboard/ProStatusCard";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { AnalysisHistoryCard } from "@/components/dashboard/AnalysisHistoryCard";

const quickActions = [
  {
    icon: Activity,
    title: "Symptom Checker",
    description: "Analyze your symptoms",
    href: "/symptom-checker",
    color: "text-health-teal",
    bgColor: "bg-health-teal/10",
  },
  {
    icon: FileText,
    title: "Health Reports",
    description: "Analyze lab results",
    href: "/health-reports",
    color: "text-health-blue",
    bgColor: "bg-health-blue/10",
  },
  {
    icon: Camera,
    title: "Food Scanner",
    description: "Scan food for calories",
    href: "/food-scanner",
    color: "text-health-emerald",
    bgColor: "bg-health-emerald/10",
  },
  {
    icon: Brain,
    title: "AI Fitness Agent",
    description: "Get personalized plans",
    href: "/fitness-agent",
    color: "text-primary",
    bgColor: "bg-primary/10",
    pro: true,
  },
];

export default function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const { isPro } = useProStatus();
  const { history, loading: historyLoading, deleteAnalysis, getStats } = useAnalysisHistory();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/signin");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: "An error occurred while signing out.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate("/");
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    const success = await deleteAnalysis(id);
    if (success) {
      toast({
        title: "Deleted",
        description: "Analysis removed from history.",
      });
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-pulse text-foreground">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Please Sign In</h1>
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

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || "User";
  const stats = getStats();

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {displayName}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Pro Status */}
          <ProStatusCard />

          {/* Stats Grid */}
          <StatsGrid stats={stats} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Link key={action.href} to={action.href}>
                    <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center`}>
                            <action.icon className={`w-6 h-6 ${action.color}`} />
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

            {/* Analysis History */}
            <AnalysisHistoryCard 
              history={history} 
              onDelete={handleDeleteAnalysis}
              loading={historyLoading}
            />
          </div>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Settings className="w-5 h-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Display Name</p>
                  <p className="text-sm text-muted-foreground">{displayName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Subscription</p>
                  <p className="text-sm text-muted-foreground">
                    {isPro ? "Pro Plan - Active" : "Free Plan"}
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
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
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
