"use client";

import {
  BackgroundElements,
  HeroSection,
  FeaturesSection,
  PhoneShowcase,
  FAQSection,
  Footer,
  SectionDivider,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background with proper colors and gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent via-70% to-background" />
        <div className="absolute top-0 right-0 left-0 h-[80vh] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      </div>

      <BackgroundElements />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center p-6">
        <HeroSection />
      </section>

      {/* Divider */}
      <SectionDivider variant="wave" />

      {/* Features Section */}
      <section className="relative flex items-center justify-center">
        <FeaturesSection />
      </section>

      {/* Divider */}
      <SectionDivider variant="default" />

      {/* Phone Showcase Section */}
      <section className="relative flex items-center justify-center">
        <PhoneShowcase />
      </section>

      {/* Divider */}
      <SectionDivider variant="dots" />

      {/* FAQ Section */}
      <section className="relative flex items-center justify-center">
        <FAQSection />
      </section>

      {/* Divider */}
      <SectionDivider variant="default" />

      {/* Footer */}
      <Footer />
    </div>
  );
}