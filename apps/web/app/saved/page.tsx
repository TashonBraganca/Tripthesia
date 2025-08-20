import { SavedTrips } from "@/components/saved-trips";

export const metadata = {
  title: "Saved Trips",
  description: "View and manage your saved travel itineraries",
};

export default function SavedTripsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Your Trips</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your saved itineraries and plan new adventures
        </p>
      </div>
      <SavedTrips />
    </div>
  );
}