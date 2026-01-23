import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

          <div className="prose prose-slate max-w-none">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  By accessing or using Fitness Assist, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>2. Medical Disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p className="font-semibold text-health-danger">
                  IMPORTANT: Fitness Assist does not provide medical diagnosis, treatment, or professional medical advice.
                </p>
                <p>
                  Our AI-powered tools provide general health and fitness information for educational purposes only. This information is not a substitute for professional medical advice, diagnosis, or treatment.
                </p>
                <p>
                  Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of something you have read on Fitness Assist.
                </p>
                <p>
                  If you think you may have a medical emergency, call your doctor, go to the emergency department, or call emergency services immediately.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>3. User Responsibilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>By using Fitness Assist, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate information when using our services</li>
                  <li>Not rely solely on our AI for medical decisions</li>
                  <li>Consult healthcare professionals for medical concerns</li>
                  <li>Use the service for lawful purposes only</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Not attempt to reverse engineer or misuse our AI systems</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>4. Subscription Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Pro Plan:</strong> The Pro subscription costs $3/month and provides unlimited access to all features.
                </p>
                <p>
                  <strong className="text-foreground">Billing:</strong> Subscriptions are billed monthly. Your payment method will be charged automatically on your billing date.
                </p>
                <p>
                  <strong className="text-foreground">Cancellation:</strong> You may cancel your subscription at any time through your account settings. Access continues until the end of your current billing period.
                </p>
                <p>
                  <strong className="text-foreground">Free Trial:</strong> Guest users may use any single feature once without an account. After this, registration is required.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>5. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  To the maximum extent permitted by law, Fitness Assist and its affiliates shall not be liable for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Any indirect, incidental, special, or consequential damages</li>
                  <li>Any damages arising from medical decisions made using our guidance</li>
                  <li>Any loss of data, profits, or business opportunities</li>
                  <li>Any damages exceeding the amount you paid us in the past 12 months</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>6. Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  All content, features, and functionality of Fitness Assist are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>7. Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We may update these Terms from time to time. We will notify you of material changes by email or through our app. Continued use after changes constitutes acceptance.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Contact</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  For questions about these Terms, contact us at:
                  <br />
                  <strong className="text-foreground">support@fitnessassist.com</strong>
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
