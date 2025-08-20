import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../schema";
import { places } from "../schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// Popular travel destinations with coordinates
const popularDestinations = [
  {
    name: "Times Square",
    description: "The bustling commercial intersection and entertainment center of Midtown Manhattan",
    address: "Times Square, New York, NY 10036, USA",
    city: "New York",
    country: "USA",
    coords: "POINT(-73.985130 40.758896)", // lng lat for PostGIS
    category: "landmark",
    rating: 4.2,
    priceLevel: 3,
    photoUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800",
    website: "https://www.timessquarenyc.org",
    hours: "24/7",
    tags: ["landmark", "entertainment", "shopping", "broadway"]
  },
  {
    name: "Central Park",
    description: "An urban park in Manhattan, New York City, located between the Upper West and Upper East Sides",
    address: "Central Park, New York, NY, USA",
    city: "New York",
    country: "USA",
    coords: "POINT(-73.965355 40.782865)",
    category: "park",
    rating: 4.7,
    priceLevel: 1,
    photoUrl: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800",
    website: "https://www.centralparknyc.org",
    hours: "6:00 AM - 1:00 AM",
    tags: ["park", "nature", "recreation", "family"]
  },
  {
    name: "Statue of Liberty",
    description: "A colossal neoclassical sculpture on Liberty Island in New York Harbor",
    address: "Liberty Island, New York, NY 10004, USA",
    city: "New York",
    country: "USA",
    coords: "POINT(-74.044502 40.689247)",
    category: "landmark",
    rating: 4.6,
    priceLevel: 2,
    photoUrl: "https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=800",
    website: "https://www.nps.gov/stli",
    hours: "9:00 AM - 5:00 PM",
    tags: ["landmark", "history", "museum", "monument"]
  },
  {
    name: "Eiffel Tower",
    description: "A wrought-iron lattice tower on the Champ de Mars in Paris, France",
    address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
    city: "Paris",
    country: "France",
    coords: "POINT(2.294481 48.858370)",
    category: "landmark",
    rating: 4.6,
    priceLevel: 2,
    photoUrl: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800",
    website: "https://www.toureiffel.paris",
    hours: "9:30 AM - 11:45 PM",
    tags: ["landmark", "tower", "observation", "romantic"]
  },
  {
    name: "Louvre Museum",
    description: "The world's largest art museum and a historic monument in Paris, France",
    address: "Rue de Rivoli, 75001 Paris, France",
    city: "Paris",
    country: "France",
    coords: "POINT(2.337644 48.860611)",
    category: "museum",
    rating: 4.7,
    priceLevel: 3,
    photoUrl: "https://images.unsplash.com/photo-1566139919105-fdb95c7b1b52?w=800",
    website: "https://www.louvre.fr",
    hours: "9:00 AM - 6:00 PM",
    tags: ["museum", "art", "culture", "history"]
  },
  {
    name: "Big Ben",
    description: "The nickname for the Great Bell of the striking clock at the north end of the Palace of Westminster",
    address: "Westminster, London SW1A 0AA, UK",
    city: "London",
    country: "UK",
    coords: "POINT(-0.124629 51.500729)",
    category: "landmark",
    rating: 4.5,
    priceLevel: 1,
    photoUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800",
    website: "https://www.parliament.uk",
    hours: "External viewing 24/7",
    tags: ["landmark", "clock", "parliament", "history"]
  },
  {
    name: "Tower Bridge",
    description: "A combined bascule and suspension bridge in London built between 1886 and 1894",
    address: "Tower Bridge Rd, London SE1 2UP, UK",
    city: "London",
    country: "UK",
    coords: "POINT(-0.075406 51.505455)",
    category: "landmark",
    rating: 4.6,
    priceLevel: 2,
    photoUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800",
    website: "https://www.towerbridge.org.uk",
    hours: "10:00 AM - 5:30 PM",
    tags: ["landmark", "bridge", "history", "views"]
  },
  {
    name: "Colosseum",
    description: "An oval amphitheatre in the centre of the city of Rome, Italy",
    address: "Piazza del Colosseo, 1, 00184 Roma RM, Italy",
    city: "Rome",
    country: "Italy",
    coords: "POINT(12.492231 41.890251)",
    category: "landmark",
    rating: 4.6,
    priceLevel: 2,
    photoUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800",
    website: "https://parcocolosseo.it",
    hours: "8:30 AM - 7:00 PM",
    tags: ["landmark", "history", "ancient", "architecture"]
  },
  {
    name: "Trevi Fountain",
    description: "A fountain in the Quirinale district in Rome, Italy, designed by Italian architect Nicola Salvi",
    address: "Piazza di Trevi, 00187 Roma RM, Italy",
    city: "Rome",
    country: "Italy",
    coords: "POINT(12.483313 41.900865)",
    category: "landmark",
    rating: 4.5,
    priceLevel: 1,
    photoUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800",
    website: null,
    hours: "24/7",
    tags: ["landmark", "fountain", "romantic", "wishes"]
  },
  {
    name: "Tokyo Tower",
    description: "A communications and observation tower in the Minato district of Tokyo, Japan",
    address: "4 Chome-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan",
    city: "Tokyo",
    country: "Japan",
    coords: "POINT(139.745433 35.658581)",
    category: "landmark",
    rating: 4.3,
    priceLevel: 2,
    photoUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    website: "https://www.tokyotower.co.jp",
    hours: "9:00 AM - 11:00 PM",
    tags: ["landmark", "tower", "observation", "technology"]
  },
  {
    name: "Senso-ji Temple",
    description: "An ancient Buddhist temple located in Asakusa, Tokyo, Japan",
    address: "2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan",
    city: "Tokyo",
    country: "Japan",
    coords: "POINT(139.796654 35.714765)",
    category: "temple",
    rating: 4.4,
    priceLevel: 1,
    photoUrl: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800",
    website: "https://www.senso-ji.jp",
    hours: "6:00 AM - 5:00 PM",
    tags: ["temple", "culture", "spiritual", "traditional"]
  },
  {
    name: "Sydney Opera House",
    description: "A multi-venue performing arts centre at Sydney Harbour in Sydney, Australia",
    address: "Bennelong Point, Sydney NSW 2000, Australia",
    city: "Sydney",
    country: "Australia",
    coords: "POINT(151.215297 -33.856784)",
    category: "landmark",
    rating: 4.7,
    priceLevel: 3,
    photoUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    website: "https://www.sydneyoperahouse.com",
    hours: "Varies by performance",
    tags: ["landmark", "opera", "architecture", "harbor"]
  },
  {
    name: "Bondi Beach",
    description: "A popular beach and the name of the surrounding suburb in Sydney, Australia",
    address: "Bondi Beach NSW 2026, Australia",
    city: "Sydney",
    country: "Australia",
    coords: "POINT(151.274834 -33.890542)",
    category: "beach",
    rating: 4.5,
    priceLevel: 1,
    photoUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    website: "https://www.waverley.nsw.gov.au",
    hours: "24/7",
    tags: ["beach", "surfing", "swimming", "coastal"]
  }
];

// Restaurant and dining examples
const restaurantExamples = [
  {
    name: "Joe's Pizza",
    description: "Classic New York style pizza since 1975",
    address: "7 Carmine St, New York, NY 10014, USA",
    city: "New York",
    country: "USA",
    coords: "POINT(-74.002863 40.730824)",
    category: "restaurant",
    rating: 4.3,
    priceLevel: 2,
    photoUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
    website: "https://www.joespizzanyc.com",
    hours: "10:00 AM - 4:00 AM",
    tags: ["pizza", "casual", "iconic", "late-night"]
  },
  {
    name: "The French Laundry",
    description: "Three-Michelin-starred French restaurant in Napa Valley",
    address: "6640 Washington St, Yountville, CA 94599, USA",
    city: "Napa Valley",
    country: "USA",
    coords: "POINT(-122.361506 38.401668)",
    category: "restaurant",
    rating: 4.8,
    priceLevel: 4,
    photoUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    website: "https://www.thomaskeller.com",
    hours: "5:30 PM - 9:00 PM",
    tags: ["fine-dining", "michelin", "french", "wine"]
  }
];

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Check if data already exists to avoid duplicates
    const existingPlaces = await db.select().from(places).limit(5);
    if (existingPlaces.length > 0) {
      console.log("📍 Places already exist, skipping seed...");
      return;
    }

    // Add popular destinations
    console.log("📍 Seeding popular destinations...");
    
    for (const destination of popularDestinations) {
      try {
        await db.insert(places).values({
          name: destination.name,
          description: destination.description,
          address: destination.address,
          city: destination.city,
          country: destination.country,
          coords: destination.coords,
          category: destination.category,
          rating: destination.rating,
          priceLevel: destination.priceLevel,
          photoUrl: destination.photoUrl,
          website: destination.website,
          hours: destination.hours,
          tags: destination.tags,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`  ✅ Added ${destination.name}`);
      } catch (error) {
        console.error(`  ❌ Failed to add ${destination.name}:`, error);
      }
    }
    
    // Add restaurant examples
    console.log("🍽️ Seeding restaurant examples...");
    
    for (const restaurant of restaurantExamples) {
      try {
        await db.insert(places).values({
          name: restaurant.name,
          description: restaurant.description,
          address: restaurant.address,
          city: restaurant.city,
          country: restaurant.country,
          coords: restaurant.coords,
          category: restaurant.category,
          rating: restaurant.rating,
          priceLevel: restaurant.priceLevel,
          photoUrl: restaurant.photoUrl,
          website: restaurant.website,
          hours: restaurant.hours,
          tags: restaurant.tags,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`  ✅ Added ${restaurant.name}`);
      } catch (error) {
        console.error(`  ❌ Failed to add ${restaurant.name}:`, error);
      }
    }
    
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log("🎉 Seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

// Export the seed function for use in other scripts
export { seed };