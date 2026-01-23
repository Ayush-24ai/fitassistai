import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Locate,
  Mic,
  MicOff,
  Loader2,
  Navigation,
  ExternalLink,
  Info
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useNearbyPlaces } from "@/hooks/useNearbyPlaces";
import { LeafletMap } from "@/components/maps/LeafletMap";

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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showMapSection, setShowMapSection] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const { isAuthenticated, guestUsage, setGuestUsage } = useAuthStore();
  const { user } = useAuth();
  const { saveAnalysis } = useAnalysisHistory();
  const { places, isLoading: isLoadingPlaces, searchNearbyPlaces, isUsingDemoData } = useNearbyPlaces();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Voice input hook with auto-stop on silence
  const { 
    isListening, 
    isSupported: voiceSupported, 
    transcript, 
    startListening, 
    stopListening, 
    error: voiceError 
  } = useVoiceInput({
    onResult: (text) => {
      if (text.trim()) {
        setSymptoms(prev => prev ? `${prev} ${text}` : text);
      }
    },
    onError: (error) => {
      toast({
        title: "Voice input error",
        description: error,
        variant: "destructive",
      });
    },
    continuous: true,
    silenceTimeout: 3000, // Auto-stop after 3 seconds of silence
  });

  // Update symptoms with interim transcript while listening
  useEffect(() => {
    if (isListening && transcript) {
      // Show interim results while speaking
    }
  }, [isListening, transcript]);

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
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        
        // Search for nearby places using OpenStreetMap
        await searchNearbyPlaces(location, result?.doctorType || 'hospital');
        setShowMapSection(true);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Location error:", error);
        setLocationError("Unable to get your location. Please enable location access.");
        setIsLoadingLocation(false);
        
        // Use a default location for demo
        const demoLocation = { lat: 28.6139, lng: 77.2090 }; // Delhi
        setUserLocation(demoLocation);
        searchNearbyPlaces(demoLocation, result?.doctorType || 'hospital');
        setShowMapSection(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const openDirections = (place: { lat: number; lng: number; address: string }) => {
    // Open in device's default map app
    const destination = `${place.lat},${place.lng}`;
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    
    // Try to use native maps on mobile
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let mapsUrl: string;
    
    if (isIOS) {
      mapsUrl = `maps://maps.apple.com/?daddr=${destination}&saddr=${origin}`;
    } else if (isAndroid) {
      mapsUrl = `geo:${destination}?q=${destination}`;
    } else {
      // Fallback to OpenStreetMap directions
      if (origin) {
        mapsUrl = `https://www.openstreetmap.org/directions?from=${origin}&to=${destination}`;
      } else {
        mapsUrl = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`;
      }
    }
    
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
          <Card className="mb-8 card-interactive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Describe Your Symptoms
                {voiceSupported && (
                  <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    Voice enabled
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Be as specific as possible. Include duration, severity, and any related symptoms.
                {voiceSupported && " You can also use voice input."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Example: I've had a persistent headache for 3 days, along with mild fever and fatigue. The headache is mostly on the right side and gets worse in the evening..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="min-h-[150px] pr-12 resize-none focus-ring"
                />
                
                {/* Voice Input Button */}
                {voiceSupported && (
                  <motion.button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute right-3 top-3 p-2.5 rounded-full transition-all ${
                      isListening 
                        ? 'bg-health-danger text-white' 
                        : 'bg-secondary hover:bg-secondary/80 text-foreground'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={isListening ? "Stop recording" : "Start voice input"}
                  >
                    <AnimatePresence mode="wait">
                      {isListening ? (
                        <motion.div
                          key="mic-off"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <MicOff className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="mic"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Mic className="w-5 h-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )}
              </div>

              {/* Listening indicator */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-sm text-health-danger"
                  >
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-health-danger opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-health-danger"></span>
                    </span>
                    Listening... Speak your symptoms clearly
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Voice error message */}
              {voiceError && (
                <p className="text-sm text-health-danger">{voiceError}</p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || isListening}
                  className="flex-1 sm:flex-none"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze Symptoms
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                
                {symptoms && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setSymptoms("")}
                    disabled={isAnalyzing}
                  >
                    Clear
                  </Button>
                )}
              </div>
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
                        <Button variant="outline" size="lg" onClick={requestLocation} disabled={isLoadingLocation}>
                          {isLoadingLocation ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <MapPin className="w-4 h-4 mr-2" />
                          )}
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
                            disabled={isLoadingLocation || isLoadingPlaces}
                            className="w-full flex-wrap h-auto py-2"
                          >
                            {isLoadingLocation || isLoadingPlaces ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                <span className="truncate">Finding specialists...</span>
                              </>
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

                  {/* Nearby Doctors Section with OpenStreetMap */}
                  {showMapSection && places.length > 0 && (
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
                            Found {places.length} facilities within 10km
                            {isUsingDemoData && (
                              <span className="text-health-warning ml-2">(Demo data)</span>
                            )}
                            {locationError && !isUsingDemoData && (
                              <span className="text-health-warning ml-2">(Using approximate location)</span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* OpenStreetMap with Leaflet */}
                          <LeafletMap
                            userLocation={userLocation}
                            places={places}
                            className="mb-4"
                          />

                          {/* Doctor List */}
                          <div className="space-y-3">
                            {places.map((place, index) => (
                              <div 
                                key={index} 
                                className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-foreground">
                                        {place.name}
                                      </h4>
                                      {place.isOpen !== undefined && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${place.isOpen ? 'bg-health-success/10 text-health-success' : 'bg-muted text-muted-foreground'}`}>
                                          {place.isOpen ? 'Open' : 'Closed'}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {place.address}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Navigation className="w-3 h-3" />
                                        {place.distance}
                                      </span>
                                      <span className="capitalize">{place.specialty}</span>
                                      {place.rating && (
                                        <span className="text-health-warning">
                                          ★ {place.rating.toFixed(1)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDirections(place)}
                                    className="flex-shrink-0"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Directions
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* OpenStreetMap Attribution */}
                          <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border">
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-muted-foreground">
                                Map data provided by <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenStreetMap</a> contributors. 
                                Location data is approximate and for guidance only.
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
