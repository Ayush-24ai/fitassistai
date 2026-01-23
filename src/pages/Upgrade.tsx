import { motion } from "framer-motion";
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
  ArrowLeft
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProStatus } from "@/hooks/useProStatus";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const { isPro, activatePro } = useProStatus();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      toast({
        title: "Welcome to Pro! 🎉",
        description: "You now have unlimited access for 1 month.",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Activation failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
  };

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
            <Card className="border-2 border-primary">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-2xl pro-gradient flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl text-foreground">You're Already Pro!</CardTitle>
                <CardDescription>
                  Enjoy unlimited access to all features
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Thank you for being a Pro member. You have full access to all features.
                </p>
                <Link to="/dashboard">
                  <Button variant="hero" size="lg">
                    Go to Dashboard
                  </Button>
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
          <Card className="border-2 border-primary shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-2xl pro-gradient flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl text-foreground">Upgrade to Pro</CardTitle>
              <CardDescription>
                Unlock your full health & fitness potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl text-muted-foreground line-through mr-2">$3</span>
                  <span className="text-5xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <span className="inline-block px-3 py-1 mt-2 rounded-full bg-health-success/10 text-health-success text-sm font-medium">
                  🎉 FREE for early users – Limited time!
                </span>
                <p className="text-sm text-muted-foreground mt-2">
                  No credit card required
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {proFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-health-success/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-health-success" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-2 mb-6 p-4 rounded-lg bg-secondary">
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
              <Button
                variant="pro"
                size="xl"
                className="w-full"
                onClick={handleUpgrade}
                disabled={isProcessing || !agreeToTerms}
              >
                {isProcessing ? (
                  <>Activating Pro...</>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Activate Pro – Free!
                  </>
                )}
              </Button>

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
