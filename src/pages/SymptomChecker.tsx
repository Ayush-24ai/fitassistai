import { useState } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  CheckCircle, 
  Stethoscope, 
  AlertCircle,
  ArrowRight,
  Phone,
  MapPin,
  ShieldAlert,
  Info
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SymptomResult {
  severity: "emergency" | "urgent" | "moderate" | "mild";
  doctorType: string;
  precautions: string[];
  doActions: string[];
  avoidActions: string[];
  explanation: string;
}

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { isAuthenticated, guestUsage, setGuestUsage } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "Please describe your symptoms",
        description: "Enter your symptoms to get guidance.",
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
      const { data, error } = await supabase.functions.invoke('symptom-checker', {
        body: { symptoms }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      
      if (!isAuthenticated) {
        setGuestUsage("symptom-checker");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "emergency":
        return "health-danger";
      case "urgent":
        return "health-warning";
      case "moderate":
        return "health-blue";
      default:
        return "health-success";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "emergency":
        return ShieldAlert;
      case "urgent":
        return AlertTriangle;
      case "moderate":
        return AlertCircle;
      default:
        return CheckCircle;
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
              <Stethoscope className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Symptom Checker
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Describe your symptoms in detail and receive AI-powered guidance 
              on severity level and recommended care.
            </p>
          </div>

          {/* Input Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Describe Your Symptoms</CardTitle>
              <CardDescription>
                Be as specific as possible. Include duration, severity, and any related symptoms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Example: I've had a persistent headache for 3 days, along with mild fever and fatigue. The headache is mostly on the right side and gets worse in the evening..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="min-h-[150px] mb-4"
              />
              <Button
                variant="hero"
                size="lg"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <>Analyzing with AI...</>
                ) : (
                  <>
                    Analyze Symptoms
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Severity Alert */}
              {result.severity === "emergency" && (
                <div className="p-6 rounded-2xl bg-health-danger-light border-2 border-health-danger">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-health-danger flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-health-danger mb-2">
                        ⚠️ EMERGENCY - Seek Immediate Care
                      </h3>
                      <p className="text-foreground mb-4">
                        {result.explanation}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="danger" size="lg">
                          <Phone className="w-4 h-4 mr-2" />
                          Call 911
                        </Button>
                        <Button variant="outline" size="lg">
                          <MapPin className="w-4 h-4 mr-2" />
                          Find Nearest ER
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Non-emergency results */}
              {result.severity !== "emergency" && (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const Icon = getSeverityIcon(result.severity);
                          return (
                            <div className={`w-10 h-10 rounded-lg bg-${getSeverityColor(result.severity)}/10 flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 text-${getSeverityColor(result.severity)}`} />
                            </div>
                          );
                        })()}
                        <div>
                          <CardTitle className="capitalize">
                            {result.severity} Severity
                          </CardTitle>
                          <CardDescription>{result.explanation}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Doctor Recommendation */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Stethoscope className="w-5 h-5 text-primary" />
                          Recommended Specialist
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground font-medium">{result.doctorType}</p>
                      </CardContent>
                    </Card>

                    {/* Precautions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-health-warning" />
                          Precautions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.precautions.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-health-warning">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Do */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-health-success" />
                          Actions to Take
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.doActions.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-health-success">✓</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Avoid */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-health-danger" />
                          Things to Avoid
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.avoidActions.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-health-danger">✗</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* Disclaimer */}
              <div className="p-4 rounded-xl bg-secondary border border-border">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Medical Disclaimer:</strong> Fitness Assist does not provide medical 
                    diagnosis or treatment. This information is for educational purposes only. 
                    Always consult a qualified healthcare professional for medical advice, 
                    diagnosis, or treatment.
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
