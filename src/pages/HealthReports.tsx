import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info,
  Plus,
  Trash2,
  Upload,
  Camera,
  X,
  AlertTriangle,
  Check
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

interface ExtractedValue {
  name: string;
  value: string;
  unit: string;
  normalRange?: string;
}

interface OcrResult {
  extractedValues: ExtractedValue[];
  documentType: string;
  confidence: string;
  notes: string;
}

export default function HealthReports() {
  const [labValues, setLabValues] = useState<LabValue[]>([
    { id: "1", name: "", value: "", unit: "" }
  ]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [activeTab, setActiveTab] = useState("manual");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setOcrResult(null);
    }
  };

  const clearImage = () => {
    setImage(null);
    setOcrResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExtractFromImage = async () => {
    if (!image) {
      toast({
        title: "No image selected",
        description: "Please upload a report image first.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);

    try {
      const { data, error } = await supabase.functions.invoke('report-ocr', {
        body: { image }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setOcrResult(data);

      if (data.extractedValues && data.extractedValues.length > 0) {
        toast({
          title: "Values extracted!",
          description: `Found ${data.extractedValues.length} lab values. Please review before analyzing.`,
        });
      } else {
        toast({
          title: "No values found",
          description: "Could not extract lab values. Please enter them manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OCR error:", error);
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Please try again or enter values manually.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const applyExtractedValues = () => {
    if (!ocrResult?.extractedValues || ocrResult.extractedValues.length === 0) return;

    const newLabValues = ocrResult.extractedValues.map((ev, index) => ({
      id: `extracted-${index}-${Date.now()}`,
      name: ev.name,
      value: ev.value,
      unit: ev.unit || "",
    }));

    setLabValues(newLabValues);
    setActiveTab("manual");
    toast({
      title: "Values applied",
      description: "Review the values and click 'Analyze Results' when ready.",
    });
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
              Input your lab values or upload a report image and receive AI-powered 
              explanations of what's high, low, or normal with actionable guidance.
            </p>
          </div>

          {/* Input Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Enter Your Lab Values</CardTitle>
              <CardDescription>
                Upload a report image for automatic extraction or enter values manually.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="upload" className="gap-2">
                    <Camera className="w-4 h-4" />
                    Upload Report
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Manual Entry
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="report-image-input"
                  />

                  {!image ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-all"
                    >
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-foreground font-medium mb-2">
                        Click to upload lab report
                      </p>
                      <p className="text-sm text-muted-foreground">
                        JPG, PNG, or PDF up to 10MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                          src={image}
                          alt="Report preview"
                          className="w-full max-h-60 object-contain rounded-xl bg-secondary"
                        />
                        <button
                          onClick={clearImage}
                          className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <Button
                        variant="hero"
                        onClick={handleExtractFromImage}
                        disabled={isExtracting}
                        className="w-full"
                      >
                        {isExtracting ? (
                          <>Extracting values with AI...</>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mr-2" />
                            Extract Lab Values
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* OCR Results */}
                  {ocrResult && ocrResult.extractedValues && ocrResult.extractedValues.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">
                          Extracted Values ({ocrResult.extractedValues.length})
                        </h4>
                        <span className={`text-sm ${ocrResult.confidence === 'high' ? 'text-health-success' : ocrResult.confidence === 'medium' ? 'text-health-warning' : 'text-health-danger'}`}>
                          {ocrResult.confidence} confidence
                        </span>
                      </div>

                      <div className="bg-secondary rounded-xl p-4 space-y-2 max-h-60 overflow-y-auto">
                        {ocrResult.extractedValues.map((ev, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-foreground font-medium">{ev.name}</span>
                            <span className="text-muted-foreground">
                              {ev.value} {ev.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Verification Warning */}
                      <div className="p-3 rounded-lg bg-health-warning-light border border-health-warning/30">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-health-warning flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            <strong className="text-foreground">Verification Required:</strong> Please review the extracted values for accuracy before proceeding. OCR may not be 100% accurate.
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="hero"
                        onClick={applyExtractedValues}
                        className="w-full"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Use These Values & Review
                      </Button>
                    </motion.div>
                  )}

                  {ocrResult?.notes && (
                    <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg">
                      <Info className="w-4 h-4 inline mr-2" />
                      {ocrResult.notes}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="manual">
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
                        <div className="w-24">
                          <Label htmlFor={`unit-${lv.id}`}>Unit</Label>
                          <Input
                            id={`unit-${lv.id}`}
                            placeholder="mg/dL"
                            value={lv.unit}
                            onChange={(e) => updateLabValue(lv.id, "unit", e.target.value)}
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
                </TabsContent>
              </Tabs>
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
