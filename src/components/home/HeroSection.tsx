import { motion, type Transition } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, ChartLine, Heart, Shield, Sparkles, ArrowRight, Crown } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    } as Transition,
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    } as Transition,
  },
};

export function HeroSection() {
  const features = [
    { icon: Heart, label: "Symptom Analysis", color: "text-health-danger" },
    { icon: ChartLine, label: "Health Reports", color: "text-health-blue" },
    { icon: Brain, label: "AI Guidance", color: "text-primary" },
    { icon: Shield, label: "Privacy First", color: "text-health-success" },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center hero-gradient overflow-hidden">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-10 w-72 h-72 bg-health-teal/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 left-10 w-96 h-96 bg-health-emerald/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-health-blue/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={itemVariants}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 backdrop-blur-sm border border-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Health & Fitness
            </motion.div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            <span className="text-gradient-health">Fitness Assist</span>
            <span className="text-foreground"> — </span>
            <span className="text-foreground">
              Your Personal AI Health & Fitness Platform
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            AI-powered health insights, fitness planning, and wellness guidance — built for real life.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button variant="hero" size="xl" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </motion.div>
            </Link>
            <Link to="/upgrade">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button variant="pro" size="xl" className="w-full sm:w-auto pro-glow">
                  <Crown className="w-5 h-5 mr-1" />
                  Get Pro Free – Limited Offer!
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto"
          >
            {features.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ y: 0 }}
                animate={{ y: [-5, 5, -5] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.5,
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl backdrop-blur-sm border border-border/50 bg-card/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
