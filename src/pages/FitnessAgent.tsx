import { useState } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  ArrowRight, 
  Target,
  Dumbbell,
  Utensils,
  Calculator,
  Crown,
  Lock,
  Info,
  TrendingUp,
  Activity,
  Calendar,
  Lightbulb
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FitnessProfile {
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
}

interface FitnessResult {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  recommendedCalories: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  workoutPlan: string[];
  mealSuggestions: string[];
  weeklySchedule?: Record<string, string>;
  tips?: string[];
}

export default function FitnessAgent() {
  const { isAuthenticated, isPro, guestUsage, setGuestUsage } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<FitnessProfile>({
    age: 30,
    gender: "male",
    height: 170,
    weight: 70,
    activityLevel: "moderate",
  });
  const [goal, setGoal] = useState("maintain");
  const [result, setResult] = useState<FitnessResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    // Check if Pro for full features
    if (!isPro && !isAuthenticated) {
      // Allow one-time guest use
      if (guestUsage.hasUsedFeature) {
        toast({
          title: "Sign in required",
          description: "You've used your free trial. Please sign in to continue.",
          variant: "destructive",
        });
        navigate("/signup");
        return;
      }
    }

    setIsCalculating(true);

    try {
      const { data, error } = await supabase.functions.invoke('fitness-agent', {
        body: { ...profile, goal }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);

      if (!isAuthenticated) {
        setGuestUsage("fitness-agent");
      }
    } catch (error) {
      console.error("Fitness agent error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
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
            <div className="w-16 h-16 rounded-2xl pro-gradient flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                AI Fitness Agent
              </h1>
              <span className="px-2 py-1 rounded-full pro-gradient text-xs font-medium text-primary-foreground">
                PRO
              </span>
            </div>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Your personal AI trainer that creates custom workout and diet plans 
              based on your body type and fitness goals.
            </p>
          </div>

          {/* Profile Input */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Fitness Profile</CardTitle>
              <CardDescription>
                Enter your details to receive personalized AI recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={profile.gender}
                    onValueChange={(value) => setProfile({ ...profile, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profile.height}
                    onChange={(e) => setProfile({ ...profile, height: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={profile.weight}
                    onChange={(e) => setProfile({ ...profile, weight: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="activity">Activity Level</Label>
                  <Select
                    value={profile.activityLevel}
                    onValueChange={(value) => setProfile({ ...profile, activityLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                      <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                      <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                      <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                      <SelectItem value="veryActive">Very Active (intense daily)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="goal">Fitness Goal</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose">Lose Weight</SelectItem>
                      <SelectItem value="maintain">Maintain Weight</SelectItem>
                      <SelectItem value="gain">Gain Muscle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="pro"
                size="lg"
                onClick={handleCalculate}
                disabled={isCalculating}
                className="mt-6"
              >
                {isCalculating ? (
                  <>Generating with AI...</>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate My Plan
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* BMI & Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Calculator className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-3xl font-bold text-foreground">{result.bmi}</div>
                    <div className="text-sm text-muted-foreground">BMI ({result.bmiCategory})</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Activity className="w-8 h-8 text-health-emerald mx-auto mb-2" />
                    <div className="text-3xl font-bold text-foreground">{result.bmr}</div>
                    <div className="text-sm text-muted-foreground">BMR (cal/day)</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Target className="w-8 h-8 text-health-blue mx-auto mb-2" />
                    <div className="text-3xl font-bold text-foreground">{result.recommendedCalories}</div>
                    <div className="text-sm text-muted-foreground">Target Calories</div>
                  </CardContent>
                </Card>
              </div>

              {/* Macros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Daily Macro Targets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-health-teal-light">
                      <div className="text-2xl font-bold text-foreground">{result.proteinTarget}g</div>
                      <div className="text-sm text-muted-foreground">Protein</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-health-blue-light">
                      <div className="text-2xl font-bold text-foreground">{result.carbsTarget}g</div>
                      <div className="text-sm text-muted-foreground">Carbs</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-health-warning-light">
                      <div className="text-2xl font-bold text-foreground">{result.fatTarget}g</div>
                      <div className="text-sm text-muted-foreground">Fat</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Workout Plan */}
              <Card className={!isPro ? "relative overflow-hidden" : ""}>
                {!isPro && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center p-6">
                      <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Pro Feature</h3>
                      <p className="text-muted-foreground mb-4">
                        Upgrade to Pro for personalized workout plans
                      </p>
                      <Link to="/upgrade">
                        <Button variant="pro">
                          <Crown className="w-4 h-4 mr-2" />
                          Get Pro Free!
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-health-emerald" />
                    AI Workout Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.workoutPlan?.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-health-emerald/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-health-emerald">{i + 1}</span>
                        </div>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Meal Suggestions */}
              <Card className={!isPro ? "relative overflow-hidden" : ""}>
                {!isPro && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center p-6">
                      <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Pro Feature</h3>
                      <p className="text-muted-foreground mb-4">
                        Upgrade to Pro for personalized meal plans
                      </p>
                      <Link to="/upgrade">
                        <Button variant="pro">
                          <Crown className="w-4 h-4 mr-2" />
                          Get Pro Free!
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-health-warning" />
                    AI Meal Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.mealSuggestions?.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-health-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-health-warning">{i + 1}</span>
                        </div>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Weekly Schedule */}
              {result.weeklySchedule && isPro && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Weekly Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                      {Object.entries(result.weeklySchedule).map(([day, workout]) => (
                        <div key={day} className="p-3 rounded-lg bg-secondary text-center">
                          <div className="text-xs font-medium text-muted-foreground capitalize mb-1">{day}</div>
                          <div className="text-sm text-foreground">{workout}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips */}
              {result.tips && isPro && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-health-warning" />
                      Personalized Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-health-warning">💡</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Disclaimer */}
              <div className="p-4 rounded-xl bg-secondary border border-border">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Disclaimer:</strong> These recommendations are AI-generated for educational purposes. 
                    Consult healthcare professionals before starting new diet or exercise programs.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
}
