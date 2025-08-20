import { SharedTrip } from "@/components/shared-trip";

export const metadata = {
  title: "Shared Trip",
  description: "View a shared travel itinerary",
};

interface SharedTripPageProps {
  params: {
    token: string;
  };
}

export default function SharedTripPage({ params }: SharedTripPageProps) {
  return <SharedTrip token={params.token} />;
}