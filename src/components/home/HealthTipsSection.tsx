import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Lightbulb, Heart, Dumbbell, Apple, Brain, Moon } from "lucide-react";

const healthTips = [
  {
    icon: Heart,
    category: "Heart Health",
    tip: "Walking just 30 minutes a day can reduce your risk of heart disease by up to 35%.",
    color: "health-danger",
  },
  {
    icon: Apple,
    category: "Nutrition",
    tip: "Eating 5 servings of fruits and vegetables daily provides essential vitamins and fiber for optimal health.",
    color: "health-success",
  },
  {
    icon: Dumbbell,
    category: "Fitness",
    tip: "Strength training twice a week helps maintain muscle mass and boosts metabolism as you age.",
    color: "health-teal",
  },
  {
    icon: Brain,
    category: "Mental Health",
    tip: "Regular physical activity releases endorphins that naturally reduce stress and improve mood.",
    color: "health-blue",
  },
  {
    icon: Moon,
    category: "Sleep",
    tip: "Adults need 7-9 hours of quality sleep. Consistent sleep schedules improve overall health.",
    color: "health-emerald",
  },
  {
    icon: Lightbulb,
    category: "Wellness",
    tip: "Staying hydrated improves energy, brain function, and helps maintain healthy skin.",
    color: "health-warning",
  },
];

const healthFacts = [
  "Your heart beats about 100,000 times per day, pumping around 2,000 gallons of blood.",
  "The human body contains around 60,000 miles of blood vessels.",
  "Your brain uses about 20% of your body's total energy, even at rest.",
  "Regular exercise can increase your life expectancy by up to 7 years.",
  "Muscle tissue burns more calories at rest than fat tissue does.",
];

export function HealthTipsSection() {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % healthFacts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Daily Health{" "}
            <span className="text-gradient-health">Tips & Facts</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Evidence-based tips and fascinating facts to inspire your wellness journey.
          </p>
        </motion.div>

        {/* Health Fact Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="relative overflow-hidden rounded-2xl health-gradient p-6 text-center">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
            <div className="relative z-10">
              <div className="text-primary-foreground/80 text-sm font-medium mb-2">
                Did You Know?
              </div>
              <motion.p
                key={currentFactIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-primary-foreground text-lg font-medium"
              >
                {healthFacts[currentFactIndex]}
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {healthTips.map((item, index) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-xl bg-card border border-border hover:shadow-health-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg bg-${item.color}/10 flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`w-5 h-5 text-${item.color}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    {item.category}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.tip}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
