import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  FileText, 
  Camera, 
  Brain, 
  Trash2, 
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AnalysisHistoryItem } from "@/hooks/useAnalysisHistory";
import { AnalysisDetailModal } from "./AnalysisDetailModal";

interface AnalysisHistoryCardProps {
  history: AnalysisHistoryItem[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

const featureIcons = {
  'symptom-checker': Activity,
  'health-reports': FileText,
  'food-scanner': Camera,
  'fitness-agent': Brain,
};

const featureColors = {
  'symptom-checker': 'text-health-teal bg-health-teal/10',
  'health-reports': 'text-health-blue bg-health-blue/10',
  'food-scanner': 'text-health-emerald bg-health-emerald/10',
  'fitness-agent': 'text-primary bg-primary/10',
};

const featureLabels = {
  'symptom-checker': 'Symptom Check',
  'health-reports': 'Health Report',
  'food-scanner': 'Food Scan',
  'fitness-agent': 'Fitness Plan',
};

export function AnalysisHistoryCard({ history, onDelete, loading }: AnalysisHistoryCardProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistoryItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleItemClick = (item: AnalysisHistoryItem) => {
    setSelectedAnalysis(item);
    setModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-10 h-10 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No analysis history yet</p>
            <p className="text-sm">Your health analysis will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Analysis
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              Auto-deletes after 30 days
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {history.slice(0, 10).map((item, index) => {
              const Icon = featureIcons[item.feature_type];
              const colorClass = featureColors[item.feature_type];
              const label = featureLabels[item.feature_type];
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleItemClick(item)}
                  className="group flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                      </span>
                    </div>
                    <p className="font-medium text-foreground truncate">{item.title}</p>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.summary}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AnalysisDetailModal
        analysis={selectedAnalysis}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
