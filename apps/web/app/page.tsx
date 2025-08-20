import { InteractiveHero } from "@/components/interactive-hero";
import { CityPacks } from "@/components/city-packs";
import { HowItWorks } from "@/components/how-it-works";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <InteractiveHero />
      <HowItWorks />
      <CityPacks />
      <Footer />
    </div>
  );
}