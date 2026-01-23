import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type TokenStatus = "loading" | "valid" | "invalid" | "expired";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check for hash-based auth (Supabase sends tokens in URL hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");
      const errorDescription = hashParams.get("error_description");
      
      // Also check for error in query params
      const errorParam = searchParams.get("error_description");
      
      if (errorDescription || errorParam) {
        const errorMsg = errorDescription || errorParam;
        if (errorMsg?.includes("expired")) {
          setTokenStatus("expired");
        } else {
          setTokenStatus("invalid");
        }
        return;
      }

      // If we have tokens in hash, set the session
      if (accessToken && refreshToken && type === "recovery") {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Error setting session:", error);
          if (error.message.includes("expired")) {
            setTokenStatus("expired");
          } else {
            setTokenStatus("invalid");
          }
          return;
        }
        
        setTokenStatus("valid");
        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      // Check for existing valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setTokenStatus("valid");
      } else {
        setTokenStatus("invalid");
      }
    };

    handleAuthCallback();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate passwords
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "password") fieldErrors.password = err.message;
        if (err.path[0] === "confirmPassword") fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Sign out after password reset to force fresh login
    await supabase.auth.signOut();
    
    setIsSuccess(true);
    toast({
      title: "Password updated!",
      description: "Your password has been successfully reset. Please sign in.",
    });
    
    // Redirect to sign in after 2 seconds
    setTimeout(() => {
      navigate("/signin");
    }, 2000);
    
    setIsLoading(false);
  };

  const renderContent = () => {
    if (tokenStatus === "loading") {
      return (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <p className="text-foreground">Validating reset link...</p>
        </div>
      );
    }

    if (tokenStatus === "expired") {
      return (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-health-warning/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-health-warning" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Link Expired</h2>
            <p className="text-muted-foreground">
              This password reset link has expired. Please request a new one.
            </p>
          </div>
          <Link to="/forgot-password">
            <Button variant="hero" size="lg" className="w-full">
              Request New Link
            </Button>
          </Link>
        </div>
      );
    }

    if (tokenStatus === "invalid") {
      return (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Invalid Link</h2>
            <p className="text-muted-foreground">
              This password reset link is invalid or has already been used.
            </p>
          </div>
          <Link to="/forgot-password">
            <Button variant="hero" size="lg" className="w-full">
              Request New Link
            </Button>
          </Link>
        </div>
      );
    }

    if (isSuccess) {
      return (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-health-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-health-success" />
          </div>
          <p className="text-foreground">
            Your password has been successfully updated. Redirecting to sign in...
          </p>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl border border-border shadow-health-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg health-gradient flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-xl text-foreground">
                Fitness Assist
              </span>
            </Link>
            {tokenStatus === "valid" && !isSuccess && (
              <>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Set New Password
                </h1>
                <p className="text-muted-foreground">
                  Enter your new password below
                </p>
              </>
            )}
          </div>

          {renderContent()}

          <Link
            to="/"
            className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
