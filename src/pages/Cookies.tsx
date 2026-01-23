import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CookiePolicy() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

          <div className="prose prose-slate max-w-none">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>What Are Cookies?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Cookies are small text files stored on your device when you visit websites. They help websites remember your preferences and improve your experience.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>How We Use Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Essential Cookies:</strong> Required for the app to function properly. These include authentication tokens and session management.
                </p>
                <p>
                  <strong className="text-foreground">Functional Cookies:</strong> Remember your preferences such as language settings and feature choices.
                </p>
                <p>
                  <strong className="text-foreground">Analytics Cookies:</strong> Help us understand how users interact with our app so we can improve our services. This data is anonymized.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Third-Party Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We use the following third-party services that may set cookies:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-foreground">Stripe:</strong> For secure payment processing</li>
                  <li><strong className="text-foreground">Analytics:</strong> To understand app usage patterns</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Managing Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  You can control cookies through your browser settings. However, disabling essential cookies may affect app functionality.
                </p>
                <p>
                  Most browsers allow you to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>View what cookies are stored</li>
                  <li>Delete cookies individually or all at once</li>
                  <li>Block third-party cookies</li>
                  <li>Block all cookies from specific sites</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  For questions about our cookie policy, contact us at:
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
