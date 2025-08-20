import { notFound } from "next/navigation";
import { TripPlanner } from "@/components/trip-planner";

interface TripPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: "Trip Planner",
  description: "Plan and customize your travel itinerary",
};

// Mock data for development
const mockTripData = {
  id: "1",
  name: "Tokyo Adventure",
  destination: {
    name: "Tokyo",
    country: "Japan",
    coordinates: { lat: 35.6762, lng: 139.6503 },
  },
  dates: {
    from: new Date("2024-03-15"),
    to: new Date("2024-03-22"),
  },
  travelers: { adults: 2, children: 0 },
  budget: { amount: 3500, currency: "USD" },
  status: "planning" as const,
  days: [
    {
      date: "2024-03-15",
      activities: [
        {
          id: "1",
          name: "Tokyo Station",
          description: "Arrive at Tokyo Station and explore the surrounding area",
          location: {
            name: "Tokyo Station",
            address: "1 Chome Marunouchi, Chiyoda City, Tokyo",
            coordinates: { lat: 35.6812, lng: 139.7671 },
          },
          duration: 120,
          cost: { amount: 0, currency: "USD", priceRange: "free" as const },
          category: "Transportation",
          timeSlot: { start: "10:00", end: "12:00" },
          isLocked: false,
        },
        {
          id: "2", 
          name: "Imperial Palace East Gardens",
          description: "Stroll through the beautiful gardens and learn about Japanese history",
          location: {
            name: "Imperial Palace East Gardens",
            address: "1-1 Chiyoda, Chiyoda City, Tokyo",
            coordinates: { lat: 35.6838, lng: 139.7530 },
          },
          duration: 180,
          cost: { amount: 0, currency: "USD", priceRange: "free" as const },
          category: "Sightseeing",
          rating: 4.5,
          timeSlot: { start: "13:00", end: "16:00" },
          isLocked: false,
        },
        {
          id: "3",
          name: "Ginza Shopping District",
          description: "Explore upscale shopping and dining in Tokyo's luxury district",
          location: {
            name: "Ginza",
            address: "Ginza, Chuo City, Tokyo",
            coordinates: { lat: 35.6719, lng: 139.7658 },
          },
          duration: 240,
          cost: { amount: 150, currency: "USD", priceRange: "expensive" as const },
          category: "Shopping",
          rating: 4.3,
          timeSlot: { start: "16:30", end: "20:30" },
          isLocked: true, // Locked activity
        },
      ],
    },
    {
      date: "2024-03-16",
      activities: [
        {
          id: "4",
          name: "Tsukiji Outer Market",
          description: "Experience the famous fish market and enjoy fresh sushi breakfast",
          location: {
            name: "Tsukiji Outer Market",
            address: "4 Chome Tsukiji, Chuo City, Tokyo",
            coordinates: { lat: 35.6654, lng: 139.7707 },
          },
          duration: 180,
          cost: { amount: 45, currency: "USD", priceRange: "moderate" as const },
          category: "Food",
          rating: 4.7,
          timeSlot: { start: "08:00", end: "11:00" },
          isLocked: false,
        },
        {
          id: "5",
          name: "Senso-ji Temple",
          description: "Visit Tokyo's oldest temple in the historic Asakusa district",
          location: {
            name: "Senso-ji Temple",
            address: "2 Chome-3-1 Asakusa, Taito City, Tokyo",
            coordinates: { lat: 35.7148, lng: 139.7967 },
          },
          duration: 120,
          cost: { amount: 0, currency: "USD", priceRange: "free" as const },
          category: "Cultural",
          rating: 4.6,
          timeSlot: { start: "12:00", end: "14:00" },
          isLocked: false,
        },
      ],
    },
  ],
};

export default function TripPage({ params }: TripPageProps) {
  // In a real app, you would fetch the trip data from your database
  // const trip = await getTripById(params.id);
  
  if (params.id !== "1") {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <TripPlanner trip={mockTripData} />
    </div>
  );
}