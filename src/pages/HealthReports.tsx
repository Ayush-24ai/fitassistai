import { useState } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info,
  Plus,
  Trash2
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LabValue {
  id: string;
  name: string;
  value: string;
  unit: string;
}

interface AnalysisResult {
  name: string;
  value: number;
  unit: string;
  status: "high" | "low" | "normal";
  normalRange: string;
  explanation: string;
  dietGuidance: string;
  activityGuidance: string;
}

export default function HealthReports() {
  const [labValues, setLabValues] = useState<LabValue[]>([
    { id: "1", name: "", value: "", unit: "" }
  ]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { isAuthenticated, guestUsage, setGuestUsage } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const addLabValue = () => {
    setLabValues([
      ...labValues,
      { id: Date.now().toString(), name: "", value: "", unit: "" }
    ]);
  };

  const removeLabValue = (id: string) => {
    if (labValues.length > 1) {
      setLabValues(labValues.filter((lv) => lv.id !== id));
    }
  };

  const updateLabValue = (id: string, field: keyof LabValue, value: string) => {
    setLabValues(
      labValues.map((lv) =>
        lv.id === id ? { ...lv, [field]: value } : lv
      )
    );
  };

  const handleAnalyze = async () => {
    const validValues = labValues.filter((lv) => lv.name && lv.value);
    
    if (validValues.length === 0) {
      toast({
        title: "Please enter lab values",
        description: "Add at least one lab value to analyze.",
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
      const { data, error } = await supabase.functions.invoke('health-report', {
        body: { 
          labValues: validValues.map(lv => ({
            name: lv.name,
            value: parseFloat(lv.value),
            unit: lv.unit || undefined
          }))
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data.results || []);

      if (!isAuthenticated) {
        setGuestUsage("health-reports");
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "high":
        return <TrendingUp className="w-5 h-5 text-health-warning" />;
      case "low":
        return <TrendingDown className="w-5 h-5 text-health-blue" />;
      default:
        return <Minus className="w-5 h-5 text-health-success" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "health-warning";
      case "low":
        return "health-blue";
      default:
        return "health-success";
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
              <FileText className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Health Report Analyzer
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Input your lab values and receive AI-powered explanations of what's 
              high, low, or normal with actionable guidance.
            </p>
          </div>

          {/* Input Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Enter Your Lab Values</CardTitle>
              <CardDescription>
                Add your test results below. Common tests include glucose, cholesterol, hemoglobin, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {labValues.map((lv) => (
                  <div key={lv.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label htmlFor={`name-${lv.id}`}>Test Name</Label>
                      <Input
                        id={`name-${lv.id}`}
                        placeholder="e.g., Glucose, Cholesterol"
                        value={lv.name}
                        onChange={(e) => updateLabValue(lv.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="w-32">
                      <Label htmlFor={`value-${lv.id}`}>Value</Label>
                      <Input
                        id={`value-${lv.id}`}
                        type="number"
                        placeholder="100"
                        value={lv.value}
                        onChange={(e) => updateLabValue(lv.id, "value", e.target.value)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLabValue(lv.id)}
                      disabled={labValues.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Button variant="outline" onClick={addLabValue}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Value
                </Button>
                <Button
                  variant="hero"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>Analyzing with AI...</>
                  ) : (
                    <>
                      Analyze Results
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-foreground">Analysis Results</h2>
              
              {results.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <CardTitle className="text-lg">{result.name}</CardTitle>
                          <CardDescription>
                            Normal range: {result.normalRange}
                          </CardDescription>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg bg-${getStatusColor(result.status)}/10`}>
                        <span className={`text-lg font-bold text-${getStatusColor(result.status)}`}>
                          {result.value} {result.unit}
                        </span>
                        <span className={`ml-2 text-sm capitalize text-${getStatusColor(result.status)}`}>
                          ({result.status})
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-1 flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        What This Means
                      </h4>
                      <p className="text-sm text-muted-foreground">{result.explanation}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-health-success-light">
                        <h4 className="font-medium text-foreground mb-1">Diet Guidance</h4>
                        <p className="text-sm text-muted-foreground">{result.dietGuidance}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-health-blue-light">
                        <h4 className="font-medium text-foreground mb-1">Activity Guidance</h4>
                        <p className="text-sm text-muted-foreground">{result.activityGuidance}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Disclaimer */}
              <div className="p-4 rounded-xl bg-secondary border border-border">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Medical Disclaimer:</strong> This analysis is for educational purposes 
                    only. Lab value interpretation can vary based on individual health conditions, 
                    age, and other factors. Always consult your healthcare provider for proper 
                    interpretation and medical advice.
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
