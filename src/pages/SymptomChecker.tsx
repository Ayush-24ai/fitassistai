import { useState, useEffect } from "react";
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
  Info,
  Navigation,
  ExternalLink,
  Locate
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";

interface SymptomResult {
  severity: "emergency" | "urgent" | "moderate" | "mild";
  doctorType: string;
  precautions: string[];
  doActions: string[];
  avoidActions: string[];
  explanation: string;
}

interface NearbyDoctor {
  name: string;
  address: string;
  distance: string;
  specialty: string;
  rating?: number;
  isOpen?: boolean;
}

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nearbyDoctors, setNearbyDoctors] = useState<NearbyDoctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showMapSection, setShowMapSection] = useState(false);
  
  const { isAuthenticated, guestUsage, setGuestUsage } = useAuthStore();
  const { user } = useAuth();
  const { saveAnalysis } = useAnalysisHistory();
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
    setNearbyDoctors([]);
    setShowMapSection(false);
    
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
      
      // Save to analysis history for authenticated users
      if (user) {
        await saveAnalysis(
          'symptom-checker',
          `Symptom Analysis: ${data.severity} severity`,
          `Doctor type: ${data.doctorType}`,
          { symptoms, ...data }
        );
      }
      
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

  const requestLocation = () => {
    setLocationError(null);
    setIsLoadingDoctors(true);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLoadingDoctors(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        searchNearbyDoctors(location);
      },
      (error) => {
        console.error("Location error:", error);
        setLocationError("Unable to get your location. Please enable location access.");
        setIsLoadingDoctors(false);
        // Show mock data for demonstration
        showMockDoctors();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const showMockDoctors = () => {
    // Mock data for demonstration when location is not available
    const mockDoctors: NearbyDoctor[] = [
      {
        name: "City Medical Center",
        address: "123 Health Street, Medical District",
        distance: "0.5 km",
        specialty: result?.doctorType || "General Practice",
        rating: 4.5,
        isOpen: true
      },
      {
        name: "Downtown Health Clinic",
        address: "456 Wellness Avenue",
        distance: "1.2 km",
        specialty: result?.doctorType || "General Practice",
        rating: 4.3,
        isOpen: true
      },
      {
        name: "Community Hospital",
        address: "789 Care Boulevard",
        distance: "2.1 km",
        specialty: result?.doctorType || "General Practice",
        rating: 4.7,
        isOpen: false
      }
    ];
    
    setNearbyDoctors(mockDoctors);
    setShowMapSection(true);
    setIsLoadingDoctors(false);
  };

  const searchNearbyDoctors = async (location: { lat: number; lng: number }) => {
    // In production, this would call Google Maps API
    // For now, show mock data with a note about API integration
    showMockDoctors();
    
    toast({
      title: "Demo Mode",
      description: "Showing sample nearby facilities. Google Maps API integration required for real results.",
    });
  };

  const openDirections = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = userLocation 
      ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${encodedAddress}`
      : `https://www.google.com/maps/search/${encodedAddress}`;
    window.open(mapsUrl, '_blank');
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
              Symptom Checker & Doctor Finder
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Describe your symptoms in detail and receive AI-powered guidance 
              on severity level, recommended care, and find nearby specialists.
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
                <div className="p-6 rounded-2xl bg-health-danger-light dark:bg-health-danger/10 border-2 border-health-danger">
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
                        <Button variant="destructive" size="lg">
                          <Phone className="w-4 h-4 mr-2" />
                          Call 911
                        </Button>
                        <Button variant="outline" size="lg" onClick={requestLocation}>
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
                    {/* Doctor Recommendation with Map */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Stethoscope className="w-5 h-5 text-primary" />
                          Recommended Specialist
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-foreground font-medium">{result.doctorType}</p>
                        
                        {!showMapSection && (
                          <Button 
                            variant="outline" 
                            onClick={requestLocation}
                            disabled={isLoadingDoctors}
                            className="w-full flex-wrap h-auto py-2"
                          >
                            {isLoadingDoctors ? (
                              <span className="truncate">Finding doctors...</span>
                            ) : (
                              <>
                                <Locate className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate">Find Nearby Specialists</span>
                              </>
                            )}
                          </Button>
                        )}
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

                  {/* Nearby Doctors Section */}
                  {showMapSection && nearbyDoctors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Nearby {result.doctorType}s
                          </CardTitle>
                          <CardDescription>
                            Found {nearbyDoctors.length} facilities near you
                            {locationError && (
                              <span className="text-health-warning ml-2">(Using demo data)</span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Map Placeholder */}
                          <div className="w-full h-48 bg-secondary rounded-xl mb-4 flex items-center justify-center border-2 border-dashed border-border">
                            <div className="text-center text-muted-foreground">
                              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm font-medium">Map View</p>
                              <p className="text-xs">Google Maps API integration ready</p>
                            </div>
                          </div>

                          {/* Doctor List */}
                          <div className="space-y-3">
                            {nearbyDoctors.map((doctor, index) => (
                              <div 
                                key={index} 
                                className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-foreground">
                                        {doctor.name}
                                      </h4>
                                      {doctor.isOpen !== undefined && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${doctor.isOpen ? 'bg-health-success/10 text-health-success' : 'bg-muted text-muted-foreground'}`}>
                                          {doctor.isOpen ? 'Open' : 'Closed'}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {doctor.address}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Navigation className="w-3 h-3" />
                                        {doctor.distance}
                                      </span>
                                      <span>{doctor.specialty}</span>
                                      {doctor.rating && (
                                        <span className="text-health-warning">
                                          ★ {doctor.rating}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDirections(doctor.address)}
                                    className="flex-shrink-0"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Directions
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Google Maps API Note */}
                          <div className="mt-4 p-3 rounded-lg bg-health-blue-light border border-health-blue/30">
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-health-blue flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-muted-foreground">
                                <strong className="text-foreground">Google Maps Integration Ready:</strong> This feature is prepared for Google Maps Places API integration. Add your API key to enable real-time doctor/hospital search based on your location.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
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
