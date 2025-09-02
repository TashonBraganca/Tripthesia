"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Star, 
  Clock, 
  DollarSign,
  Phone,
  ExternalLink,
  Filter,
  Search,
  X,
  Bed,
  Fuel,
  Coffee,
  Car,
  Camera,
  ShoppingBag,
  Hospital,
  Wifi
} from 'lucide-react';
import { POIDetector, type POI, type POICategory, POI_CATEGORIES } from '@/lib/services/poi-detector';
import { GoogleMapsProvider } from '@/lib/services/google-maps-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// POI category icons mapping
const POI_ICONS: Record<POICategory, React.ComponentType<any>> = {
  ACCOMMODATION: Bed,
  FUEL: Fuel,
  DINING: Coffee,
  REST_AREAS: Car,
  ATTRACTIONS: Camera,
  SHOPPING: ShoppingBag,
  SERVICES: Hospital,
  EMERGENCY: Hospital,
};

// POI category colors for visual distinction
const POI_COLORS: Record<POICategory, string> = {
  ACCOMMODATION: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  FUEL: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  DINING: 'text-green-400 bg-green-500/10 border-green-500/20',
  REST_AREAS: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  ATTRACTIONS: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  SHOPPING: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  SERVICES: 'text-red-400 bg-red-500/10 border-red-500/20',
  EMERGENCY: 'text-red-400 bg-red-500/10 border-red-500/20',
};

interface POIRecommendationsProps {
  routeCoordinates?: Array<{ lat: number; lng: number }>;
  className?: string;
  onPOISelect?: (poi: POI) => void;
  onPOIAdd?: (poi: POI) => void;
  maxDistance?: number;
  userPreferences?: {
    categories: POICategory[];
    priceLevel?: number;
    minRating?: number;
  };
}

export default function POIRecommendations({
  routeCoordinates = [],
  className = '',
  onPOISelect,
  onPOIAdd,
  maxDistance = 10000, // 10km default
  userPreferences = {
    categories: Object.keys(POI_CATEGORIES) as POICategory[],
    priceLevel: 4,
    minRating: 3.0
  }
}: POIRecommendationsProps) {
  const [poiDetector] = useState(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'placeholder';
    return new POIDetector(new GoogleMapsProvider(apiKey));
  });
  const [pois, setPOIs] = useState<POI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<POICategory>>(
    new Set(userPreferences.categories)
  );
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'relevance'>('relevance');

  // Fetch POIs based on route coordinates
  const fetchPOIs = useCallback(async () => {
    if (routeCoordinates.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Create a simple route structure from coordinates for POI detection
      const mockRoute = {
        summary: 'Route for POI detection',
        legs: [{
          startAddress: 'Route Start',
          endAddress: 'Route End',
          startLocation: routeCoordinates[0] || { lat: 0, lng: 0 },
          endLocation: routeCoordinates[routeCoordinates.length - 1] || { lat: 0, lng: 0 },
          distance: { text: '0 km', value: 0 },
          duration: { text: '0 min', value: 0 },
          steps: routeCoordinates.map((coord, index) => ({
            startLocation: coord,
            endLocation: routeCoordinates[index + 1] || coord,
            distance: { text: '0 km', value: 0 },
            duration: { text: '0 min', value: 0 },
            instruction: '',
            travelMode: 'DRIVING' as const
          }))
        }],
        overviewPolyline: '',
        bounds: {
          northeast: routeCoordinates[0] || { lat: 0, lng: 0 },
          southwest: routeCoordinates[routeCoordinates.length - 1] || { lat: 0, lng: 0 }
        },
        totalDistance: { text: '0 km', value: 0 },
        totalDuration: { text: '0 min', value: 0 },
        warnings: []
      };

      // Create POI search request
      const searchRequest = {
        route: mockRoute,
        categories: Array.from(selectedCategories),
        maxDistanceFromRoute: maxDistance,
        maxDetourMinutes: 15,
        userPreferences: {
          budget: userPreferences.priceLevel ? (userPreferences.priceLevel <= 2 ? 'low' : userPreferences.priceLevel <= 3 ? 'medium' : 'high') as 'low' | 'medium' | 'high' : undefined
        }
      };

      // Detect POIs along the route
      const searchResult = await poiDetector.findPOIsAlongRoute(searchRequest);

      // Filter POIs based on user preferences
      const filteredPOIs = searchResult.pois.filter((poi: POI) => {
        const matchesSearch = searchQuery === '' || 
          poi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (poi.formattedAddress || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesRating = !userPreferences.minRating || 
          (poi.rating && poi.rating >= userPreferences.minRating);
        
        const matchesPriceLevel = !userPreferences.priceLevel || 
          !poi.pricing?.level || 
          poi.pricing.level <= userPreferences.priceLevel;
        
        return matchesSearch && matchesRating && matchesPriceLevel;
      });

      // Sort POIs
      const sortedPOIs = [...filteredPOIs].sort((a, b) => {
        switch (sortBy) {
          case 'distance':
            return a.distanceFromRoute - b.distanceFromRoute;
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'relevance':
          default:
            return b.recommendationScore - a.recommendationScore;
        }
      });

      setPOIs(sortedPOIs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch POIs');
    } finally {
      setLoading(false);
    }
  }, [routeCoordinates, selectedCategories, maxDistance, searchQuery, sortBy, userPreferences]);

  // Re-fetch POIs when dependencies change
  useEffect(() => {
    fetchPOIs();
  }, [fetchPOIs]);

  // Toggle category filter
  const toggleCategory = (category: POICategory) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  // Format distance for display
  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  // Format price level for display
  const formatPriceLevel = (priceLevel: number) => {
    return '$'.repeat(priceLevel);
  };

  // Render star rating
  const renderRating = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm text-navy-300">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (routeCoordinates.length === 0) {
    return (
      <Card className={`bg-navy-900/50 backdrop-blur-sm border-navy-700/50 ${className}`}>
        <CardContent className="p-6 text-center">
          <MapPin className="w-12 h-12 text-navy-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-navy-200 mb-2">Plan Your Route First</h3>
          <p className="text-navy-400">
            Add waypoints to your route to discover interesting places along the way.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search and filters */}
      <Card className="bg-navy-900/50 backdrop-blur-sm border-navy-700/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-navy-100">
              Points of Interest
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-navy-300 hover:text-navy-100"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-navy-500" />
            <input
              type="text"
              placeholder="Search places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-navy-800/50 border border-navy-600 rounded-lg text-navy-100 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-navy-500 hover:text-navy-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardHeader>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-navy-700/50"
            >
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* Category filters */}
                  <div>
                    <h4 className="text-sm font-medium text-navy-200 mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(POI_CATEGORIES).map(([category, config]) => {
                        const isSelected = selectedCategories.has(category as POICategory);
                        const IconComponent = POI_ICONS[category as POICategory];
                        
                        return (
                          <button
                            key={category}
                            onClick={() => toggleCategory(category as POICategory)}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                              isSelected
                                ? POI_COLORS[category as POICategory]
                                : 'text-navy-400 bg-navy-800/50 border-navy-600 hover:border-navy-500'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span>{config.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sort options */}
                  <div>
                    <h4 className="text-sm font-medium text-navy-200 mb-2">Sort by</h4>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-navy-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="distance">Distance</option>
                      <option value="rating">Rating</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Loading state */}
      {loading && (
        <Card className="bg-navy-900/50 backdrop-blur-sm border-navy-700/50">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-navy-300">Finding interesting places along your route...</p>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="bg-red-900/20 backdrop-blur-sm border-red-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-red-400">{error}</p>
            <Button
              onClick={fetchPOIs}
              size="sm"
              className="mt-2 bg-red-600 hover:bg-red-700 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* POI Results */}
      {!loading && !error && pois.length === 0 && (
        <Card className="bg-navy-900/50 backdrop-blur-sm border-navy-700/50">
          <CardContent className="p-6 text-center">
            <MapPin className="w-12 h-12 text-navy-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-navy-200 mb-2">No Places Found</h3>
            <p className="text-navy-400">
              Try adjusting your filters or expanding the search area.
            </p>
          </CardContent>
        </Card>
      )}

      {/* POI List */}
      <div className="space-y-3">
        <AnimatePresence>
          {pois.map((poi, index) => {
            const IconComponent = POI_ICONS[poi.category];
            
            return (
              <motion.div
                key={poi.placeId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-navy-900/50 backdrop-blur-sm border-navy-700/50 hover:border-navy-600/50 transition-colors cursor-pointer group"
                      onClick={() => onPOISelect?.(poi)}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* POI Icon */}
                      <div className={`p-2 rounded-lg border ${POI_COLORS[poi.category]}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      {/* POI Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-navy-100 group-hover:text-white transition-colors">
                              {poi.name}
                            </h4>
                            <p className="text-sm text-navy-400 mt-1">
                              {poi.formattedAddress || 'Address not available'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-navy-300 font-medium">
                              {formatDistance(poi.distanceFromRoute)}
                            </div>
                            {renderRating(poi.rating)}
                          </div>
                        </div>
                        
                        {/* POI Meta Information */}
                        <div className="flex items-center space-x-4 text-sm text-navy-400">
                          {poi.pricing?.level && (
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-3 h-3" />
                              <span>{formatPriceLevel(poi.pricing.level)}</span>
                            </div>
                          )}
                          
                          {poi.operatingHours?.isOpen !== undefined && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span className={poi.operatingHours.isOpen ? 'text-green-400' : 'text-red-400'}>
                                {poi.operatingHours.isOpen ? 'Open' : 'Closed'}
                              </span>
                            </div>
                          )}
                          
                          {poi.contact?.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>Available</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2">
                        {onPOIAdd && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPOIAdd(poi);
                            }}
                            className="bg-teal-600 hover:bg-teal-700 text-white"
                          >
                            Add Stop
                          </Button>
                        )}
                        
                        {poi.contact?.website && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(poi.contact?.website!, '_blank');
                            }}
                            className="text-navy-400 hover:text-navy-200"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Results summary */}
      {pois.length > 0 && (
        <div className="text-center text-sm text-navy-400 pt-4">
          Showing {pois.length} places along your route
        </div>
      )}
    </div>
  );
}