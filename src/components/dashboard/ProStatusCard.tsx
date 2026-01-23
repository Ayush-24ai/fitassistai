import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Calendar, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useProStatus } from "@/hooks/useProStatus";
import { format } from "date-fns";

export function ProStatusCard() {
  const { isPro, expirationDate, loading } = useProStatus();

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-14 h-14 rounded-2xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (isPro) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-14 h-14 rounded-2xl pro-gradient flex items-center justify-center shadow-lg"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Crown className="w-7 h-7 text-primary-foreground" />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-foreground">Pro Member</h3>
                  <motion.span 
                    className="px-2 py-0.5 rounded-full pro-gradient text-[10px] font-medium text-primary-foreground flex items-center gap-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <CheckCircle className="w-3 h-3" />
                    ACTIVE
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Unlimited access to all features
                </p>
                {expirationDate && (
                  <motion.div 
                    className="flex items-center gap-1 mt-2 text-xs text-muted-foreground"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Expires {format(expirationDate, 'MMM d, yyyy')}</span>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="border-dashed border-2 border-muted-foreground/20 hover:border-primary/30 transition-colors">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Crown className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">Free Plan</h3>
              <p className="text-sm text-muted-foreground">
                Limited features • Upgrade for full access
              </p>
            </div>
            <Link to="/upgrade">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="pro" size="sm" className="pro-glow">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </motion.div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
