import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, FileText, Camera, Brain } from "lucide-react";

interface StatsGridProps {
  stats: {
    total: number;
    byFeature: Record<string, number>;
  };
}

const statItems = [
  { key: 'symptom-checker', label: 'Symptom Checks', icon: Activity, color: 'text-health-teal' },
  { key: 'health-reports', label: 'Report Analyses', icon: FileText, color: 'text-health-blue' },
  { key: 'food-scanner', label: 'Food Scans', icon: Camera, color: 'text-health-emerald' },
  { key: 'fitness-agent', label: 'Fitness Plans', icon: Brain, color: 'text-primary' },
];

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`${item.color} opacity-80`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.byFeature[item.key] || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
