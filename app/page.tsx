import { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { ResumePlanning } from "@/components/marketing/resume-planning";
import { BentoFeatures } from "@/components/marketing/bento-features";
import { Pricing } from "@/components/marketing/pricing";
import { Testimonials } from "@/components/marketing/testimonials";
import { CTA } from "@/components/marketing/cta";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Tripthesia - Create Perfect Travel Itineraries in Seconds",
  description: "Generate personalized travel itineraries instantly. Real prices, availability, and booking links. Plan your perfect trip in seconds.",
};

export default function HomePage() {
  try {
    return (
      <>
        <Navbar />
        <main>
          <Hero />
          <ResumePlanning />
          <BentoFeatures />
          <Testimonials />
          <Pricing />
          <CTA />
        </main>
        <Footer />
      </>
    );
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tripthesia</h1>
          <p>Loading homepage...</p>
          <a href="/test" className="text-blue-400 underline mt-4 block">Test Page</a>
        </div>
      </div>
    );
  }
}