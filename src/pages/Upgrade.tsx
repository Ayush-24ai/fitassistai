import { motion, AnimatePresence } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Crown, 
  Check, 
  Shield,
  Sparkles,
  ArrowLeft,
  Loader2,
  PartyPopper
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProStatus } from "@/hooks/useProStatus";
import { useToast } from "@/hooks/use-toast";
import confetti from 'canvas-confetti';

const proFeatures = [
  "Unlimited access to all features",
  "Personal AI Fitness Agent",
  "Calorie tracking & analysis",
  "BMI & body composition analysis",
  "Personalized diet plans",
  "Custom workout recommendations",
  "Health & fitness history",
  "Priority support",
];

export default function Upgrade() {
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { isPro, activatePro, loading: proLoading, refreshProStatus } = useProStatus();
  const navigate = useNavigate();
  const { toast } = useToast();

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upgrade to Pro.",
        variant: "destructive",
      });
      navigate("/signin");
      return;
    }

    if (!agreeToTerms) {
      toast({
        title: "Agreement required",
        description: "Please agree to the Terms of Service and Privacy Policy.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const success = await activatePro();
    
    if (success) {
      setShowSuccess(true);
      triggerConfetti();
      
      // Refresh Pro status to ensure UI updates
      await refreshProStatus();
      
      toast({
        title: "Welcome to Pro! 🎉",
        description: "You now have unlimited access for 30 days.",
      });
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } else {
      toast({
        title: "Activation failed",
        description: "Please try again later.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Loading state
  if (authLoading || proLoading) {
    return (
      <PageLayout showMobileNav={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Success animation
  if (showSuccess) {
    return (
      <PageLayout showMobileNav={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 rounded-3xl pro-gradient flex items-center justify-center mx-auto mb-6 shadow-2xl"
            >
              <PartyPopper className="w-12 h-12 text-primary-foreground" />
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-foreground mb-2"
            >
              Welcome to Pro!
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground"
            >
              Redirecting to dashboard...
            </motion.p>
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  // If already Pro, show status
  if (isPro) {
    return (
      <PageLayout showMobileNav={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            <Card className="border-2 border-primary shadow-xl">
              <CardHeader className="text-center pb-2">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 rounded-2xl pro-gradient flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <Crown className="w-8 h-8 text-primary-foreground" />
                </motion.div>
                <CardTitle className="text-2xl text-foreground">You're Already Pro!</CardTitle>
                <CardDescription>
                  Enjoy unlimited access to all features
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Thank you for being a Pro member. You have full access to all features for 30 days.
                </p>
                <Link to="/dashboard">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="hero" size="lg">
                      Go to Dashboard
                    </Button>
                  </motion.div>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showMobileNav={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <Card className="border-2 border-primary shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <CardHeader className="text-center pb-2 relative">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 rounded-2xl pro-gradient flex items-center justify-center mx-auto mb-4 shadow-lg pro-glow"
              >
                <Crown className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              <CardTitle className="text-2xl text-foreground">Upgrade to Pro</CardTitle>
              <CardDescription>
                Unlock your full health & fitness potential
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl text-muted-foreground line-through mr-2">$3</span>
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="text-5xl font-bold text-foreground"
                  >
                    $0
                  </motion.span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-3 py-1 mt-2 rounded-full bg-health-success/10 text-health-success text-sm font-medium"
                >
                  🎉 FREE for early users – Limited time!
                </motion.span>
                <p className="text-sm text-muted-foreground mt-2">
                  No credit card required • 30 days access
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {proFeatures.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-health-success/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-health-success" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-2 mb-6 p-4 rounded-lg bg-secondary/50 border border-border/50">
                <Checkbox
                  id="agree"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="agree" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  , including the subscription billing terms.
                </Label>
              </div>

              {/* CTA */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="pro"
                  size="xl"
                  className="w-full pro-glow"
                  onClick={handleUpgrade}
                  disabled={isProcessing || !agreeToTerms}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Activating Pro...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Activate Pro – Free!
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                Secure & instant activation
              </div>

              {/* Back Link */}
              <Link
                to="/"
                className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
