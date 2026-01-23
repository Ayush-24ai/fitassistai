import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

          <div className="prose prose-slate max-w-none">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>1. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Account Information:</strong> When you create an account, we collect your name, email address, and password (encrypted).
                </p>
                <p>
                  <strong className="text-foreground">Health Data:</strong> Information you voluntarily provide such as symptoms, lab values, fitness metrics, and health goals. This data is used solely to provide personalized guidance.
                </p>
                <p>
                  <strong className="text-foreground">Usage Data:</strong> We collect analytics on how you use our app to improve our services, including pages visited and features used.
                </p>
                <p>
                  <strong className="text-foreground">Payment Information:</strong> Payment details are processed securely by Stripe. We do not store your full credit card information.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>2. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <ul className="list-disc pl-6 space-y-2">
                  <li>To provide personalized health and fitness guidance</li>
                  <li>To process your subscription and payments</li>
                  <li>To improve our AI algorithms and user experience</li>
                  <li>To communicate with you about your account and updates</li>
                  <li>To ensure the security of our platform</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>3. Health Data Disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Important:</strong> Fitness Assist does not provide medical diagnosis, treatment, or professional medical advice. Our AI provides general health information for educational purposes only.
                </p>
                <p>
                  We are not a healthcare provider. Always consult qualified healthcare professionals for medical advice, diagnosis, or treatment decisions.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>4. Data Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All data is encrypted in transit using TLS/SSL</li>
                  <li>Sensitive data is encrypted at rest</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Strict access controls for our team</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>5. Data Sharing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We do not sell your personal information to third parties. We may share data with:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-foreground">Service Providers:</strong> Stripe for payments, hosting providers for infrastructure</li>
                  <li><strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong className="text-foreground">With Your Consent:</strong> For any other purpose with your explicit permission</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>6. Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Delete your account and data</li>
                  <li>Export your data</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
                <p>
                  To exercise these rights, contact us at <strong className="text-foreground">support@fitnessassist.com</strong>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  For privacy-related questions or concerns, contact us at:
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
