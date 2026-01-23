import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useProStatus } from "@/hooks/useProStatus";
import { format } from "date-fns";

export function ProStatusCard() {
  const { isPro, getProExpiration } = useProStatus();
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  useEffect(() => {
    if (isPro) {
      getProExpiration().then(setExpirationDate);
    }
  }, [isPro, getProExpiration]);

  if (isPro) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl pro-gradient flex items-center justify-center">
                <Crown className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-foreground">Pro Member</h3>
                  <span className="px-2 py-0.5 rounded-full pro-gradient text-[10px] font-medium text-primary-foreground">
                    ACTIVE
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Unlimited access to all features
                </p>
                {expirationDate && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Expires {format(expirationDate, 'MMM d, yyyy')}</span>
                  </div>
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
      <Card className="border-dashed border-2 border-muted-foreground/20">
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
              <Button variant="pro" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
