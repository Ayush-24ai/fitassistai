import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Camera, 
  Upload, 
  X, 
  Utensils,
  Info,
  Flame,
  AlertTriangle
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";

interface FoodAnalysis {
  foodName: string;
  calories: number;
  caloriesMin: number;
  caloriesMax: number;
  confidence: "high" | "medium" | "low";
  servingSize: string;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  healthNotes: string[];
}

export default function FoodScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FoodAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isAuthenticated, guestUsage, setGuestUsage } = useAuthStore();
  const { user } = useAuth();
  const { saveAnalysis } = useAnalysisHistory();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 10MB.",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImageFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      toast({
        title: "No image selected",
        description: "Please upload a food image first.",
        variant: "destructive",
      });
      return;
    }

    // Check guest usage
    if (!isAuthenticated && guestUsage.hasUsedFeature) {
      toast({
        title: "Sign in required",
        description: "You've used your free trial. Please sign in to continue.",
        variant: "destructive",
      });
      navigate("/signup");
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('food-scanner', {
        body: { image }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);

      // Save to analysis history for authenticated users
      if (user) {
        await saveAnalysis(
          'food-scanner',
          `Food Scan: ${data.foodName}`,
          `${data.calories} calories (${data.confidence} confidence)`,
          data
        );
      }

      if (!isAuthenticated) {
        setGuestUsage("food-scanner");
      }
    } catch (error) {
      console.error("Food analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "text-health-success";
      case "medium":
        return "text-health-warning";
      default:
        return "text-health-danger";
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl health-gradient flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Food Calorie Scanner
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Upload a photo of your food and let AI estimate the calories and 
              nutritional information.
            </p>
          </div>

          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                Scan Your Food
              </CardTitle>
              <CardDescription>
                Take a clear photo of your meal for the most accurate results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="food-image-input"
              />

              {!image ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-all"
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-2">
                    Click to upload food image
                  </p>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG up to 10MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={image}
                    alt="Food preview"
                    className="w-full max-h-80 object-contain rounded-xl"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {image && (
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full mt-4"
                >
                  {isAnalyzing ? (
                    <>Analyzing with AI...</>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Analyze Food
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Main Result */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{result.foodName}</CardTitle>
                      <CardDescription>
                        Serving size: {result.servingSize}
                      </CardDescription>
                    </div>
                    <div className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                      {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)} Confidence
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-6 bg-health-teal-light dark:bg-health-teal/10 rounded-xl mb-6">
                    <Flame className="w-8 h-8 text-health-teal mr-3" />
                    <div className="text-center">
                      <div className="text-4xl font-bold text-foreground">
                        {result.calories}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Estimated Calories
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Range: {result.caloriesMin} - {result.caloriesMax} kcal
                      </div>
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-health-teal-light dark:bg-health-teal/10">
                      <div className="text-2xl font-bold text-foreground">{result.macros.protein}g</div>
                      <div className="text-sm text-muted-foreground">Protein</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-health-blue-light dark:bg-health-blue/10">
                      <div className="text-2xl font-bold text-foreground">{result.macros.carbs}g</div>
                      <div className="text-sm text-muted-foreground">Carbs</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-health-warning-light dark:bg-health-warning/10">
                      <div className="text-2xl font-bold text-foreground">{result.macros.fat}g</div>
                      <div className="text-sm text-muted-foreground">Fat</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Health Notes */}
              {result.healthNotes && result.healthNotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" />
                      Health Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.healthNotes.map((note, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">•</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Disclaimer */}
              <div className="p-4 rounded-xl bg-health-warning-light dark:bg-health-warning/10 border border-health-warning/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-health-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Calorie Estimate Disclaimer
                    </p>
                    <p className="text-sm text-muted-foreground">
                      These values are AI-estimated approximations based on visual analysis. 
                      Actual nutritional content may vary based on portion size, preparation 
                      method, and ingredients. For precise tracking, use measured ingredients 
                      or verified nutrition labels.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
}
