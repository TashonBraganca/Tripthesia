"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Filter, 
  Star, 
  Users, 
  Wifi, 
  Car, 
  Coffee, 
  Dumbbell, 
  Waves,
  ChevronDown,
  ChevronUp,
  Hotel,
  Building2,
  Home,
  ExternalLink,
  Loader2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  Shield
} from 'lucide-react';
import { HotelClusteringService } from '@/lib/services/hotel-clustering';
import type { 
  HotelClusterAnalysis, 
  GeographicCluster, 
  PriceCluster,
  ClusteringOptions
} from '@/lib/services/hotel-clustering';
import type { HotelOffer, HotelSearchResult } from '@/lib/services/hotel-search';

// ==================== TYPES ====================

interface HotelClusteringResultsProps {
  searchParams: {
    location: {
      type: string;
      value: string;
      coordinates?: [number, number];
      radius?: number;
      countryCode?: string;
    };
    checkIn: string;
    checkOut: string;
    rooms: Array<{
      adults: number;
      children?: number;
      childrenAges?: number[];
    }>;
    filters?: {
      priceRange?: {
        min?: number;
        max?: number;
        currency?: string;
      };
      starRating?: {
        min?: number;
        max?: number;
      };
      amenities?: string[];
      propertyType?: string[];
      guestRating?: {
        min?: number;
      };
      accessibility?: boolean;
      petFriendly?: boolean;
      freeCancellation?: boolean;
      breakfastIncluded?: boolean;
      payAtProperty?: boolean;
    };
    sortBy?: string;
    currency?: string;
    language?: string;
  };
  onSelectHotel?: (hotel: HotelOffer) => void;
  selectedHotels?: HotelOffer[];
  className?: string;
}

interface ClusterViewMode {
  type: 'geographic' | 'price' | 'recommendations';
  label: string;
  icon: React.ComponentType<any>;
}

// ==================== COMPONENT ====================

export function HotelClusteringResults({
  searchParams,
  onSelectHotel,
  selectedHotels = [],
  className = ""
}: HotelClusteringResultsProps) {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotels, setHotels] = useState<HotelOffer[]>([]);
  const [clusteringResult, setClusteringResult] = useState<HotelClusterAnalysis | null>(null);
  
  // UI state
  const [viewMode, setViewMode] = useState<ClusterViewMode['type']>('geographic');
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedStarRating, setSelectedStarRating] = useState<number[]>([]);

  // Services
  const clusteringService = useMemo(() => new HotelClusteringService(), []);

  // View mode configurations
  const viewModes: ClusterViewMode[] = [
    { type: 'geographic', label: 'By Location', icon: MapPin },
    { type: 'price', label: 'By Price', icon: DollarSign },
    { type: 'recommendations', label: 'Recommendations', icon: Star }
  ];

  // ==================== EFFECTS ====================

  // Search for hotels when search params change
  useEffect(() => {
    if (searchParams.location.value && searchParams.checkIn && searchParams.checkOut) {
      searchHotels();
    }
  }, [searchParams]);

  // Cluster hotels when hotel data changes
  useEffect(() => {
    if (hotels.length > 0) {
      clusterHotels();
    }
  }, [hotels]);

  // ==================== API FUNCTIONS ====================

  const searchHotels = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hotels/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) {
        throw new Error(`Hotel search failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.offers) {
        setHotels(result.data.offers);
      } else {
        throw new Error('No hotel data in response');
      }
    } catch (err) {
      console.error('Hotel search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search for hotels');
      setHotels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clusterHotels = async () => {
    try {
      // Create mock search result from hotels data
      const searchResult: HotelSearchResult = {
        query: {
          location: {
            type: 'city' as const,
            value: searchParams.location.value,
            coordinates: searchParams.location.coordinates,
            radius: searchParams.location.radius,
            countryCode: searchParams.location.countryCode
          },
          checkIn: searchParams.checkIn,
          checkOut: searchParams.checkOut,
          rooms: searchParams.rooms,
          filters: undefined,
          sortBy: 'price' as const,
          currency: searchParams.currency || 'INR',
          language: searchParams.language || 'en'
        },
        offers: hotels,
        filters: {
          priceRange: { min: 0, max: 50000 },
          starRatings: [
            { value: 5, count: Math.floor(hotels.length * 0.2) },
            { value: 4, count: Math.floor(hotels.length * 0.3) },
            { value: 3, count: Math.floor(hotels.length * 0.4) },
            { value: 2, count: Math.floor(hotels.length * 0.1) }
          ],
          guestRatings: [
            { range: '9+', count: Math.floor(hotels.length * 0.2) },
            { range: '8-9', count: Math.floor(hotels.length * 0.3) },
            { range: '7-8', count: Math.floor(hotels.length * 0.3) },
            { range: '6-7', count: Math.floor(hotels.length * 0.2) }
          ],
          amenities: [
            { name: 'WiFi', count: Math.floor(hotels.length * 0.9) },
            { name: 'Parking', count: Math.floor(hotels.length * 0.7) },
            { name: 'Pool', count: Math.floor(hotels.length * 0.4) }
          ],
          propertyTypes: [
            { type: 'hotel', count: Math.floor(hotels.length * 0.8) },
            { type: 'resort', count: Math.floor(hotels.length * 0.2) }
          ],
          neighborhoods: []
        },
        meta: {
          totalResults: hotels.length,
          searchTime: Date.now(),
          providers: ['mock'],
          currency: 'INR',
          location: {
            resolved: searchParams.location.value,
            coordinates: searchParams.location.coordinates
          },
          dates: {
            checkIn: searchParams.checkIn,
            checkOut: searchParams.checkOut,
            nights: Math.ceil((new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime()) / (1000 * 60 * 60 * 24))
          },
          lastUpdated: new Date().toISOString(),
          cacheHit: false
        }
      };

      // Create clustering options based on search params
      const options: Partial<ClusteringOptions> = {
        preferences: {
          prioritizeLocation: true,
          prioritizePrice: searchParams.filters?.priceRange ? true : false,
          prioritizeRating: searchParams.filters?.starRating ? true : false,
          travelPurpose: 'leisure'
        }
      };

      const result = await clusteringService.analyzeHotelClusters(searchResult, options);
      setClusteringResult(result);
    } catch (err) {
      console.error('Hotel clustering error:', err);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================

  const formatPrice = (price: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hotel': return Hotel;
      case 'apartment': return Building2;
      case 'hostel': return Home;
      case 'resort': return Waves;
      case 'villa': return Home;
      default: return Hotel;
    }
  };

  const renderStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-current' : 'text-navy-600'}`} 
      />
    ));
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderHotelCard = (hotel: HotelOffer, isCompact: boolean = false) => {
    const isSelected = selectedHotels.some(h => h.id === hotel.id);
    const PropertyIcon = getPropertyTypeIcon(hotel.hotel.propertyType || 'hotel');

    return (
      <motion.div
        key={hotel.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isCompact ? 'p-3' : 'p-4'} rounded-xl border transition-all cursor-pointer ${
          isSelected 
            ? 'bg-teal-900/30 border-teal-500/50 shadow-lg shadow-teal-500/20'
            : 'bg-navy-900/20 border-navy-800/30 hover:bg-navy-800/30 hover:border-navy-700/50'
        }`}
        onClick={() => onSelectHotel?.(hotel)}
      >
        <div className="flex items-start gap-3">
          {/* Property Icon */}
          <div className={`p-2 rounded-lg flex-shrink-0 ${
            isSelected ? 'bg-teal-500/20' : 'bg-navy-800/30'
          }`}>
            <PropertyIcon className={`w-4 h-4 ${
              isSelected ? 'text-teal-300' : 'text-navy-300'
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Hotel Name and Rating */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className={`font-medium text-sm truncate ${
                  isSelected ? 'text-teal-100' : 'text-navy-100'
                }`}>
                  {hotel.hotel.name}
                </h4>
                {hotel.hotel.starRating && (
                  <div className="flex items-center gap-1 mt-1">
                    {renderStarRating(hotel.hotel.starRating)}
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`font-bold text-sm ${
                  isSelected ? 'text-teal-100' : 'text-navy-100'
                }`}>
                  {formatPrice(hotel.pricing.total)}
                </div>
                <div className={`text-xs ${
                  isSelected ? 'text-teal-400' : 'text-navy-400'
                }`}>
                  per night
                </div>
              </div>
            </div>

            {/* Location and Distance */}
            {hotel.hotel.address && (
              <div className="flex items-center gap-1 mb-2">
                <MapPin className={`w-3 h-3 ${
                  isSelected ? 'text-teal-400' : 'text-navy-400'
                }`} />
                <span className={`text-xs truncate ${
                  isSelected ? 'text-teal-300' : 'text-navy-300'
                }`}>
                  {hotel.hotel.address.street || hotel.hotel.address.city}
                </span>
                {/* TODO: Add distance calculation */ false && (
                  <span className={`text-xs ${
                    isSelected ? 'text-teal-400' : 'text-navy-400'
                  }`}>
                    • Distance from center
                  </span>
                )}
              </div>
            )}

            {/* Amenities (first 3) */}
            {hotel.hotel.amenities && Object.values(hotel.hotel.amenities).some(Boolean) && !isCompact && (
              <div className="flex items-center gap-2 mb-2">
                {Object.entries(hotel.hotel.amenities).filter(([, value]) => value).slice(0, 3).map(([amenity], index: number) => (
                  <div key={index} className={`text-xs px-2 py-1 rounded ${
                    isSelected 
                      ? 'bg-teal-800/30 text-teal-300' 
                      : 'bg-navy-800/50 text-navy-400'
                  }`}>
                    {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                  </div>
                ))}
                {Object.values(hotel.hotel.amenities).filter(Boolean).length > 3 && (
                  <span className={`text-xs ${
                    isSelected ? 'text-teal-400' : 'text-navy-400'
                  }`}>
                    +{Object.values(hotel.hotel.amenities).filter(Boolean).length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Guest Rating and Reviews */}
            {hotel.hotel.guestRating && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <div className={`px-2 py-1 rounded font-medium ${
                    hotel.hotel.guestRating.score >= 8.5 
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : hotel.hotel.guestRating.score >= 7.0
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {hotel.hotel.guestRating.score.toFixed(1)}
                  </div>
                  {hotel.hotel.guestRating.reviewCount && (
                    <span className={isSelected ? 'text-teal-400' : 'text-navy-400'}>
                      ({hotel.hotel.guestRating.reviewCount} reviews)
                    </span>
                  )}
                </div>
                {hotel.bookingUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(hotel.bookingUrl, '_blank');
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      isSelected
                        ? 'bg-teal-600 text-teal-100 hover:bg-teal-700'
                        : 'bg-navy-700 text-navy-200 hover:bg-navy-600'
                    }`}
                  >
                    Book
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderGeographicClusters = () => {
    if (!clusteringResult?.geographicClusters) return null;

    return (
      <div className="space-y-4">
        {clusteringResult.geographicClusters.map((cluster: GeographicCluster, index: number) => (
          <div key={index} className="bg-navy-900/20 rounded-xl border border-navy-800/30 overflow-hidden">
            {/* Cluster Header */}
            <div 
              className="p-4 cursor-pointer hover:bg-navy-800/20 transition-colors"
              onClick={() => setExpandedCluster(expandedCluster === cluster.id ? null : cluster.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/20 rounded-lg">
                    <MapPin className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-100">{cluster.area.name}</h3>
                    <p className="text-sm text-navy-300">
                      {cluster.hotels.length} hotels • Avg: {formatPrice(cluster.averagePrice)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-navy-200">
                      {formatPrice(cluster.priceRange.min)} - {formatPrice(cluster.priceRange.max)}
                    </div>
                    <div className="text-xs text-navy-400">Price range</div>
                  </div>
                  {expandedCluster === cluster.id ? 
                    <ChevronUp className="w-5 h-5 text-navy-400" /> : 
                    <ChevronDown className="w-5 h-5 text-navy-400" />
                  }
                </div>
              </div>
            </div>

            {/* Cluster Content */}
            <AnimatePresence>
              {expandedCluster === cluster.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-navy-800/30"
                >
                  <div className="p-4 space-y-3">
                    {cluster.hotels.map((hotel: HotelOffer) => renderHotelCard(hotel, true))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    );
  };

  const renderPriceClusters = () => {
    if (!clusteringResult?.priceClusters) return null;

    return (
      <div className="space-y-4">
        {clusteringResult.priceClusters.map((cluster: PriceCluster, index: number) => (
          <div key={index} className="bg-navy-900/20 rounded-xl border border-navy-800/30 overflow-hidden">
            {/* Price Cluster Header */}
            <div 
              className="p-4 cursor-pointer hover:bg-navy-800/20 transition-colors"
              onClick={() => setExpandedCluster(expandedCluster === cluster.id ? null : cluster.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-100">{cluster.priceRange.label}</h3>
                    <p className="text-sm text-navy-300">
                      {cluster.hotels.length} hotels • {formatPrice(cluster.priceRange.min)} - {formatPrice(cluster.priceRange.max)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-navy-200">
                      Avg: {formatPrice((cluster.priceRange.min + cluster.priceRange.max) / 2)}
                    </div>
                    <div className="text-xs text-navy-400">
                      {cluster.hotels.reduce((sum: number, h: HotelOffer) => sum + (h.hotel.starRating || 3), 0) / cluster.hotels.length} ★ avg
                    </div>
                  </div>
                  {expandedCluster === cluster.id ? 
                    <ChevronUp className="w-5 h-5 text-navy-400" /> : 
                    <ChevronDown className="w-5 h-5 text-navy-400" />
                  }
                </div>
              </div>
            </div>

            {/* Price Cluster Content */}
            <AnimatePresence>
              {expandedCluster === cluster.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-navy-800/30"
                >
                  <div className="p-4 space-y-3">
                    {cluster.hotels.map((hotel: HotelOffer) => renderHotelCard(hotel, true))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!clusteringResult?.recommendations) return null;

    return (
      <div className="space-y-6">
        {/* Top Recommendations */}
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl border border-purple-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Star className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-navy-100">Recommended for You</h3>
              <p className="text-sm text-navy-300">Based on your preferences and budget</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {Object.values(clusteringResult.recommendations).flat().slice(0, 3).map((hotel: HotelOffer, index: number) => (
              <div key={hotel.id} className="flex items-start gap-4 p-3 bg-purple-800/10 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-300 font-medium text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  {renderHotelCard(hotel, false)}
                  <div className="mt-2 text-sm text-purple-300">
                    <strong>Recommended:</strong> {hotel.hotel.name} - Top rated in this area
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        {clusteringResult.insights && (
          <div className="bg-navy-900/20 rounded-xl border border-navy-800/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-navy-100">Market Insights</h3>
                <p className="text-sm text-navy-300">Analysis of available hotels</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-navy-800/20 rounded-lg">
                <div className="text-lg font-bold text-navy-100">
                  {formatPrice(hotels.reduce((sum, hotel) => sum + hotel.pricing.total, 0) / hotels.length)}
                </div>
                <div className="text-sm text-navy-300">Average Price</div>
              </div>
              <div className="p-3 bg-navy-800/20 rounded-lg">
                <div className="text-lg font-bold text-navy-100">
                  {hotels.length}
                </div>
                <div className="text-sm text-navy-300">Hotels Found</div>
              </div>
              <div className="p-3 bg-navy-800/20 rounded-lg">
                <div className="text-lg font-bold text-navy-100">
                  ₹{Math.min(...hotels.map(h => h.pricing.total))} - ₹{Math.max(...hotels.map(h => h.pricing.total))}
                </div>
                <div className="text-sm text-navy-300">Price Range</div>
              </div>
              <div className="p-3 bg-navy-800/20 rounded-lg">
                <div className="text-lg font-bold text-navy-100">
                  {(hotels.reduce((sum, hotel) => sum + (hotel.hotel.guestRating?.score || 7), 0) / hotels.length).toFixed(1)} ★
                </div>
                <div className="text-sm text-navy-300">Average Rating</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-navy-100 mb-2">Searching Hotels</h3>
          <p className="text-navy-300">Finding the best accommodations for you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-navy-100 mb-2">Search Failed</h3>
          <p className="text-navy-300 mb-4">{error}</p>
          <button
            onClick={searchHotels}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!clusteringResult || hotels.length === 0) {
    return (
      <div className={`${className} text-center py-12`}>
        <Hotel className="w-8 h-8 text-navy-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-navy-100 mb-2">No Hotels Found</h3>
        <p className="text-navy-300">Try adjusting your search criteria or location.</p>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Header with View Mode Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-navy-100 mb-1">
            Hotel Clusters & Recommendations
          </h2>
          <p className="text-sm text-navy-300">
            {hotels.length} hotels found • Organized by {viewModes.find(v => v.type === viewMode)?.label.toLowerCase()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.type}
                onClick={() => setViewMode(mode.type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  viewMode === mode.type
                    ? 'bg-teal-600 text-white'
                    : 'bg-navy-800/30 text-navy-300 hover:bg-navy-700/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Summary */}
      {selectedHotels.length > 0 && (
        <div className="bg-teal-900/20 rounded-xl border border-teal-500/30 p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-medium text-teal-100">
                {selectedHotels.length} Hotel{selectedHotels.length !== 1 ? 's' : ''} Selected
              </h3>
              <p className="text-sm text-teal-300">
                Total estimated cost: {formatPrice(selectedHotels.reduce((sum, hotel) => sum + hotel.pricing.total, 0))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clustered Results */}
      <div className="min-h-[400px]">
        {viewMode === 'geographic' && renderGeographicClusters()}
        {viewMode === 'price' && renderPriceClusters()}
        {viewMode === 'recommendations' && renderRecommendations()}
      </div>
    </div>
  );
}