import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const cities = [
  {
    name: "Tokyo",
    country: "Japan",
    description: "Ancient temples, modern skyscrapers, and incredible food",
    image: "/images/tokyo.jpg",
  },
  {
    name: "Paris", 
    country: "France",
    description: "Art, culture, and romance in the City of Light",
    image: "/images/paris.jpg",
  },
  {
    name: "Barcelona",
    country: "Spain", 
    description: "Gaudí architecture, beaches, and vibrant nightlife",
    image: "/images/barcelona.jpg",
  },
];

export function CityPacks() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Popular Destinations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our most loved city packs with curated experiences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cities.map((city) => (
            <Card key={city.name} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
              <CardHeader>
                <CardTitle>{city.name}, {city.country}</CardTitle>
                <CardDescription>
                  {city.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}