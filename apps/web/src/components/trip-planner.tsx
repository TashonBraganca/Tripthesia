"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TripTimeline } from "@/components/trip-timeline";
import { TripMap } from "@/components/trip-map";
import { ExportDialog } from "@/components/export-dialog";
import { ShareDialog } from "@/components/share-dialog";
import { ErrorBoundary, MapErrorFallback } from "@/components/error-boundary";
import { NetworkStatus, OfflineFallback } from "@/components/network-status";
import { TimelineLoading, MapLoading } from "@/components/loading-states";
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Share2, 
  Download, 
  Edit,
  Map,
  List,
  Settings
} from "lucide-react";

interface Trip {
  id: string;
  name: string;
  destination: {
    name: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  dates: {
    from: Date;
    to: Date;
  };
  travelers: {
    adults: number;
    children: number;
  };
  budget: {
    amount: number;
    currency: string;
  };
  status: "planning" | "confirmed" | "completed";
  days: Array<{
    date: string;
    activities: Array<{
      id: string;
      name: string;
      description: string;
      location: {
        name: string;
        address: string;
        coordinates: { lat: number; lng: number };
      };
      duration: number;
      cost: {
        amount: number;
        currency: string;
        priceRange: "free" | "budget" | "moderate" | "expensive";
      };
      category: string;
      rating?: number;
      timeSlot: {
        start: string;
        end: string;
      };
      isLocked: boolean;
    }>;
  }>;
}

interface TripPlannerProps {
  trip: Trip;
}

export function TripPlanner({ trip }: TripPlannerProps) {
  const [days, setDays] = useState(trip.days);
  const [activeView, setActiveView] = useState("timeline");
  const [activeDay, setActiveDay] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredActivity, setHoveredActivity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleUpdateDays = (updatedDays: typeof days) => {
    setDays(updatedDays);
    console.log("Updated itinerary:", updatedDays);
  };

  const handleActivityClick = (activityId: string) => {
    console.log("Activity clicked:", activityId);
    // TODO: Add activity details modal or scroll to activity in timeline
  };

  const getTotalCost = () => {
    return days.reduce((total, day) => 
      total + day.activities.reduce((dayTotal, activity) => 
        dayTotal + activity.cost.amount, 0
      ), 0
    );
  };

  const getDuration = () => {
    const start = new Date(trip.dates.from);
    const end = new Date(trip.dates.to);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-blue-100 text-blue-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Status */}
      <NetworkStatus />
      
      {/* Trip Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{trip.name}</h1>
            <p className="text-muted-foreground mt-1">
              {trip.destination.name}, {trip.destination.country}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(trip.status)}>
              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </Badge>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="mr-2 h-4 w-4" />
              {isEditing ? "Done" : "Edit"}
            </Button>
            
            <ShareDialog 
              tripId={trip.id} 
              tripTitle={trip.name}
            >
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </ShareDialog>
            
            <ExportDialog 
              tripId={trip.id} 
              tripTitle={trip.name}
            >
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </ExportDialog>
          </div>
        </div>

        {/* Trip Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{getDuration()} Days</p>
                  <p className="text-xs text-muted-foreground">
                    {trip.dates.from.toLocaleDateString()} - {trip.dates.to.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {trip.travelers.adults + trip.travelers.children} Travelers
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trip.travelers.adults} adults{trip.travelers.children > 0 && `, ${trip.travelers.children} children`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    ${getTotalCost().toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of ${trip.budget.amount.toLocaleString()} budget
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {days.reduce((total, day) => total + day.activities.length, 0)} Activities
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Across {days.length} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Map View
          </TabsTrigger>
          <TabsTrigger value="split" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <Map className="h-4 w-4" />
            Split View
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Itinerary</CardTitle>
              {isEditing && (
                <p className="text-sm text-muted-foreground">
                  Drag activities to reorder them. Click the lock icon to prevent an activity from being moved.
                </p>
              )}
            </CardHeader>
            <CardContent>
              <OfflineFallback message="Timeline editing requires an internet connection.">
                <ErrorBoundary>
                  {isLoading ? (
                    <TimelineLoading />
                  ) : (
                    <TripTimeline 
                      days={days} 
                      onUpdateDays={handleUpdateDays}
                      isEditable={isEditing}
                      onActivityHover={setHoveredActivity}
                    />
                  )}
                </ErrorBoundary>
              </OfflineFallback>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Map View</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ErrorBoundary fallback={MapErrorFallback}>
                {!mapLoaded ? (
                  <MapLoading />
                ) : (
                  <TripMap 
                    days={days}
                    activeDay={activeDay}
                    hoveredActivity={hoveredActivity}
                    onActivityClick={handleActivityClick}
                    onMapLoad={() => setMapLoaded(true)}
                    className="h-[600px] border-0"
                  />
                )}
              </ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="split" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
            {/* Timeline Panel */}
            <Card className="flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Timeline</CardTitle>
                {isEditing && (
                  <p className="text-sm text-muted-foreground">
                    Drag activities to reorder them.
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-grow overflow-auto">
                <ErrorBoundary>
                  {isLoading ? (
                    <TimelineLoading />
                  ) : (
                    <TripTimeline 
                      days={days} 
                      onUpdateDays={handleUpdateDays}
                      isEditable={isEditing}
                      onActivityHover={setHoveredActivity}
                      activeDay={activeDay}
                      onDayChange={setActiveDay}
                    />
                  )}
                </ErrorBoundary>
              </CardContent>
            </Card>

            {/* Map Panel */}
            <Card className="flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Interactive Map</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-0">
                <ErrorBoundary fallback={MapErrorFallback}>
                  {!mapLoaded ? (
                    <div className="h-full">
                      <MapLoading />
                    </div>
                  ) : (
                    <TripMap 
                      days={days}
                      activeDay={activeDay}
                      hoveredActivity={hoveredActivity}
                      onActivityClick={handleActivityClick}
                      onMapLoad={() => setMapLoaded(true)}
                      className="h-full border-0 rounded-none"
                    />
                  )}
                </ErrorBoundary>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trip Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Preferences</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Modify your trip preferences and regenerate the itinerary
                  </p>
                  <Button variant="outline">
                    Edit Preferences
                  </Button>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">AI Suggestions</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get AI-powered suggestions for improving your itinerary
                  </p>
                  <Button variant="outline">
                    Get Suggestions
                  </Button>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Sharing</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your trip with friends or make it public
                  </p>
                  <Button variant="outline">
                    Manage Sharing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}