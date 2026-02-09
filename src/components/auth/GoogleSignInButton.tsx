import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface GoogleSignInButtonProps {
  disabled?: boolean;
}

export function GoogleSignInButton({ disabled }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isLovableDomain = () => {
    const hostname = window.location.hostname;
    return hostname.includes("lovable.app") || hostname.includes("lovableproject.com");
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      if (!isLovableDomain()) {
        // PWA / custom domain: bypass auth-bridge, use direct Supabase OAuth
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
            skipBrowserRedirect: true,
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });

        if (error) throw error;

        if (data?.url) {
          const oauthUrl = new URL(data.url);
          const allowedHosts = ["accounts.google.com"];
          if (!allowedHosts.some((host) => oauthUrl.hostname === host)) {
            throw new Error("Invalid OAuth redirect URL");
          }
          window.location.href = data.url;
          return;
        }
      } else {
        // Lovable preview: use managed auth-bridge
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
          extraParams: {
            prompt: "select_account",
          },
        });

        if (result.error) {
          console.error("Google sign-in error:", result.error);
          toast({
            title: "Sign In Failed",
            description: result.error.message || "Could not sign in with Google. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!result.redirected) {
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Google sign-in exception:", err);
      toast({
        title: "Sign In Failed",
        description: err?.message || "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full gap-3 font-medium"
      onClick={handleGoogleSignIn}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {isLoading ? "Signing in..." : "Continue with Google"}
    </Button>
  );
}
