import { motion } from "framer-motion";
import { 
  Activity, 
  Apple, 
  Brain, 
  Calculator, 
  ClipboardList, 
  Dumbbell,
  FileText,
  Heart,
  LineChart,
  Shield,
  Sparkles,
  Stethoscope,
  Target,
  Utensils,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Stethoscope,
    title: "Symptom Checker",
    description: "Describe your symptoms in natural language and receive AI-powered guidance on severity and appropriate care.",
    color: "health-teal",
  },
  {
    icon: FileText,
    title: "Health Report Analysis",
    description: "Input your lab values and get clear explanations of what's high, low, or normal with actionable guidance.",
    color: "health-blue",
  },
  {
    icon: Brain,
    title: "AI Fitness Agent",
    description: "Your personal AI trainer that creates custom workout and diet plans based on your goals and body type.",
    color: "health-emerald",
    pro: true,
  },
  {
    icon: Calculator,
    title: "BMI & Body Analysis",
    description: "Calculate your BMI, body classification, and get personalized recommendations for your fitness journey.",
    color: "health-teal",
    pro: true,
  },
  {
    icon: Utensils,
    title: "Personalized Diet Plans",
    description: "Get custom meal plans tailored to your calorie goals, dietary preferences, and health objectives.",
    color: "health-blue",
    pro: true,
  },
  {
    icon: Dumbbell,
    title: "Workout Recommendations",
    description: "Receive exercise routines designed for your fitness level, available equipment, and target areas.",
    color: "health-emerald",
    pro: true,
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    description: "Monitor your health and fitness journey with visual charts and milestone tracking.",
    color: "health-teal",
    pro: true,
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description: "Your health data is encrypted and never shared. We prioritize your privacy and data security.",
    color: "health-blue",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need for{" "}
            <span className="text-gradient-health">Better Health</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive AI-powered tools to help you understand your health, 
            plan your fitness journey, and achieve your wellness goals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-health-lg transition-all duration-300"
            >
              {feature.pro && (
                <div className="absolute top-4 right-4 px-2 py-1 rounded-full pro-gradient text-xs font-medium text-primary-foreground">
                  PRO
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
