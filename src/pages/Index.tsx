import { PageLayout } from "@/components/layout/PageLayout";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { PricingSection } from "@/components/home/PricingSection";
import { FAQSection } from "@/components/home/FAQSection";
import { HealthTipsSection } from "@/components/home/HealthTipsSection";

const Index = () => {
  return (
    <PageLayout>
      <HeroSection />
      <FeaturesSection />
      <HealthTipsSection />
      <PricingSection />
      <FAQSection />
    </PageLayout>
  );
};

export default Index;
