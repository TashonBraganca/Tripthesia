"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
  Plane, 
  Train, 
  Car, 
  Bus, 
  Clock, 
  MapPin, 
  DollarSign,
  Filter,
  ArrowUpDown,
  Wifi,
  Coffee,
  Luggage,
  Star,
  Users,
  Calendar,
  ExternalLink,
  Zap,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Shield,
  Leaf,
  Bell,
  RefreshCw,
  ChevronDown,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  containerVariants, 
  itemVariants, 
  cardHoverVariants,
  skeletonVariants,
  pulseVariants
} from "@/lib/motion";
import { 
  searchTransport, 
  PriceTracker,
  type TransportSearchParams, 
  type TransportResult, 
  type FlightResult 
} from "@/lib/transport-apis";

interface EnhancedTransportSearchProps {
  searchParams: TransportSearchParams;
  onResultSelect?: (result: TransportResult) => void;
  onBookingClick?: (result: TransportResult) => void;
  showPriceTracking?: boolean;
}

interface SearchFilters {
  priceRange: [number, number];
  maxStops: number;
  departureTime: 'any' | 'morning' | 'afternoon' | 'evening' | 'night';
  airlines: string[];
  amenities: string[];
  sortBy: 'price' | 'duration' | 'departure' | 'rating' | 'stops';
  directOnly: boolean;
}

interface PriceAlert {
  id: string;
  targetPrice: number;
  currentPrice: number;
  trend: 'up' | 'down' | 'stable';
  active: boolean;
}

export function EnhancedTransportSearch({ 
  searchParams, 
  onResultSelect, 
  onBookingClick,
  showPriceTracking = true 
}: EnhancedTransportSearchProps) {
  const [results, setResults] = useState<TransportResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<TransportResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceAlert, setPriceAlert] = useState<PriceAlert | null>(null);
  const [activeTab, setActiveTab] = useState<'flights' | 'trains' | 'buses' | 'cars'>('flights');
  const [showFilters, setShowFilters] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    priceRange: [0, 2000],
    maxStops: 3,
    departureTime: 'any',
    airlines: [],
    amenities: [],
    sortBy: 'price',
    directOnly: false
  });

  // Perform search
  const performSearch = async () => {
    if (!searchParams.from || !searchParams.to || !searchParams.departureDate) return;

    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await searchTransport({
        ...searchParams,
        transportType: activeTab.slice(0, -1) as any, // Remove 's' from 'flights' -> 'flight'
        directOnly: filters.directOnly,
        maxStops: filters.maxStops,
        sortBy: filters.sortBy
      });

      setResults(searchResults);
      setLastSearchTime(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Transport search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter results based on current filters
  const applyFilters = useMemo(() => {
    let filtered = [...results];

    // Price range filter
    filtered = filtered.filter(result => 
      result.price.amount >= filters.priceRange[0] && 
      result.price.amount <= filters.priceRange[1]
    );

    // Departure time filter
    if (filters.departureTime !== 'any') {
      filtered = filtered.filter(result => {
        const hour = parseInt(result.from.time.split(':')[0]);
        switch (filters.departureTime) {
          case 'morning': return hour >= 6 && hour < 12;
          case 'afternoon': return hour >= 12 && hour < 18;
          case 'evening': return hour >= 18 && hour < 22;
          case 'night': return hour >= 22 || hour < 6;
          default: return true;
        }
      });
    }

    // Stops filter (for flights)
    if (activeTab === 'flights') {
      filtered = filtered.filter(result => {
        const flightResult = result as FlightResult;
        return flightResult.stops.count <= filters.maxStops;
      });

      if (filters.directOnly) {
        filtered = filtered.filter(result => {
          const flightResult = result as FlightResult;
          return flightResult.stops.count === 0;
        });
      }
    }

    // Airline filter
    if (filters.airlines.length > 0 && activeTab === 'flights') {
      filtered = filtered.filter(result => {
        const flightResult = result as FlightResult;
        return filters.airlines.includes(flightResult.airline.code);
      });
    }

    // Amenities filter
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(result => {
        if (result.type === 'flight') {
          const flightResult = result as FlightResult;
          return filters.amenities.every(amenity => {
            switch (amenity) {
              case 'wifi': return flightResult.amenities.wifi;
              case 'meals': return flightResult.amenities.meals;
              case 'entertainment': return flightResult.amenities.entertainment;
              case 'power': return flightResult.amenities.powerOutlets;
              default: return true;
            }
          });
        }
        return true;
      });
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price':
          return a.price.amount - b.price.amount;
        case 'duration':
          return a.duration.total - b.duration.total;
        case 'departure':
          return a.from.time.localeCompare(b.from.time);
        case 'rating':
          const aRating = a.type === 'flight' ? (a as FlightResult).rating?.score || 0 : 0;
          const bRating = b.type === 'flight' ? (b as FlightResult).rating?.score || 0 : 0;
          return bRating - aRating;
        case 'stops':
          if (a.type === 'flight' && b.type === 'flight') {
            return (a as FlightResult).stops.count - (b as FlightResult).stops.count;
          }
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [results, filters, activeTab]);

  useEffect(() => {
    setFilteredResults(applyFilters);
  }, [applyFilters]);

  // Auto-search on params change
  useEffect(() => {
    performSearch();
  }, [searchParams, activeTab]);

  // Set up price tracking
  const setupPriceAlert = async (targetPrice: number) => {
    try {
      const watcherId = await PriceTracker.trackPrice(searchParams, targetPrice);
      const lowestPrice = Math.min(...filteredResults.map(r => r.price.amount));
      
      setPriceAlert({
        id: watcherId,
        targetPrice,
        currentPrice: lowestPrice,
        trend: 'stable',
        active: true
      });
    } catch (error) {
      console.error('Failed to set up price alert:', error);
    }
  };

  // Get unique airlines for filter
  const availableAirlines = useMemo(() => {
    const airlines = new Set<string>();
    results.forEach(result => {
      if (result.type === 'flight') {
        airlines.add((result as FlightResult).airline.code);
      }
    });
    return Array.from(airlines);
  }, [results]);

  const renderFilters = () => (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-t bg-muted/30 p-4"
    >
      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
          </Label>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
            min={0}
            max={2000}
            step={50}
            className="w-full"
          />
        </div>

        {/* Departure Time */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Departure Time</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { value: 'any', label: 'Any time' },
              { value: 'morning', label: 'Morning (6-12)' },
              { value: 'afternoon', label: 'Afternoon (12-18)' },
              { value: 'evening', label: 'Evening (18-22)' },
              { value: 'night', label: 'Night (22-6)' }
            ].map(option => (
              <Button
                key={option.value}
                variant={filters.departureTime === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, departureTime: option.value as any }))}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Flight-specific filters */}
        {activeTab === 'flights' && (
          <>
            {/* Stops */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Maximum Stops: {filters.maxStops === 0 ? 'Direct only' : filters.maxStops}
              </Label>
              <Slider
                value={[filters.maxStops]}
                onValueChange={(value) => setFilters(prev => ({ ...prev, maxStops: value[0] }))}
                min={0}
                max={3}
                step={1}
                className="w-full"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="direct-only"
                  checked={filters.directOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, directOnly: e.target.checked }))}
                />
                <Label htmlFor="direct-only" className="text-sm">Direct flights only</Label>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'wifi', label: 'Wi-Fi', icon: <Wifi className="h-3 w-3" /> },
                  { value: 'meals', label: 'Meals', icon: <Coffee className="h-3 w-3" /> },
                  { value: 'entertainment', label: 'Entertainment', icon: <Star className="h-3 w-3" /> },
                  { value: 'power', label: 'Power Outlets', icon: <Zap className="h-3 w-3" /> }
                ].map(amenity => (
                  <Button
                    key={amenity.value}
                    variant={filters.amenities.includes(amenity.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newAmenities = filters.amenities.includes(amenity.value)
                        ? filters.amenities.filter(a => a !== amenity.value)
                        : [...filters.amenities, amenity.value];
                      setFilters(prev => ({ ...prev, amenities: newAmenities }));
                    }}
                    className="gap-2 text-xs"
                  >
                    {amenity.icon}
                    {amenity.label}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Sort Options */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Sort by</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { value: 'price', label: 'Price' },
              { value: 'duration', label: 'Duration' },
              { value: 'departure', label: 'Departure' },
              { value: 'rating', label: 'Rating' },
              { value: 'stops', label: 'Stops' }
            ].map(option => (
              <Button
                key={option.value}
                variant={filters.sortBy === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, sortBy: option.value as any }))}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderResultCard = (result: TransportResult, index: number) => (
    <motion.div
      key={result.id}
      variants={itemVariants}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-emerald-300 group">
        <CardContent className="p-4">
          {result.type === 'flight' && (
            <FlightResultCard 
              flight={result as FlightResult}
              onSelect={() => onResultSelect?.(result)}
              onBookingClick={() => onBookingClick?.(result)}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transport Search</h2>
          <p className="text-muted-foreground">
            {searchParams.from} → {searchParams.to} • {format(searchParams.departureDate, 'MMM dd, yyyy')} • {searchParams.passengers} passenger{searchParams.passengers !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {showPriceTracking && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const lowestPrice = Math.min(...filteredResults.map(r => r.price.amount));
                setupPriceAlert(lowestPrice * 0.9); // Alert when price drops 10%
              }}
              className="gap-2"
            >
              <Bell className="h-4 w-4" />
              Price Alert
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Price Alert Banner */}
      {priceAlert && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-800">Price Alert Active</p>
                <p className="text-sm text-emerald-600">
                  You'll be notified when prices drop below ${priceAlert.targetPrice}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              Current: ${priceAlert.currentPrice}
            </Badge>
          </div>
        </motion.div>
      )}

      {/* Transport Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="flights" className="gap-2">
            <Plane className="h-4 w-4" />
            Flights
          </TabsTrigger>
          <TabsTrigger value="trains" className="gap-2">
            <Train className="h-4 w-4" />
            Trains
          </TabsTrigger>
          <TabsTrigger value="buses" className="gap-2">
            <Bus className="h-4 w-4" />
            Buses
          </TabsTrigger>
          <TabsTrigger value="cars" className="gap-2">
            <Car className="h-4 w-4" />
            Car Rental
          </TabsTrigger>
        </TabsList>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && renderFilters()}
        </AnimatePresence>

        <TabsContent value={activeTab} className="mt-6">
          {/* Results Summary */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Searching for the best deals...
                </div>
              ) : (
                <>
                  {filteredResults.length} results found
                  {lastSearchTime && (
                    <span className="ml-2">
                      • Updated {lastSearchTime.toLocaleTimeString()}
                    </span>
                  )}
                </>
              )}
            </div>
            
            {filteredResults.length > 0 && !loading && (
              <div className="text-sm text-muted-foreground">
                From ${Math.min(...filteredResults.map(r => r.price.amount))}
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Search Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={performSearch} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div key={i} variants={skeletonVariants} animate="loading">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
                        <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Results */}
          {!loading && !error && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {filteredResults.length > 0 ? (
                filteredResults.map((result, index) => renderResultCard(result, index))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search criteria
                  </p>
                  <Button onClick={() => setShowFilters(true)} variant="outline">
                    Modify Filters
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Flight Result Card Component
function FlightResultCard({ 
  flight, 
  onSelect, 
  onBookingClick 
}: { 
  flight: FlightResult; 
  onSelect: () => void; 
  onBookingClick: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 rounded-lg">
            <Plane className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h3 className="font-semibold">{flight.airline.name}</h3>
            <p className="text-sm text-muted-foreground">{flight.aircraft}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold">${flight.price.amount}</div>
          <div className="text-sm text-muted-foreground">per person</div>
        </div>
      </div>

      {/* Flight Details */}
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Departure */}
        <div>
          <div className="text-xl font-bold">{flight.from.time}</div>
          <div className="text-sm font-medium">{flight.from.code}</div>
          <div className="text-xs text-muted-foreground">{flight.from.city}</div>
          {flight.from.terminal && (
            <div className="text-xs text-muted-foreground">{flight.from.terminal}</div>
          )}
        </div>

        {/* Duration & Stops */}
        <div className="text-center">
          <div className="text-sm font-medium">{flight.duration.formatted}</div>
          <div className="flex items-center justify-center my-2">
            <div className="flex-1 h-0.5 bg-muted"></div>
            <div className="mx-2 text-xs text-muted-foreground">
              {flight.stops.count === 0 ? 'Direct' : `${flight.stops.count} stop${flight.stops.count > 1 ? 's' : ''}`}
            </div>
            <div className="flex-1 h-0.5 bg-muted"></div>
          </div>
          {flight.stops.count > 0 && (
            <div className="text-xs text-muted-foreground">
              via {flight.stops.airports.join(', ')}
            </div>
          )}
        </div>

        {/* Arrival */}
        <div className="text-right">
          <div className="text-xl font-bold">{flight.to.time}</div>
          <div className="text-sm font-medium">{flight.to.code}</div>
          <div className="text-xs text-muted-foreground">{flight.to.city}</div>
          {flight.to.terminal && (
            <div className="text-xs text-muted-foreground">{flight.to.terminal}</div>
          )}
        </div>
      </div>

      {/* Amenities & Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {flight.amenities.wifi && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Wifi className="h-3 w-3" />
              Wi-Fi
            </Badge>
          )}
          {flight.amenities.meals && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Coffee className="h-3 w-3" />
              Meals
            </Badge>
          )}
          {flight.amenities.powerOutlets && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Zap className="h-3 w-3" />
              Power
            </Badge>
          )}
          
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs gap-1",
              flight.carbonFootprint.comparison === 'low' ? "text-green-600 border-green-300" :
              flight.carbonFootprint.comparison === 'high' ? "text-red-600 border-red-300" :
              "text-amber-600 border-amber-300"
            )}
          >
            <Leaf className="h-3 w-3" />
            {flight.carbonFootprint.kg}kg CO₂
          </Badge>

          {flight.rating && (
            <Badge variant="outline" className="text-xs gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              {flight.rating.score}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelect}
          >
            Select
          </Button>
          <Button
            size="sm"
            onClick={onBookingClick}
            className="gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            Book Now
          </Button>
        </div>
      </div>

      {/* Additional Details (Collapsible) */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center justify-between">
          <span>Baggage: {flight.baggage.cabin} + {flight.baggage.checked}</span>
          <span className="flex items-center gap-1">
            {flight.restrictions.refundable ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <XCircle className="h-3 w-3 text-red-500" />
            )}
            {flight.restrictions.refundable ? 'Refundable' : 'Non-refundable'}
          </span>
        </div>
      </div>
    </div>
  );
}