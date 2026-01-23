import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Brain, ChartLine, Heart, Shield, Sparkles, ArrowRight, Check, Crown } from "lucide-react";
export function HeroSection() {
  return <section className="relative min-h-[90vh] flex items-center hero-gradient overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-health-teal/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-health-emerald/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-health-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Health & Fitness
            </div>
          </motion.div>

          <motion.h1 initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.1
        }} className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            <span className="text-primary">Fitness Assist</span> —{" "}
            <span className="text-primary">
              Your Personal AI Health & Fitness Platform
            </span>
          </motion.h1>

          <motion.p initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.2
        }} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered health insights, fitness planning, and wellness guidance — built for real life.
          </motion.p>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.3
        }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link to="/upgrade">
              <Button variant="pro" size="xl" className="w-full sm:w-auto">
                <Crown className="w-5 h-5 mr-1" />
                Get Pro Free – Limited Offer!
              </Button>
            </Link>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.4
        }} className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[{
            icon: Heart,
            label: "Symptom Analysis"
          }, {
            icon: ChartLine,
            label: "Health Reports"
          }, {
            icon: Brain,
            label: "AI Guidance"
          }, {
            icon: Shield,
            label: "Privacy First"
          }].map((item, index) => <div key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-xl backdrop-blur-sm border border-border/50 bg-secondary">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
              </div>)}
          </motion.div>
        </div>
      </div>
    </section>;
}