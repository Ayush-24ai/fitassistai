import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Share, 
  Plus,
  Check,
  Apple,
  Chrome
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl health-gradient flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Install Fitness Assist
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Install our app on your device for the best experience — 
              works offline and loads instantly!
            </p>
          </div>

          {isInstalled ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-health-success/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-health-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Already Installed!
                </h2>
                <p className="text-muted-foreground">
                  Fitness Assist is installed on your device. 
                  Look for it on your home screen or app list.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Quick Install (Android/Desktop Chrome) */}
              {deferredPrompt && (
                <Card className="mb-6 border-2 border-primary">
                  <CardContent className="pt-6 text-center">
                    <Button variant="hero" size="xl" onClick={handleInstall}>
                      <Download className="w-5 h-5 mr-2" />
                      Install Now
                    </Button>
                    <p className="text-sm text-muted-foreground mt-3">
                      One-click installation available
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* iOS Instructions */}
              {isIOS && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Apple className="w-5 h-5" />
                      Install on iPhone/iPad
                    </CardTitle>
                    <CardDescription>
                      Follow these steps to add Fitness Assist to your home screen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Tap the Share button</p>
                          <p className="text-sm text-muted-foreground">
                            Located at the bottom of Safari (square with arrow)
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Scroll and tap "Add to Home Screen"</p>
                          <p className="text-sm text-muted-foreground">
                            You may need to scroll down in the share menu
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Tap "Add" to confirm</p>
                          <p className="text-sm text-muted-foreground">
                            Fitness Assist will appear on your home screen
                          </p>
                        </div>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              )}

              {/* Android/Chrome Instructions */}
              {!isIOS && !deferredPrompt && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Chrome className="w-5 h-5" />
                      Install on Android/Desktop
                    </CardTitle>
                    <CardDescription>
                      Follow these steps to install Fitness Assist
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Open Chrome menu</p>
                          <p className="text-sm text-muted-foreground">
                            Tap the three dots (⋮) in the top right corner
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Tap "Install app" or "Add to Home screen"</p>
                          <p className="text-sm text-muted-foreground">
                            The option varies by browser version
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Confirm installation</p>
                          <p className="text-sm text-muted-foreground">
                            Fitness Assist will be added to your device
                          </p>
                        </div>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle>Why Install?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: Smartphone, title: "Works Offline", desc: "Access features without internet" },
                      { icon: Download, title: "Instant Launch", desc: "Open directly from home screen" },
                      { icon: Monitor, title: "Full Screen", desc: "App-like experience without browser UI" },
                      { icon: Plus, title: "Easy Access", desc: "Always one tap away" },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                        <item.icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
}
