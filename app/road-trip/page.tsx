"use client";

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Map, 
  Route, 
  Navigation, 
  Car, 
  MapPin, 
  Settings,
  Share2,
  Save,
  Download,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Fuel,
  Coffee,
  Bed
} from 'lucide-react';
import InteractiveMapPlanner from '@/components/planning/InteractiveMapPlanner';
import { type RouteResult } from '@/lib/services/google-maps-provider';
import { type POI, type POICategory, POI_CATEGORIES } from '@/lib/services/poi-detector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Waypoint {
  id: string;
  location: { lat: number; lng: number };
  address: string;
  type: 'origin' | 'destination' | 'waypoint';
}

interface TripPreferences {
  vehicleType: 'car' | 'motorcycle' | 'rv' | 'truck';
  travelers: {
    adults: number;
    children: number;
    pets: boolean;
  };
  budget: 'low' | 'medium' | 'high';
  interests: string[];
  travelDates: {
    start: Date | null;
    end: Date | null;
  };
  accommodation: 'hotel' | 'camping' | 'both' | 'none';
}

const VEHICLE_TYPES = {
  car: { label: 'Car', icon: '🚗', fuelEfficiency: 8.5 }, // L/100km
  motorcycle: { label: 'Motorcycle', icon: '🏍️', fuelEfficiency: 4.5 },
  rv: { label: 'RV/Motorhome', icon: '🚐', fuelEfficiency: 15.0 },
  truck: { label: 'Truck', icon: '🚛', fuelEfficiency: 12.0 },
};

const INTEREST_CATEGORIES = [
  'Nature & Parks', 'Historical Sites', 'Museums', 'Food & Dining',
  'Adventure Sports', 'Photography', 'Shopping', 'Nightlife',
  'Family Attractions', 'Cultural Events', 'Scenic Routes', 'Local Experiences'
];

export default function RoadTripPlannerPage() {
  // State management
  const [currentRoute, setCurrentRoute] = useState<RouteResult | null>(null);
  const [pois, setPOIs] = useState<POI[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [tripPreferences, setTripPreferences] = useState<TripPreferences>({
    vehicleType: 'car',
    travelers: { adults: 2, children: 0, pets: false },
    budget: 'medium',
    interests: [],
    travelDates: { start: null, end: null },
    accommodation: 'hotel',
  });
  
  const [showPreferences, setShowPreferences] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'route' | 'pois'>('map');

  // Handle route calculation from map
  const handleRouteCalculated = useCallback((route: RouteResult, routePOIs: POI[]) => {
    setCurrentRoute(route);
    setPOIs(routePOIs);
    setIsCalculating(false);
  }, []);

  // Handle waypoints change
  const handleWaypointsChanged = useCallback((newWaypoints: Waypoint[]) => {
    setWaypoints(newWaypoints);
    if (newWaypoints.length >= 2) {
      setIsCalculating(true);
    }
  }, []);

  // Calculate trip estimates
  const calculateTripEstimates = () => {
    if (!currentRoute) return null;

    const vehicle = VEHICLE_TYPES[tripPreferences.vehicleType];
    const distanceKm = Math.round(currentRoute.totalDistance.value / 1000);
    const durationHours = Math.round(currentRoute.totalDuration.value / 3600);
    const fuelNeeded = Math.round((distanceKm * vehicle.fuelEfficiency) / 100);
    
    // Rough cost estimates (can be made more sophisticated)
    const fuelCost = Math.round(fuelNeeded * 1.50); // $1.50 per liter
    const accommodationNights = Math.max(0, Math.floor(durationHours / 8) - 1);
    const accommodationCost = accommodationNights * (
      tripPreferences.accommodation === 'hotel' ? 
        (tripPreferences.budget === 'low' ? 80 : tripPreferences.budget === 'medium' ? 150 : 300) :
      tripPreferences.accommodation === 'camping' ? 30 : 0
    );
    const mealsCost = Math.round(durationHours / 4) * tripPreferences.travelers.adults * (
      tripPreferences.budget === 'low' ? 15 : tripPreferences.budget === 'medium' ? 30 : 60
    );

    const totalEstimatedCost = fuelCost + accommodationCost + mealsCost;

    return {
      distance: distanceKm,
      duration: durationHours,
      fuelNeeded,
      fuelCost,
      accommodationCost,
      mealsCost,
      totalEstimatedCost,
      accommodationNights,
    };
  };

  const tripEstimates = calculateTripEstimates();

  // Group POIs by category
  const poisByCategory = pois.reduce((acc, poi) => {
    if (!acc[poi.category]) acc[poi.category] = [];
    acc[poi.category].push(poi);
    return acc;
  }, {} as Record<POICategory, POI[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-teal-950">
      {/* Header */}
      <div className="border-b border-navy-700/50 bg-navy-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-teal-600/20 rounded-lg">
                <Map className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Road Trip Planner</h1>
                <p className="text-navy-300">Plan your perfect road trip with interactive maps and smart recommendations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowPreferences(!showPreferences)}
                variant="outline"
                className="border-navy-600 text-navy-300 hover:bg-navy-800"
              >
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </Button>
              
              <Button
                disabled={!currentRoute}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Trip
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Trip Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trip Overview */}
            <Card className="bg-navy-800/50 border-navy-700/50">
              <CardHeader>
                <CardTitle className="text-navy-100 flex items-center">
                  <Navigation className="w-5 h-5 mr-2 text-teal-400" />
                  Trip Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {waypoints.length >= 2 && tripEstimates ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-400">
                          {tripEstimates.distance}
                        </div>
                        <div className="text-sm text-navy-400">km total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-400">
                          {Math.floor(tripEstimates.duration / 24)}d {tripEstimates.duration % 24}h
                        </div>
                        <div className="text-sm text-navy-400">duration</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-navy-300">
                          <Fuel className="w-4 h-4 mr-2" />
                          Fuel Cost
                        </div>
                        <span className="text-navy-100">${tripEstimates.fuelCost}</span>
                      </div>
                      
                      {tripEstimates.accommodationNights > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-navy-300">
                            <Bed className="w-4 h-4 mr-2" />
                            Accommodation
                          </div>
                          <span className="text-navy-100">${tripEstimates.accommodationCost}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-navy-300">
                          <Coffee className="w-4 h-4 mr-2" />
                          Meals
                        </div>
                        <span className="text-navy-100">${tripEstimates.mealsCost}</span>
                      </div>
                      
                      <div className="border-t border-navy-600 pt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-navy-200 font-medium">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Estimated Total
                          </div>
                          <span className="text-lg font-bold text-teal-400">
                            ${tripEstimates.totalEstimatedCost}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-navy-600 mx-auto mb-3" />
                    <p className="text-navy-400">
                      Click on the map to add your origin and destination
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trip Preferences Panel */}
            {showPreferences && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-navy-800/50 border-navy-700/50">
                  <CardHeader>
                    <CardTitle className="text-navy-100">Trip Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Vehicle Type */}
                    <div>
                      <label className="block text-sm font-medium text-navy-300 mb-2">
                        Vehicle Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(VEHICLE_TYPES).map(([type, config]) => (
                          <button
                            key={type}
                            onClick={() => setTripPreferences(prev => ({
                              ...prev,
                              vehicleType: type as any
                            }))}
                            className={`p-2 rounded-lg border text-sm ${
                              tripPreferences.vehicleType === type
                                ? 'border-teal-400 bg-teal-400/10 text-teal-400'
                                : 'border-navy-600 text-navy-300 hover:bg-navy-700'
                            }`}
                          >
                            {config.icon} {config.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Travelers */}
                    <div>
                      <label className="block text-sm font-medium text-navy-300 mb-2">
                        Travelers
                      </label>
                      <div className="flex space-x-4">
                        <div>
                          <label className="text-xs text-navy-400">Adults</label>
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={tripPreferences.travelers.adults}
                            onChange={(e) => setTripPreferences(prev => ({
                              ...prev,
                              travelers: { ...prev.travelers, adults: parseInt(e.target.value) }
                            }))}
                            className="w-16 px-2 py-1 bg-navy-700 border border-navy-600 rounded text-navy-100 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-navy-400">Children</label>
                          <input
                            type="number"
                            min="0"
                            max="6"
                            value={tripPreferences.travelers.children}
                            onChange={(e) => setTripPreferences(prev => ({
                              ...prev,
                              travelers: { ...prev.travelers, children: parseInt(e.target.value) }
                            }))}
                            className="w-16 px-2 py-1 bg-navy-700 border border-navy-600 rounded text-navy-100 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-medium text-navy-300 mb-2">
                        Budget Level
                      </label>
                      <div className="flex space-x-2">
                        {['low', 'medium', 'high'].map((budget) => (
                          <button
                            key={budget}
                            onClick={() => setTripPreferences(prev => ({
                              ...prev,
                              budget: budget as any
                            }))}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm capitalize ${
                              tripPreferences.budget === budget
                                ? 'border-teal-400 bg-teal-400/10 text-teal-400'
                                : 'border-navy-600 text-navy-300 hover:bg-navy-700'
                            }`}
                          >
                            {budget}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* POI Summary */}
            {pois.length > 0 && (
              <Card className="bg-navy-800/50 border-navy-700/50">
                <CardHeader>
                  <CardTitle className="text-navy-100">Points of Interest</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(poisByCategory).map(([category, categoryPOIs]) => {
                      const config = POI_CATEGORIES[category as POICategory];
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center text-navy-300">
                            <span className="mr-2">{config.icon}</span>
                            <span className="text-sm">{config.name}</span>
                          </div>
                          <span className="text-teal-400 font-medium">{categoryPOIs.length}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content - Map */}
          <div className="lg:col-span-3">
            <Card className="bg-navy-800/30 border-navy-700/50">
              <CardContent className="p-0">
                <InteractiveMapPlanner
                  onRouteCalculated={handleRouteCalculated}
                  onWaypointsChanged={handleWaypointsChanged}
                  height="700px"
                  showPOIs={true}
                  enableRouteOptimization={true}
                  className="rounded-xl"
                />
              </CardContent>
            </Card>

            {/* Route Details */}
            {currentRoute && (
              <div className="mt-6 space-y-4">
                <div className="flex space-x-4">
                  {(['map', 'route', 'pois'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                        activeTab === tab
                          ? 'bg-teal-600 text-white'
                          : 'bg-navy-700 text-navy-300 hover:bg-navy-600'
                      }`}
                    >
                      {tab === 'pois' ? 'Points of Interest' : tab}
                    </button>
                  ))}
                </div>

                {activeTab === 'route' && (
                  <Card className="bg-navy-800/50 border-navy-700/50">
                    <CardHeader>
                      <CardTitle className="text-navy-100">Route Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {currentRoute.legs.map((leg, index) => (
                          <div key={index} className="border border-navy-700/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-navy-200">
                                Segment {index + 1}
                              </span>
                              <span className="text-teal-400">
                                {leg.distance.text} • {leg.duration.text}
                              </span>
                            </div>
                            <div className="text-sm text-navy-400">
                              From: {leg.startAddress}
                            </div>
                            <div className="text-sm text-navy-400">
                              To: {leg.endAddress}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'pois' && (
                  <Card className="bg-navy-800/50 border-navy-700/50">
                    <CardHeader>
                      <CardTitle className="text-navy-100">
                        Points of Interest ({pois.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(poisByCategory).map(([category, categoryPOIs]) => {
                          const config = POI_CATEGORIES[category as POICategory];
                          return (
                            <div key={category}>
                              <h3 className="font-medium text-navy-200 mb-2 flex items-center">
                                <span className="mr-2">{config.icon}</span>
                                {config.name} ({categoryPOIs.length})
                              </h3>
                              <div className="grid gap-2">
                                {categoryPOIs.slice(0, 5).map((poi) => (
                                  <div
                                    key={poi.placeId}
                                    className="bg-navy-700/30 border border-navy-600/50 rounded-lg p-3"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-medium text-navy-100">{poi.name}</h4>
                                        <p className="text-sm text-navy-400">{poi.formattedAddress}</p>
                                        {poi.rating && (
                                          <div className="flex items-center mt-1">
                                            <span className="text-yellow-400">★</span>
                                            <span className="text-sm text-navy-300 ml-1">
                                              {poi.rating.toFixed(1)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm text-teal-400">
                                          +{poi.estimatedDetour}min
                                        </div>
                                        <div className="text-xs text-navy-400">
                                          {Math.round(poi.distanceFromRoute)}m
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}