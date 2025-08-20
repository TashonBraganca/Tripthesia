import { EnhancedTripWizard } from "@/components/enhanced-trip-wizard";

export const metadata = {
  title: "Plan New Trip",
  description: "Create a new AI-powered travel itinerary",
};

export default function NewTripPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Plan Your Perfect Trip
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tell us about your dream destination and we'll create a personalized itinerary with real prices and booking links in seconds.
          </p>
        </div>
        <EnhancedTripWizard />
      </div>
    </div>
  );
}