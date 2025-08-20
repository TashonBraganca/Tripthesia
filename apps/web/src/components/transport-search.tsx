"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  containerVariants, 
  itemVariants, 
  cardHoverVariants,
  skeletonVariants
} from "@/lib/motion";

interface TransportResult {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'car';
  provider: string;
  from: {
    name: string;
    code?: string;
    time: string;
  };
  to: {
    name: string;
    code?: string;
    time: string;
  };
  duration: string;
  price: {
    amount: number;
    currency: string;
  };
  stops?: number;
  amenities?: string[];
  rating?: number;
  bookingUrl: string;
  aircraft?: string;
  carbonFootprint?: number;
  features?: {
    wifi?: boolean;
    meals?: boolean;
    entertainment?: boolean;
    powerOutlets?: boolean;
  };
}

interface TransportFilters {
  maxPrice?: number;
  maxStops?: number;
  departureTime?: 'morning' | 'afternoon' | 'evening' | 'night';
  duration?: 'fastest' | 'cheapest';
  amenities?: string[];
}

interface TransportSearchProps {
  from: string;
  to: string;
  date: Date;
  passengers: number;
  onSelect?: (transport: TransportResult) => void;
  className?: string;
}

const TRANSPORT_ICONS = {
  flight: Plane,
  train: Train,
  bus: Bus,
  car: Car,
};

const AMENITY_ICONS = {
  wifi: Wifi,
  meals: Coffee,
  entertainment: Star,
  luggage: Luggage,
};

// Mock data for demonstration
const generateMockResults = (type: string, count: number = 8): TransportResult[] => {
  const providers = {
    flight: ['Delta', 'United', 'American', 'Southwest', 'JetBlue'],
    train: ['Amtrak', 'Eurostar', 'SNCF', 'DB', 'Renfe'],
    bus: ['FlixBus', 'Greyhound', 'BlaBlaBus', 'National Express'],
    car: ['Hertz', 'Avis', 'Enterprise', 'Budget', 'Alamo'],
  };

  return Array.from({ length: count }, (_, i) => ({
    id: `${type}-${i}`,
    type: type as any,
    provider: providers[type as keyof typeof providers][i % providers[type as keyof typeof providers].length],
    from: {
      name: 'New York',
      code: type === 'flight' ? 'JFK' : undefined,
      time: `${8 + i}:${(i * 15) % 60}`.padEnd(5, '0'),
    },
    to: {
      name: 'Los Angeles',
      code: type === 'flight' ? 'LAX' : undefined,
      time: `${12 + i}:${(i * 15) % 60}`.padEnd(5, '0'),
    },
    duration: `${3 + i}h ${(i * 30) % 60}m`,
    price: {
      amount: Math.floor(200 + i * 50 + Math.random() * 200),
      currency: 'USD',
    },
    stops: i % 3,
    rating: 3.5 + Math.random() * 1.5,
    bookingUrl: '#',
    amenities: ['wifi', 'meals', 'entertainment'].slice(0, Math.floor(Math.random() * 4)),
    carbonFootprint: Math.floor(50 + Math.random() * 200),
    features: {
      wifi: Math.random() > 0.3,
      meals: Math.random() > 0.5,
      entertainment: Math.random() > 0.4,
      powerOutlets: Math.random() > 0.2,
    },
  }));
};

export function TransportSearch({ from, to, date, passengers, onSelect, className }: TransportSearchProps) {
  const [activeTab, setActiveTab] = useState('flight');
  const [results, setResults] = useState<TransportResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<TransportFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'rating'>('price');

  // Simulate API call
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setResults(generateMockResults(activeTab, 12));
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeTab, from, to, date]);

  const filteredAndSortedResults = results
    .filter(result => {
      if (filters.maxPrice && result.price.amount > filters.maxPrice) return false;
      if (filters.maxStops !== undefined && (result.stops || 0) > filters.maxStops) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price': return a.price.amount - b.price.amount;
        case 'duration': return parseInt(a.duration) - parseInt(b.duration);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        default: return 0;
      }
    });

  const TransportCard = ({ result, index }: { result: TransportResult; index: number }) => {
    const Icon = TRANSPORT_ICONS[result.type];
    
    return (
      <motion.div
        variants={itemVariants}
        custom={index}
        whileHover="hover"
        initial="rest"
        className="group"
      >
        <motion.div variants={cardHoverVariants}>
          <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-border/50 hover:border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    result.type === 'flight' && "bg-blue-100 text-blue-600",
                    result.type === 'train' && "bg-green-100 text-green-600",
                    result.type === 'bus' && "bg-orange-100 text-orange-600",
                    result.type === 'car' && "bg-purple-100 text-purple-600"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{result.provider}</div>
                    {result.aircraft && (
                      <div className="text-xs text-muted-foreground">{result.aircraft}</div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg">${result.price.amount}</div>
                  <div className="text-xs text-muted-foreground">per person</div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-mono font-bold">{result.from.time}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.from.code || result.from.name}
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center relative">
                      <div className="w-full h-px bg-border"></div>
                      <div className="absolute bg-background px-2 text-xs text-muted-foreground">
                        {result.duration}
                      </div>
                      {result.stops !== undefined && result.stops > 0 && (
                        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-xs text-amber-600 font-medium">
                          {result.stops} stop{result.stops > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <div className="font-mono font-bold">{result.to.time}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.to.code || result.to.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features and amenities */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.features?.wifi && <Wifi className="h-4 w-4 text-blue-500" />}
                  {result.features?.meals && <Coffee className="h-4 w-4 text-amber-500" />}
                  {result.features?.entertainment && <Star className="h-4 w-4 text-purple-500" />}
                  {result.features?.powerOutlets && <Zap className="h-4 w-4 text-green-500" />}
                  
                  {result.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{result.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {result.carbonFootprint && (
                    <Badge variant="outline" className="text-xs">
                      {result.carbonFootprint}kg CO₂
                    </Badge>
                  )}
                  
                  <Button 
                    size="sm" 
                    className="group-hover:scale-105 transition-transform"
                    onClick={() => onSelect?.(result)}
                  >
                    Select
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transportation</h2>
          <p className="text-muted-foreground">
            {from} → {to} • {date.toLocaleDateString()} • {passengers} passenger{passengers > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newSort = sortBy === 'price' ? 'duration' : sortBy === 'duration' ? 'rating' : 'price';
              setSortBy(newSort);
            }}
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort by {sortBy}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="p-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Max Price</Label>
                  <Slider
                    value={[filters.maxPrice || 1000]}
                    onValueChange={([value]) => setFilters(prev => ({ ...prev, maxPrice: value }))}
                    max={1000}
                    min={100}
                    step={50}
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Up to ${filters.maxPrice || 1000}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm">Max Stops</Label>
                  <Slider
                    value={[filters.maxStops || 2]}
                    onValueChange={([value]) => setFilters(prev => ({ ...prev, maxStops: value }))}
                    max={3}
                    min={0}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {filters.maxStops || 2} stops max
                  </div>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setFilters({})}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transport Mode Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="flight" className="gap-2">
            <Plane className="h-4 w-4" />
            Flights
          </TabsTrigger>
          <TabsTrigger value="train" className="gap-2">
            <Train className="h-4 w-4" />
            Trains  
          </TabsTrigger>
          <TabsTrigger value="bus" className="gap-2">
            <Bus className="h-4 w-4" />
            Buses
          </TabsTrigger>
          <TabsTrigger value="car" className="gap-2">
            <Car className="h-4 w-4" />
            Car Rental
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div 
                  key={i} 
                  variants={skeletonVariants}
                  animate="loading"
                  className="h-32 bg-muted rounded-lg"
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {filteredAndSortedResults.length > 0 ? (
                filteredAndSortedResults.map((result, index) => (
                  <TransportCard key={result.id} result={result} index={index} />
                ))
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="text-center py-12"
                >
                  <div className="text-muted-foreground">
                    No {activeTab}s found for your criteria. Try adjusting your filters.
                  </div>
                </motion.div>
              )}

              {filteredAndSortedResults.length > 0 && (
                <motion.div 
                  variants={itemVariants}
                  className="text-center pt-4"
                >
                  <Button variant="outline">
                    Load More Results
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