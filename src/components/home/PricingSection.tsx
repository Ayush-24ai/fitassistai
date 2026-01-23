import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Get started with essential health tools",
    features: [
      "One-time guest access to any feature",
      "Basic symptom guidance",
      "Emergency detection alerts",
      "Doctor specialization suggestions",
      "Health tips & facts",
    ],
    cta: "Get Started Free",
    href: "/signup",
    variant: "hero-outline" as const,
  },
  {
    name: "Pro",
    price: "0",
    originalPrice: "3",
    description: "Unlock your full health potential",
    features: [
      "Unlimited access to all features",
      "Personal AI Fitness Agent",
      "Calorie tracking & analysis",
      "BMI & body composition analysis",
      "Personalized diet plans",
      "Custom workout recommendations",
      "Health & fitness history",
      "Priority support",
    ],
    cta: "Get Pro Free – Limited Time!",
    href: "/upgrade",
    variant: "pro" as const,
    popular: true,
    limitedOffer: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent{" "}
            <span className="text-gradient-health">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your health journey. 
            Upgrade anytime to unlock premium features.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative p-8 rounded-2xl ${
                plan.popular 
                  ? "bg-card border-2 border-primary shadow-health-xl" 
                  : "bg-card border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full pro-gradient text-sm font-medium text-primary-foreground flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  {plan.limitedOffer ? "🎉 Limited Time Offer" : "Most Popular"}
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  {plan.originalPrice && (
                    <span className="text-2xl text-muted-foreground line-through mr-2">
                      ${plan.originalPrice}
                    </span>
                  )}
                  <span className="text-4xl font-bold text-foreground">
                    ${plan.price}
                  </span>
                  {plan.originalPrice && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
                {plan.limitedOffer && (
                  <span className="inline-block px-3 py-1 rounded-full bg-health-success/10 text-health-success text-xs font-medium">
                    FREE for early users!
                  </span>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-health-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-health-success" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to={plan.href}>
                <Button variant={plan.variant} size="lg" className="w-full">
                  {plan.popular && <Sparkles className="w-4 h-4 mr-2" />}
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          All plans include our core medical disclaimer and professional consultation recommendations.
        </motion.p>
      </div>
    </section>
  );
}
