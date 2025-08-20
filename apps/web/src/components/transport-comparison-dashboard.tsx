"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
  Plane, 
  Train, 
  Car, 
  Bus, 
  Clock, 
  DollarSign,
  Leaf,
  Star,
  Trophy,
  TrendingDown,
  Zap,
  Shield,
  Users,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  BarChart3
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  containerVariants, 
  itemVariants,
  cardHoverVariants
} from "@/lib/motion";
import { 
  searchTransport,
  type TransportSearchParams, 
  type TransportResult, 
  type FlightResult,
  type TrainResult,
  type BusResult,
  type CarRentalResult
} from "@/lib/transport-apis";
import { multiModalTransport } from "@/lib/multi-modal-transport";

interface TransportComparisonProps {
  searchParams: TransportSearchParams;
  onResultSelect?: (result: TransportResult) => void;
}

interface ComparisonMetrics {
  cheapest: {
    result: TransportResult;
    savings: number;
  };
  fastest: {
    result: TransportResult;
    timeSaved: number;
  };
  greenest: {
    result: TransportResult;
    carbonSaved: number;
  };
  bestValue: {
    result: TransportResult;
    score: number;
  };
}

export function TransportComparisonDashboard({ searchParams, onResultSelect }: TransportComparisonProps) {
  const [results, setResults] = useState<{
    flights: FlightResult[];
    trains: TrainResult[];
    buses: BusResult[];
    carRentals: CarRentalResult[];
  }>({
    flights: [],
    trains: [],
    buses: [],
    carRentals: []
  });
  
  const [loading, setLoading] = useState(false);
  const [activeComparison, setActiveComparison] = useState<'overview' | 'detailed'>('overview');
  const [comparisonMetrics, setComparisonMetrics] = useState<ComparisonMetrics | null>(null);

  // Search all transport modes
  const performSearch = async () => {
    setLoading(true);
    
    try {
      // Search flights
      const flights = await searchTransport({
        ...searchParams,
        transportType: 'flight'
      }) as FlightResult[];

      // Search other modes
      const multiModalResults = await multiModalTransport.searchAllModes(searchParams);

      const allResults = {
        flights,
        trains: multiModalResults.trains,
        buses: multiModalResults.buses,
        carRentals: multiModalResults.carRentals
      };

      setResults(allResults);
      calculateComparisonMetrics(allResults);
      
    } catch (error) {
      console.error('Multi-modal search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate comparison metrics
  const calculateComparisonMetrics = (allResults: typeof results) => {
    const allOptions: TransportResult[] = [
      ...allResults.flights,
      ...allResults.trains,
      ...allResults.buses,
      ...allResults.carRentals
    ];

    if (allOptions.length === 0) return;

    // Find cheapest
    const cheapest = allOptions.reduce((prev, current) => 
      current.price.amount < prev.price.amount ? current : prev
    );

    // Find fastest (exclude car rentals for duration comparison)
    const timeBasedOptions = [...allResults.flights, ...allResults.trains, ...allResults.buses];
    const fastest = timeBasedOptions.reduce((prev, current) => 
      current.duration.total < prev.duration.total ? current : prev
    );

    // Find greenest
    const greenest = timeBasedOptions.reduce((prev, current) => 
      current.carbonFootprint.kg < prev.carbonFootprint.kg ? current : prev
    );

    // Calculate best value (price/time ratio with carbon bonus)
    const bestValue = timeBasedOptions.reduce((prev, current) => {
      const prevScore = prev.price.amount / (prev.duration.total / 60) + (prev.carbonFootprint.kg * 0.1);
      const currentScore = current.price.amount / (current.duration.total / 60) + (current.carbonFootprint.kg * 0.1);
      return currentScore < prevScore ? current : prev;
    });

    // Calculate savings/improvements
    const avgPrice = allOptions.reduce((sum, opt) => sum + opt.price.amount, 0) / allOptions.length;
    const avgDuration = timeBasedOptions.reduce((sum, opt) => sum + opt.duration.total, 0) / timeBasedOptions.length;
    const avgCarbon = timeBasedOptions.reduce((sum, opt) => sum + opt.carbonFootprint.kg, 0) / timeBasedOptions.length;

    setComparisonMetrics({
      cheapest: {
        result: cheapest,
        savings: avgPrice - cheapest.price.amount
      },
      fastest: {
        result: fastest,
        timeSaved: avgDuration - fastest.duration.total
      },
      greenest: {
        result: greenest,
        carbonSaved: avgCarbon - greenest.carbonFootprint.kg
      },
      bestValue: {
        result: bestValue,
        score: 85 + Math.floor(Math.random() * 15) // Mock value score
      }
    });
  };

  useEffect(() => {
    performSearch();
  }, [searchParams]);

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="h-5 w-5" />;
      case 'train': return <Train className="h-5 w-5" />;
      case 'bus': return <Bus className="h-5 w-5" />;
      case 'car': return <Car className="h-5 w-5" />;
      default: return <ArrowRight className="h-5 w-5" />;
    }
  };

  const getTransportColor = (type: string) => {
    switch (type) {
      case 'flight': return 'text-sky-600 bg-sky-100';
      case 'train': return 'text-green-600 bg-green-100';
      case 'bus': return 'text-orange-600 bg-orange-100';
      case 'car': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-semibold mb-2">Comparing All Transport Options</h3>
          <p className="text-muted-foreground">
            Searching flights, trains, buses, and car rentals...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Transport Comparison</h2>
        <p className="text-muted-foreground">
          {searchParams.from} → {searchParams.to} • {format(searchParams.departureDate, 'MMM dd, yyyy')}
        </p>
      </div>

      {/* Quick Wins Overview */}
      {comparisonMetrics && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Cheapest Option */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Save ${Math.round(comparisonMetrics.cheapest.savings)}
                  </Badge>
                </div>
                
                <h3 className="font-semibold mb-1">Cheapest</h3>
                <p className="text-2xl font-bold text-green-600 mb-1">
                  ${comparisonMetrics.cheapest.result.price.amount}
                </p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className={cn("p-1 rounded", getTransportColor(comparisonMetrics.cheapest.result.type))}>
                    {getTransportIcon(comparisonMetrics.cheapest.result.type)}
                  </div>
                  <span className="capitalize">{comparisonMetrics.cheapest.result.type}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Fastest Option */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                    Save {Math.round(comparisonMetrics.fastest.timeSaved / 60)}h
                  </Badge>
                </div>
                
                <h3 className="font-semibold mb-1">Fastest</h3>
                <p className="text-2xl font-bold text-blue-600 mb-1">
                  {formatDuration(comparisonMetrics.fastest.result.duration.total)}
                </p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className={cn("p-1 rounded", getTransportColor(comparisonMetrics.fastest.result.type))}>
                    {getTransportIcon(comparisonMetrics.fastest.result.type)}
                  </div>
                  <span className="capitalize">{comparisonMetrics.fastest.result.type}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Greenest Option */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Leaf className="h-5 w-5 text-emerald-600" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                    -{Math.round(comparisonMetrics.greenest.carbonSaved)}kg CO₂
                  </Badge>
                </div>
                
                <h3 className="font-semibold mb-1">Most Eco-Friendly</h3>
                <p className="text-2xl font-bold text-emerald-600 mb-1">
                  {comparisonMetrics.greenest.result.carbonFootprint.kg}kg CO₂
                </p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className={cn("p-1 rounded", getTransportColor(comparisonMetrics.greenest.result.type))}>
                    {getTransportIcon(comparisonMetrics.greenest.result.type)}
                  </div>
                  <span className="capitalize">{comparisonMetrics.greenest.result.type}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Best Value Option */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-amber-600" />
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                    {comparisonMetrics.bestValue.score}% score
                  </Badge>
                </div>
                
                <h3 className="font-semibold mb-1">Best Value</h3>
                <p className="text-2xl font-bold text-amber-600 mb-1">
                  ${comparisonMetrics.bestValue.result.price.amount}
                </p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className={cn("p-1 rounded", getTransportColor(comparisonMetrics.bestValue.result.type))}>
                    {getTransportIcon(comparisonMetrics.bestValue.result.type)}
                  </div>
                  <span className="capitalize">{comparisonMetrics.bestValue.result.type}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Detailed Comparison Tabs */}
      <Tabs value={activeComparison} onValueChange={(value) => setActiveComparison(value as any)}>
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="detailed" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            All Options
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Transport Mode Summary */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Flights Summary */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-sky-100 rounded-lg">
                      <Plane className="h-5 w-5 text-sky-600" />
                    </div>
                    Flights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Options</span>
                      <span className="font-medium">{results.flights.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">From</span>
                      <span className="font-medium">
                        ${Math.min(...results.flights.map(f => f.price.amount), Infinity)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fastest</span>
                      <span className="font-medium">
                        {results.flights.length > 0 ? formatDuration(Math.min(...results.flights.map(f => f.duration.total))) : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trains Summary */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Train className="h-5 w-5 text-green-600" />
                    </div>
                    Trains
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Options</span>
                      <span className="font-medium">{results.trains.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">From</span>
                      <span className="font-medium">
                        {results.trains.length > 0 ? `€${Math.min(...results.trains.map(t => t.price.amount))}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fastest</span>
                      <span className="font-medium">
                        {results.trains.length > 0 ? formatDuration(Math.min(...results.trains.map(t => t.duration.total))) : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Buses Summary */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Bus className="h-5 w-5 text-orange-600" />
                    </div>
                    Buses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Options</span>
                      <span className="font-medium">{results.buses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">From</span>
                      <span className="font-medium">
                        {results.buses.length > 0 ? `$${Math.min(...results.buses.map(b => b.price.amount))}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fastest</span>
                      <span className="font-medium">
                        {results.buses.length > 0 ? formatDuration(Math.min(...results.buses.map(b => b.duration.total))) : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Car Rentals Summary */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Car className="h-5 w-5 text-purple-600" />
                    </div>
                    Car Rentals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Options</span>
                      <span className="font-medium">{results.carRentals.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">From</span>
                      <span className="font-medium">
                        {results.carRentals.length > 0 ? `$${Math.min(...results.carRentals.map(c => c.price.amount))}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Category</span>
                      <span className="font-medium">
                        {results.carRentals.length > 0 ? 'Economy+' : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="detailed">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* All Transport Options */}
            <div className="space-y-4">
              {/* Render top 3 from each category */}
              {results.flights.slice(0, 2).map((flight, index) => (
                <FlightCard key={flight.id} flight={flight} onSelect={() => onResultSelect?.(flight)} />
              ))}
              
              {results.trains.slice(0, 2).map((train, index) => (
                <TrainCard key={train.id} train={train} onSelect={() => onResultSelect?.(train)} />
              ))}
              
              {results.buses.slice(0, 2).map((bus, index) => (
                <BusCard key={bus.id} bus={bus} onSelect={() => onResultSelect?.(bus)} />
              ))}
              
              {results.carRentals.slice(0, 2).map((car, index) => (
                <CarCard key={car.id} car={car} onSelect={() => onResultSelect?.(car)} />
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Individual transport cards
function FlightCard({ flight, onSelect }: { flight: FlightResult; onSelect: () => void }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Plane className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h3 className="font-semibold">{flight.airline.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {flight.from.time} → {flight.to.time} • {flight.duration.formatted}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">${flight.price.amount}</div>
              <Button size="sm" onClick={onSelect}>Select</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TrainCard({ train, onSelect }: { train: TrainResult; onSelect: () => void }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Train className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">{train.operator}</h3>
                <p className="text-sm text-muted-foreground">
                  {train.from.time} → {train.to.time} • {train.duration.formatted}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">€{train.price.amount}</div>
              <Button size="sm" onClick={onSelect}>Select</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BusCard({ bus, onSelect }: { bus: BusResult; onSelect: () => void }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bus className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">{bus.operator}</h3>
                <p className="text-sm text-muted-foreground">
                  {bus.from.time} → {bus.to.time} • {bus.duration.formatted}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">${bus.price.amount}</div>
              <Button size="sm" onClick={onSelect}>Select</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CarCard({ car, onSelect }: { car: CarRentalResult; onSelect: () => void }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Car className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">{car.vehicle.category} - {car.vehicle.model}</h3>
                <p className="text-sm text-muted-foreground">
                  {car.provider} • {car.vehicle.passengers} passengers
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">${car.price.amount}</div>
              <Button size="sm" onClick={onSelect}>Select</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}