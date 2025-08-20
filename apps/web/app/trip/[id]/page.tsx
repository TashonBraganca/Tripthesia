import { TripPlanner } from "@/components/trip-planner";

export const metadata = {
  title: "Trip Planner",
  description: "Edit and customize your travel itinerary",
};

interface TripPageProps {
  params: {
    id: string;
  };
}

export default function TripPage({ params }: TripPageProps) {
  return <TripPlanner tripId={params.id} />;
}