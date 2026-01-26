import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Eye, EyeOff, User, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be less than 128 characters"),
});

export default function SetupProfile() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; password?: string }>({});
  const { user, loading, profileComplete } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect logic
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to sign in
        navigate("/signin");
      } else if (profileComplete) {
        // Profile already complete, redirect to dashboard
        navigate("/dashboard");
      }
    }
  }, [user, loading, profileComplete, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = profileSchema.safeParse({ name, password });
    if (!result.success) {
      const fieldErrors: { name?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "name") fieldErrors.name = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete your profile.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update user password
      const { error: passwordError } = await supabase.auth.updateUser({
        password,
        data: {
          display_name: name,
        },
      });

      if (passwordError) {
        toast({
          title: "Error",
          description: passwordError.message || "Failed to set password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Update profile with display_name
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: name,
        })
        .eq("user_id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        // Profile might not exist yet, try to create it
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            display_name: name,
          });

        if (insertError && !insertError.message.includes("duplicate")) {
          console.error("Profile insert error:", insertError);
        }
      }

      toast({
        title: "Profile Complete!",
        description: "Welcome to Fitness Assist.",
      });

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Setup error:", err);
      toast({
        title: "Error",
        description: "Failed to complete profile setup. Please try again.",
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

  // Don't render if not authenticated or profile is complete
  if (!user || profileComplete) {
    return null;
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
              Complete Your Profile
            </h1>
            <p className="text-muted-foreground">
              Set up your name and password to get started
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
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
                Must be at least 8 characters. This password will be used for future sign-ins.
              </p>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Signed in as: {user.email}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
