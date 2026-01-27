import { LandingLayout } from "../components/layout/LandingLayout";
import { HeroSection } from "../components/landing/HeroSection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { UseCasesSection } from "../components/landing/UseCasesSection";
import { TechStackSection } from "../components/landing/TechStackSection";
import { CTASection } from "../components/landing/CTASection";

export function LandingPage() {
    return (
        <LandingLayout>
            <HeroSection />
            <FeaturesSection />
            <HowItWorksSection />
            <UseCasesSection />
            <TechStackSection />
            <CTASection />
        </LandingLayout>
    );
}
