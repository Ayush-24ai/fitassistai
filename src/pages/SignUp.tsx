import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity, ArrowLeft, Mail, Lock, User, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { z } from "zod";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
});

const signupSchema = z.object({
  displayName: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be less than 128 characters"),
});

type Step = "email" | "otp" | "password" | "success";

export default function SignUp() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; displayName?: string; password?: string }>({});
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return;
    }

    if (!agreeToTerms) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the Privacy Policy and Terms of Service.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { email, purpose: "signup" },
      });

      if (error || data?.error) {
        toast({
          title: "Error",
          description: data?.error || error?.message || "Failed to send verification code",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setStep("otp");
      toast({
        title: "Code Sent!",
        description: "Check your email for the 6-digit verification code.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the complete 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email, otp, purpose: "signup", verifyOnly: true },
      });

      if (error || data?.error) {
        toast({
          title: "Verification Failed",
          description: data?.error || error?.message || "Invalid or expired code",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setStep("password");
      toast({
        title: "Email Verified!",
        description: "Now set up your account details.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Verification failed. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({ displayName, password });
    if (!result.success) {
      const fieldErrors: { displayName?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "displayName") fieldErrors.displayName = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: {
          email,
          otp,
          purpose: "signup",
          password,
          displayName,
        },
      });

      if (error || data?.error) {
        toast({
          title: "Account Creation Failed",
          description: data?.error || error?.message || "Failed to create account",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setStep("success");
      toast({
        title: "Account Created!",
        description: "You can now sign in with your credentials.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {step === "email" && "Create Your Account"}
              {step === "otp" && "Verify Your Email"}
              {step === "password" && "Set Up Your Account"}
              {step === "success" && "Account Created!"}
            </h1>
            <p className="text-muted-foreground">
              {step === "email" && "Start your health journey today"}
              {step === "otp" && `Enter the code sent to ${email}`}
              {step === "password" && "Complete your account setup"}
              {step === "success" && "You're all set!"}
            </p>
          </div>

          {/* Step: Email */}
          {step === "email" && (
            <>
              {/* Google Sign In - Above the form */}
              <div className="mb-6">
                <GoogleSignInButton disabled={isLoading} />
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading || !agreeToTerms}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    "Continue with Email"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Step: OTP Verification */}
          {step === "otp" && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setOtp("");
                    handleSendOtp({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  className="text-primary hover:underline"
                  disabled={isLoading}
                >
                  Resend
                </button>
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="hero"
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Password & Name */}
          {step === "password" && (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    minLength={8}
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

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("otp")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Your account has been created successfully. You can now sign in.
              </p>
              <Button
                variant="hero"
                onClick={() => navigate("/signin")}
                className="w-full"
              >
                Go to Sign In
              </Button>
            </div>
          )}

          {/* Footer */}
          {step === "email" && (
            <>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/signin" className="text-primary font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>

              <Link
                to="/"
                className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
