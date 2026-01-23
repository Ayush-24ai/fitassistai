import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const faqs = [
  {
    question: "How does Fitness Assist work?",
    answer: "Fitness Assist uses advanced AI to analyze your symptoms, health data, and fitness goals. Simply describe your concerns or input your data, and our AI provides personalized guidance, recommendations, and actionable insights to support your health journey.",
  },
  {
    question: "Is Fitness Assist a replacement for medical advice?",
    answer: "No. Fitness Assist does not provide medical diagnosis or treatment. Our AI offers general health information and guidance only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment decisions.",
  },
  {
    question: "How is my health data protected?",
    answer: "We take your privacy seriously. All health data is encrypted in transit and at rest. We never sell your personal information to third parties. You can delete your data at any time through your account settings. See our Privacy Policy for complete details.",
  },
  {
    question: "What's included in the Pro plan?",
    answer: "Pro members get unlimited access to all features including: Personal AI Fitness Agent, calorie tracking, BMI analysis, personalized diet plans, custom workout recommendations, health history tracking, and priority support — all for just $3/month.",
  },
  {
    question: "Can I try features before signing up?",
    answer: "Yes! You can use any single feature once as a guest without creating an account. After your first use, you'll need to sign up to continue using our services. This lets you experience the value before committing.",
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel your Pro subscription at any time through your account settings. Your access continues until the end of your current billing period. We don't offer partial refunds for unused time, but you keep access until your period ends.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards through our secure Stripe payment system. Your payment information is handled directly by Stripe and never touches our servers for maximum security.",
  },
  {
    question: "Is Fitness Assist available on mobile?",
    answer: "Yes! Fitness Assist is a Progressive Web App (PWA) that works on any device. You can install it on your phone's home screen for an app-like experience on both iOS and Android, with offline support and push notifications.",
  },
];

export function FAQSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="faq" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked{" "}
            <span className="text-gradient-health">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Got questions? We've got answers. Search or browse our FAQ below.
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {filteredFaqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="border border-border rounded-xl overflow-hidden bg-card"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium text-foreground pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-muted-foreground">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No questions found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
