"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Plane,
  Hotel,
  Utensils,
  Camera,
  Wand2,
  Filter,
  SortDesc,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Star,
  DollarSign,
  Clock,
  Zap,
  Globe,
  ArrowRight,
  ChevronDown,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  containerVariants, 
  itemVariants, 
  cardHoverVariants
} from "@/lib/motion";

// Import our enhanced services
import { SmartTripAssistant, type UserPreferences, type TripRecommendation } from "@/lib/smart-trip-assistant";
import { GooglePlacesService } from "@/lib/google-apis";
import { ReviewAggregationService, type AggregatedReviews } from "@/lib/review-aggregation";
import { RegionalAPIService, type RegionData } from "@/lib/region-dependent-apis";
import { KiwiFlightService, TransportOptimizationService, type FlightResult } from "@/lib/transport-apis-enhanced";

// Import enhanced components
import { EnhancedHotelCards, type HotelResult } from "./enhanced-hotel-cards";
import { EnhancedActivityCards, type ActivityResult } from "./enhanced-activity-cards";
import { EnhancedRestaurantCards, type RestaurantResult } from "./enhanced-restaurant-cards";
import { TransportComparisonDashboard } from "./transport-comparison-dashboard";

interface SearchParams {
  destination: string;
  coordinates?: { lat: number; lng: number };
  dates: {
    start: Date;
    end: Date;
  };
  travelers: {
    adults: number;
    children: number;
  };
  preferences: UserPreferences;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
}

interface SearchResults {
  ai_recommendations: TripRecommendation | null;
  region_data: RegionData | null;
  flights: FlightResult[];
  hotels: HotelResult[];
  restaurants: RestaurantResult[];
  activities: ActivityResult[];
  reviews: Map<string, AggregatedReviews>;
  loading: boolean;
  error: string | null;
}

export function UnifiedTravelSearch() {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    destination: '',
    dates: {
      start: new Date(),
      end: addDays(new Date(), 7)
    },
    travelers: {
      adults: 2,
      children: 0
    },
    preferences: {
      travel_style: 'mid_range',
      interests: ['culture', 'food'],
      budget_range: {
        min: 1000,
        max: 3000,
        currency: 'USD'
      },
      accommodation_preferences: {
        type: 'hotel',
        amenities: ['wifi', 'breakfast'],
        location_priority: 'city_center'
      },
      transport_preferences: {
        comfort_level: 'standard',
        eco_conscious: false,
        direct_flights_only: false,
        preferred_airlines: []
      },
      dining_preferences: {
        cuisine_types: ['local'],
        dietary_restrictions: [],
        price_range: 'mid_range'
      },
      activity_preferences: {
        pace: 'moderate',
        group_activities: true,
        cultural_immersion: true,
        physical_activity_level: 'moderate'
      }
    },
    budget: {
      min: 1000,
      max: 3000,
      currency: 'USD'
    }
  });

  const [results, setResults] = useState<SearchResults>({
    ai_recommendations: null,
    region_data: null,
    flights: [],
    hotels: [],
    restaurants: [],
    activities: [],
    reviews: new Map(),
    loading: false,
    error: null
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'flights' | 'hotels' | 'restaurants' | 'activities'>('overview');
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AI-powered comprehensive search
  const performComprehensiveSearch = async () => {
    if (!searchParams.destination.trim()) return;

    setIsSearching(true);
    setResults(prev => ({ ...prev, loading: true, error: null }));
    setSearchProgress(0);

    try {
      // Phase 1: Get destination coordinates and region data (20%)
      setSearchProgress(20);
      const coordinates = await GooglePlacesService.searchPlaces({
        query: searchParams.destination,
        type: 'locality'
      }).then(places => places[0]?.geometry?.location);

      if (coordinates) {
        setSearchParams(prev => ({ ...prev, coordinates }));
      }

      const regionData = await RegionalAPIService.getDestinationData(
        searchParams.destination, 
        coordinates
      );

      // Phase 2: Get AI recommendations (40%)
      setSearchProgress(40);
      const aiRecommendations = await SmartTripAssistant.generateRecommendations({
        destination: searchParams.destination,
        travel_dates: searchParams.dates,
        travelers: searchParams.travelers,
        user_preferences: searchParams.preferences
      });

      // Phase 3: Search all travel components in parallel (60%)
      setSearchProgress(60);
      const [flights, hotels, restaurants, activities] = await Promise.allSettled([
        // Flights
        KiwiFlightService.searchFlights({
          from: 'New York', // This would be user's location
          to: searchParams.destination,
          departureDate: searchParams.dates.start,
          returnDate: searchParams.dates.end,
          passengers: searchParams.travelers.adults + searchParams.travelers.children,
          preferences: searchParams.preferences.transport_preferences,
          sortBy: 'price'
        }),
        
        // Hotels (mock data based on region)
        regionData.hotels || [],
        
        // Restaurants (mock data based on region)
        regionData.restaurants || [],
        
        // Activities (mock data based on region)
        regionData.activities || []
      ]);

      // Phase 4: Aggregate reviews and optimize (80%)
      setSearchProgress(80);
      const reviewsMap = new Map<string, AggregatedReviews>();
      
      // Get reviews for top hotels and restaurants
      const topBusinesses = [
        ...(hotels.status === 'fulfilled' ? hotels.value.slice(0, 5) : []),
        ...(restaurants.status === 'fulfilled' ? restaurants.value.slice(0, 5) : [])
      ];

      await Promise.allSettled(
        topBusinesses.map(async (business: any) => {
          try {
            const reviews = await ReviewAggregationService.aggregateReviews({
              businessName: business.name,
              location: coordinates,
              businessType: business.type || 'hotel',
              googlePlaceId: business.place_id
            });
            reviewsMap.set(business.id, reviews);
          } catch (error) {
            console.error(`Error getting reviews for ${business.name}:`, error);
          }
        })
      );

      // Phase 5: Finalize and optimize results (100%)
      setSearchProgress(100);

      setResults({
        ai_recommendations: aiRecommendations,
        region_data: regionData.region,
        flights: flights.status === 'fulfilled' ? flights.value : [],
        hotels: hotels.status === 'fulfilled' ? flights.value : [],
        restaurants: restaurants.status === 'fulfilled' ? restaurants.value : [],
        activities: activities.status === 'fulfilled' ? activities.value : [],
        reviews: reviewsMap,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Comprehensive search error:', error);
      setResults(prev => ({
        ...prev,
        loading: false,
        error: 'Search failed. Please try again.'
      }));
    } finally {
      setIsSearching(false);
      setSearchProgress(0);
    }
  };

  // Auto-search with debouncing
  useEffect(() => {
    if (searchParams.destination.trim()) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        performComprehensiveSearch();
      }, 1000);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchParams.destination]);

  const handleSearch = () => {
    performComprehensiveSearch();
  };

  const clearSearch = () => {
    setSearchParams(prev => ({ ...prev, destination: '' }));
    setResults({
      ai_recommendations: null,
      region_data: null,
      flights: [],
      hotels: [],
      restaurants: [],
      activities: [],
      reviews: new Map(),
      loading: false,
      error: null
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* AI-Powered Search Header */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center space-y-4"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-emerald-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            AI Travel Planner
          </h1>
        </motion.div>
        <motion.p variants={itemVariants} className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get personalized recommendations powered by GPT-4o-mini with live data from Google, Kiwi.com, and trusted sources
        </motion.p>
      </motion.div>

      {/* Enhanced Search Bar */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Where do you want to go? (e.g., Goa, Tokyo, Paris)"
                value={searchParams.destination}
                onChange={(e) => setSearchParams(prev => ({ ...prev, destination: e.target.value }))}
                className="pl-10 pr-10 h-12 text-lg"
              />
              {searchParams.destination && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button
              onClick={handleSearch}
              disabled={!searchParams.destination.trim() || isSearching}
              className="h-12 px-8 gap-2"
            >
              {isSearching ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Wand2 className="h-5 w-5" />
              )}
              {isSearching ? 'Searching...' : 'Plan Trip'}
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {format(searchParams.dates.start, 'MMM dd')} - {format(searchParams.dates.end, 'MMM dd')}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {searchParams.travelers.adults + searchParams.travelers.children} travelers
            </Badge>
            <Badge variant="outline" className="gap-1">
              <DollarSign className="h-3 w-3" />
              ${searchParams.budget.min}-{searchParams.budget.max}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1"
            >
              <Filter className="h-3 w-3" />
              More Filters
              <ChevronDown className={cn("h-3 w-3 transition-transform", showFilters && "rotate-180")} />
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Search Progress */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">AI is analyzing your destination...</span>
                    <span className="text-xs text-muted-foreground">{searchProgress}%</span>
                  </div>
                  <Progress value={searchProgress} className="h-2" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {searchProgress <= 20 && "Getting location data and regional insights..."}
                {searchProgress > 20 && searchProgress <= 40 && "Generating personalized recommendations with GPT-4o-mini..."}
                {searchProgress > 40 && searchProgress <= 60 && "Searching flights, hotels, restaurants, and activities..."}
                {searchProgress > 60 && searchProgress <= 80 && "Aggregating reviews from multiple sources..."}
                {searchProgress > 80 && "Optimizing recommendations for your preferences..."}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      <AnimatePresence>
        {results.ai_recommendations && !results.loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6"
          >
            {/* AI Insights Banner */}
            <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Sparkles className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">AI Travel Insights for {searchParams.destination}</h3>
                    <p className="text-muted-foreground mb-3">
                      {results.ai_recommendations.destination_analysis.weather_overview}
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm">
                          <strong>Best Time:</strong> {results.ai_recommendations.destination_analysis.best_time_to_visit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">
                          <strong>Confidence:</strong> {results.ai_recommendations.ai_confidence_score}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm">
                          <strong>Est. Total:</strong> ${results.ai_recommendations.budget_optimization.estimated_total.total}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Results Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="flights" className="gap-2">
                  <Plane className="h-4 w-4" />
                  Flights ({results.flights.length})
                </TabsTrigger>
                <TabsTrigger value="hotels" className="gap-2">
                  <Hotel className="h-4 w-4" />
                  Hotels ({results.hotels.length})
                </TabsTrigger>
                <TabsTrigger value="restaurants" className="gap-2">
                  <Utensils className="h-4 w-4" />
                  Dining ({results.restaurants.length})
                </TabsTrigger>
                <TabsTrigger value="activities" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Activities ({results.activities.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Trip Overview with AI Recommendations */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* AI Itinerary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-emerald-600" />
                        AI-Generated Itinerary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {results.ai_recommendations.activity_itinerary.slice(0, 3).map((day, idx) => (
                          <div key={idx} className="border-l-2 border-emerald-200 pl-4">
                            <div className="font-medium">Day {day.day}: {day.theme}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {day.activities.slice(0, 2).map(activity => activity.name).join(', ')}
                              {day.activities.length > 2 && ` +${day.activities.length - 2} more`}
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" className="w-full gap-2">
                          <ArrowRight className="h-4 w-4" />
                          View Complete Itinerary
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Budget Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Smart Budget Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(results.ai_recommendations.budget_optimization.estimated_total)
                          .filter(([key]) => key !== 'total')
                          .map(([category, amount]) => (
                            <div key={category} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-muted rounded-full h-2">
                                  <div 
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ 
                                      width: `${(amount / results.ai_recommendations.budget_optimization.estimated_total.total) * 100}%` 
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-16 text-right">${amount}</span>
                              </div>
                            </div>
                          ))}
                        <div className="border-t pt-2 font-semibold flex justify-between">
                          <span>Total</span>
                          <span>${results.ai_recommendations.budget_optimization.estimated_total.total}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Hidden Gems */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      Hidden Gems & Local Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {results.ai_recommendations.destination_analysis.hidden_gems.map((gem, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="font-medium">{gem.name}</div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            {gem.type}
                          </div>
                          <div className="text-sm text-muted-foreground">{gem.description}</div>
                          <div className="text-xs text-emerald-600 mt-2">{gem.why_special}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flights" className="mt-6">
                {results.flights.length > 0 ? (
                  <TransportComparisonDashboard
                    searchParams={{
                      from: 'New York',
                      to: searchParams.destination,
                      departureDate: searchParams.dates.start,
                      passengers: searchParams.travelers.adults + searchParams.travelers.children
                    }}
                    onResultSelect={(result) => console.log('Selected flight:', result)}
                  />
                ) : (
                  <Card className="p-8 text-center">
                    <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No flights found</h3>
                    <p className="text-muted-foreground">Try adjusting your search criteria or dates.</p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="hotels" className="mt-6">
                {results.hotels.length > 0 ? (
                  <EnhancedHotelCards
                    hotels={results.hotels}
                    searchParams={{
                      destination: searchParams.destination,
                      checkin: searchParams.dates.start,
                      checkout: searchParams.dates.end,
                      guests: searchParams.travelers.adults + searchParams.travelers.children,
                      rooms: Math.ceil((searchParams.travelers.adults + searchParams.travelers.children) / 2)
                    }}
                    onSelect={(hotel) => console.log('Selected hotel:', hotel)}
                    onBooking={(hotel, platform) => console.log('Booking hotel:', hotel, 'via', platform)}
                  />
                ) : (
                  <Card className="p-8 text-center">
                    <Hotel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hotels found</h3>
                    <p className="text-muted-foreground">Try searching for a different destination.</p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="restaurants" className="mt-6">
                {results.restaurants.length > 0 ? (
                  <EnhancedRestaurantCards
                    restaurants={results.restaurants}
                    searchParams={{
                      destination: searchParams.destination,
                      date: searchParams.dates.start,
                      time: '19:00',
                      party_size: searchParams.travelers.adults + searchParams.travelers.children
                    }}
                    onSelect={(restaurant) => console.log('Selected restaurant:', restaurant)}
                    onReservation={(restaurant, platform) => console.log('Making reservation:', restaurant, 'via', platform)}
                  />
                ) : (
                  <Card className="p-8 text-center">
                    <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No restaurants found</h3>
                    <p className="text-muted-foreground">Try searching for a different destination.</p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activities" className="mt-6">
                {results.activities.length > 0 ? (
                  <EnhancedActivityCards
                    activities={results.activities}
                    searchParams={{
                      destination: searchParams.destination,
                      date: searchParams.dates.start,
                      travelers: searchParams.travelers.adults + searchParams.travelers.children
                    }}
                    onSelect={(activity) => console.log('Selected activity:', activity)}
                    onBooking={(activity, platform) => console.log('Booking activity:', activity, 'via', platform)}
                  />
                ) : (
                  <Card className="p-8 text-center">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No activities found</h3>
                    <p className="text-muted-foreground">Try searching for a different destination.</p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {results.error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <div className="text-red-600 mb-2">Search Error</div>
                <div className="text-sm text-muted-foreground">{results.error}</div>
                <Button className="mt-4" onClick={handleSearch}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!searchParams.destination && !results.loading && !results.error && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="text-center py-12"
        >
          <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ready to plan your next adventure?</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Search for any destination worldwide and get AI-powered recommendations with live pricing and reviews.
          </p>
        </motion.div>
      )}
    </div>
  );
}