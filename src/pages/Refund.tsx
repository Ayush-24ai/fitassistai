import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RefundPolicy() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Refund & Cancellation Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

          <div className="prose prose-slate max-w-none">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Subscription Cancellation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  You may cancel your Fitness Assist Pro subscription at any time through your account settings or by contacting our support team.
                </p>
                <p>
                  When you cancel:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your subscription will remain active until the end of your current billing period</li>
                  <li>You will not be charged for the next billing cycle</li>
                  <li>You retain access to Pro features until your period ends</li>
                  <li>After cancellation, your account reverts to the Free plan</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Refund Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">General Policy:</strong> We do not provide refunds for partial subscription periods. When you cancel, you continue to have access until your current period ends.
                </p>
                <p>
                  <strong className="text-foreground">Exceptions:</strong> Refunds may be considered in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Technical issues that prevented you from accessing the service for an extended period</li>
                  <li>Duplicate charges or billing errors</li>
                  <li>Unauthorized transactions (subject to verification)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>How to Request a Refund</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  To request a refund for eligible circumstances:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Contact our support team at <strong className="text-foreground">support@fitnessassist.com</strong></li>
                  <li>Include your account email and reason for the refund request</li>
                  <li>Provide any relevant details (e.g., billing errors, technical issues)</li>
                  <li>Our team will review and respond within 3-5 business days</li>
                </ol>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Processing Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  If approved, refunds are processed within 5-10 business days. The time for the refund to appear in your account depends on your payment provider.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  For billing or refund questions, contact us at:
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
