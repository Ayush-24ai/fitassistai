import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  FileText, 
  Camera, 
  Brain,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  User,
  Apple,
  Dumbbell
} from "lucide-react";
import { format } from "date-fns";
import { AnalysisHistoryItem } from "@/hooks/useAnalysisHistory";

interface AnalysisDetailModalProps {
  analysis: AnalysisHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const featureIcons = {
  'symptom-checker': Activity,
  'health-reports': FileText,
  'food-scanner': Camera,
  'fitness-agent': Brain,
};

const featureLabels = {
  'symptom-checker': 'Symptom Check',
  'health-reports': 'Health Report',
  'food-scanner': 'Food Scan',
  'fitness-agent': 'Fitness Plan',
};

const severityColors = {
  emergency: 'bg-destructive text-destructive-foreground',
  urgent: 'bg-orange-500 text-white',
  moderate: 'bg-yellow-500 text-black',
  mild: 'bg-green-500 text-white',
};

export function AnalysisDetailModal({ analysis, open, onOpenChange }: AnalysisDetailModalProps) {
  if (!analysis) return null;

  const Icon = featureIcons[analysis.feature_type];
  const label = featureLabels[analysis.feature_type];
  const data = analysis.result_data || {};

  const renderSymptomCheckerResult = () => {
    const severity = data.severity as string;
    const severityClass = severityColors[severity as keyof typeof severityColors] || 'bg-muted text-muted-foreground';
    
    return (
      <div className="space-y-6">
        {/* Severity Badge */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Severity:</span>
          <Badge className={severityClass}>
            {severity?.toUpperCase() || 'Unknown'}
          </Badge>
        </div>

        {/* Doctor Type */}
        {data.doctorType && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-primary" />
              <span className="font-medium">Recommended Care</span>
            </div>
            <p className="text-foreground">{data.doctorType as string}</p>
          </div>
        )}

        {/* Explanation */}
        {data.explanation && (
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Assessment</span>
            </div>
            <p className="text-muted-foreground">{data.explanation as string}</p>
          </div>
        )}

        {/* Precautions */}
        {Array.isArray(data.precautions) && data.precautions.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Precautions
            </h4>
            <ul className="space-y-2">
              {(data.precautions as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-yellow-500 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Do Actions */}
        {Array.isArray(data.doActions) && data.doActions.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Recommended Actions
            </h4>
            <ul className="space-y-2">
              {(data.doActions as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-green-500 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Avoid Actions */}
        {Array.isArray(data.avoidActions) && data.avoidActions.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Things to Avoid
            </h4>
            <ul className="space-y-2">
              {(data.avoidActions as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-destructive mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderHealthReportResult = () => {
    return (
      <div className="space-y-6">
        {/* Overall Assessment */}
        {data.overallAssessment && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h4 className="font-medium mb-2">Overall Assessment</h4>
            <p className="text-muted-foreground">{data.overallAssessment as string}</p>
          </div>
        )}

        {/* Metrics */}
        {Array.isArray(data.metrics) && data.metrics.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Analyzed Metrics</h4>
            <div className="space-y-3">
              {(data.metrics as Array<{ name: string; value: string; status: string; insight: string }>).map((metric, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30 border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{metric.name}</span>
                    <Badge variant={metric.status === 'normal' ? 'default' : 'destructive'}>
                      {metric.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{metric.value}</p>
                  {metric.insight && (
                    <p className="text-sm text-muted-foreground mt-2 italic">{metric.insight}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {Array.isArray(data.recommendations) && data.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Recommendations
            </h4>
            <ul className="space-y-2">
              {(data.recommendations as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-green-500 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderFoodScannerResult = () => {
    return (
      <div className="space-y-6">
        {/* Food Items */}
        {Array.isArray(data.foods) && data.foods.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Apple className="w-4 h-4 text-green-500" />
              Detected Foods
            </h4>
            <div className="space-y-3">
              {(data.foods as Array<{ name: string; calories: number; confidence: string }>).map((food, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30 border flex items-center justify-between">
                  <div>
                    <span className="font-medium">{food.name}</span>
                    <p className="text-sm text-muted-foreground">Confidence: {food.confidence}</p>
                  </div>
                  <Badge variant="outline" className="text-lg">
                    {food.calories} cal
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Calories */}
        {data.totalCalories && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <span className="text-sm text-muted-foreground">Total Estimated Calories</span>
            <p className="text-3xl font-bold text-primary">{data.totalCalories as number}</p>
          </div>
        )}

        {/* Nutritional Notes */}
        {data.notes && (
          <div className="p-4 rounded-lg bg-secondary/50">
            <h4 className="font-medium mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground">{data.notes as string}</p>
          </div>
        )}
      </div>
    );
  };

  const renderFitnessAgentResult = () => {
    return (
      <div className="space-y-6">
        {/* BMI & Metrics */}
        {(data.bmi || data.bmr || data.tdee) && (
          <div className="grid grid-cols-3 gap-3">
            {data.bmi && (
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <span className="text-xs text-muted-foreground">BMI</span>
                <p className="text-xl font-bold">{Number(data.bmi).toFixed(1)}</p>
                {data.bmiCategory && (
                  <span className="text-xs text-muted-foreground">{data.bmiCategory as string}</span>
                )}
              </div>
            )}
            {data.bmr && (
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <span className="text-xs text-muted-foreground">BMR</span>
                <p className="text-xl font-bold">{Math.round(data.bmr as number)}</p>
                <span className="text-xs text-muted-foreground">cal/day</span>
              </div>
            )}
            {data.tdee && (
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <span className="text-xs text-muted-foreground">TDEE</span>
                <p className="text-xl font-bold">{Math.round(data.tdee as number)}</p>
                <span className="text-xs text-muted-foreground">cal/day</span>
              </div>
            )}
          </div>
        )}

        {/* Workout Plan */}
        {Array.isArray(data.workoutPlan) && data.workoutPlan.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              Workout Plan
            </h4>
            <div className="space-y-2">
              {(data.workoutPlan as Array<{ day: string; exercises: string[] }>).map((day, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30 border">
                  <span className="font-medium">{day.day}</span>
                  <ul className="mt-1 text-sm text-muted-foreground">
                    {day.exercises?.map((ex, j) => (
                      <li key={j}>• {ex}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nutrition Tips */}
        {Array.isArray(data.nutritionTips) && data.nutritionTips.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Apple className="w-4 h-4 text-green-500" />
              Nutrition Tips
            </h4>
            <ul className="space-y-2">
              {(data.nutritionTips as string[]).map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-green-500 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary */}
        {data.summary && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h4 className="font-medium mb-2">Summary</h4>
            <p className="text-muted-foreground">{data.summary as string}</p>
          </div>
        )}
      </div>
    );
  };

  const renderResult = () => {
    switch (analysis.feature_type) {
      case 'symptom-checker':
        return renderSymptomCheckerResult();
      case 'health-reports':
        return renderHealthReportResult();
      case 'food-scanner':
        return renderFoodScannerResult();
      case 'fitness-agent':
        return renderFitnessAgentResult();
      default:
        return (
          <div className="p-4 rounded-lg bg-secondary/50">
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="block">{analysis.title}</span>
              <span className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {label}
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(analysis.created_at), 'MMM d, yyyy h:mm a')}
                </span>
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {analysis.summary && (
            <p className="text-muted-foreground mb-6 p-3 rounded-lg bg-muted/50 italic">
              {analysis.summary}
            </p>
          )}
          {renderResult()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
