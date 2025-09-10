'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hotel,
  MapPin, 
  Star, 
  Users, 
  Bed, 
  Bath, 
  Wifi, 
  Car, 
  Coffee, 
  Utensils,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Heart,
  Shield,
  TreePine
} from 'lucide-react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { useWizardAPI } from '@/lib/services/wizard-api-integration';
import { InteractiveCard } from '@/components/effects/InteractiveCard';
import { staggerContainer, staggerItem } from '@/lib/animations/variants';

// ==================== TYPES ====================

interface AccommodationOption {
  id: string;
  name: string;
  type: 'hotel' | 'resort' | 'apartment' | 'hostel' | 'guesthouse';
  starRating: number;
  rating: {
    score: number;
    count: number;
    breakdown?: {
      location: number;
      cleanliness: number;
      service: number;
      facilities: number;
    };
  };
  location: {
    address: string;
    distanceFromCenter: number;
    coordinates: [number, number];
    neighborhood?: string;
  };
  price: {
    perNight: number;
    total: number;
    currency: string;
    taxes?: number;
    breakdown?: { [date: string]: number };
  };
  room: {
    type: string;
    size?: string;
    beds: Array<{ type: string; count: number }>;
    maxOccupancy: number;
    view?: string;
  };
  amenities: {
    general: string[];
    room: string[];
    wellness?: string[];
    business?: string[];
  };
  images: string[];
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: {
      free: boolean;
      deadline?: string;
      fee?: number;
    };
    children: boolean;
    pets: boolean;
  };
  sustainability?: {
    certified: boolean;
    practices: string[];
    score: number;
  };
  provider: string;
  bookingUrl?: string;
  score: number;
}

interface AccommodationStepProps {
  className?: string;
}

// ==================== ACCOMMODATION STEP COMPONENT ====================

export const AccommodationStep: React.FC<AccommodationStepProps> = ({ className = '' }) => {
  const { state, updateFormData, completeCurrentStep, validateCurrentStep } = useTripWizard();
  const { searchResults, isSearching, searchHotels, errors } = useWizardAPI();

  // Local state
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationOption | null>(
    state.formData.accommodation?.selectedHotel || null
  );
  const [filterType, setFilterType] = useState<'all' | 'hotel' | 'resort' | 'apartment' | 'hostel'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance' | 'score'>('score');
  const [showMap, setShowMap] = useState(false);

  // Calculate trip duration for total price
  const tripDuration = React.useMemo(() => {
    if (!state.formData.dates.startDate || !state.formData.dates.endDate) return 1;
    
    const start = new Date(state.formData.dates.startDate);
    const end = new Date(state.formData.dates.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays);
  }, [state.formData.dates]);

  // Transform API results to accommodation options
  const accommodationOptions: AccommodationOption[] = React.useMemo(() => {
    return (searchResults.hotels || []).map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      type: hotel.category || 'hotel',
      starRating: hotel.starRating || 4,
      rating: {
        score: hotel.rating || 8.5,
        count: hotel.reviewCount || 100,
        breakdown: {
          location: 8.5,
          cleanliness: 8.8,
          service: 8.3,
          facilities: 8.1
        }
      },
      location: {
        address: hotel.location?.address || '',
        distanceFromCenter: hotel.location?.distanceFromCenter || 2.5,
        coordinates: hotel.location?.coordinates || [0, 0],
        neighborhood: hotel.location?.neighborhood
      },
      price: {
        perNight: hotel.price || 150,
        total: (hotel.price || 150) * tripDuration,
        currency: hotel.currency || 'USD',
        taxes: Math.round((hotel.price || 150) * 0.12),
        breakdown: generatePriceBreakdown(hotel.price || 150, tripDuration, state.formData.dates.startDate)
      },
      room: {
        type: 'Standard Room',
        size: '25 m²',
        beds: [{ type: 'Double', count: 1 }],
        maxOccupancy: 2,
        view: Math.random() > 0.5 ? 'City View' : 'Garden View'
      },
      amenities: {
        general: hotel.amenities || ['WiFi', 'Pool', 'Gym'],
        room: ['Air Conditioning', 'TV', 'Mini Bar', 'Safe'],
        wellness: ['Spa', 'Fitness Center', 'Pool'],
        business: ['Business Center', 'Meeting Rooms', 'WiFi']
      },
      images: hotel.images || [`https://picsum.photos/400/300?random=${Math.random()}`],
      policies: {
        checkIn: '15:00',
        checkOut: '11:00',
        cancellation: {
          free: Math.random() > 0.3,
          deadline: '24 hours before check-in',
          fee: Math.random() > 0.5 ? 50 : undefined
        },
        children: true,
        pets: Math.random() > 0.6
      },
      sustainability: Math.random() > 0.7 ? {
        certified: true,
        practices: ['Solar Energy', 'Water Conservation', 'Local Sourcing'],
        score: 8.2
      } : undefined,
      provider: 'booking.com',
      bookingUrl: hotel.bookingUrl,
      score: calculateAccommodationScore(hotel, tripDuration)
    }));
  }, [searchResults.hotels, tripDuration, state.formData.dates.startDate]);

  // Auto-search when step becomes active
  useEffect(() => {
    if (state.currentStep === 'accommodation' && state.formData.to && state.formData.dates.startDate) {
      searchHotels(state.formData);
    }
  }, [state.currentStep, state.formData.to, state.formData.dates.startDate]);

  // Filter and sort accommodations
  const filteredAndSortedOptions = React.useMemo(() => {
    let filtered = accommodationOptions;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(option => option.type === filterType);
    }
    
    filtered = filtered.filter(option => 
      option.price.perNight >= priceRange[0] && option.price.perNight <= priceRange[1]
    );
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price.perNight - b.price.perNight;
        case 'rating':
          return b.rating.score - a.rating.score;
        case 'distance':
          return a.location.distanceFromCenter - b.location.distanceFromCenter;
        case 'score':
          return b.score - a.score;
        default:
          return 0;
      }
    });
  }, [accommodationOptions, filterType, priceRange, sortBy]);

  // Handle accommodation selection
  const handleAccommodationSelect = useCallback((option: AccommodationOption) => {
    setSelectedAccommodation(option);
    
    updateFormData({
      accommodation: {
        selectedHotel: option,
        alternatives: filteredAndSortedOptions.slice(0, 3).filter(opt => opt.id !== option.id)
      }
    });

    // Auto-complete step if valid selection
    if (validateCurrentStep()) {
      setTimeout(() => {
        completeCurrentStep();
      }, 500);
    }
  }, [filteredAndSortedOptions, updateFormData, validateCurrentStep, completeCurrentStep]);

  // Get accommodation type icon
  const getAccommodationIcon = (type: string) => {
    switch (type) {
      case 'hotel': return Hotel;
      case 'resort': return TreePine;
      case 'apartment': return Bed;
      default: return Hotel;
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={14}
        className={`${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
        }`}
      />
    ));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-navy-100">
          Where will you stay?
        </h2>
        <p className="text-navy-400 max-w-2xl mx-auto">
          Find the perfect accommodation in {state.formData.to?.name} for your {tripDuration}-day stay.
          From budget-friendly options to luxury hotels.
        </p>
      </div>

      {/* Filters and Controls */}
      <div className="space-y-4">
        {/* Type Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'hotel', 'resort', 'apartment', 'hostel'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${filterType === type
                  ? 'bg-teal-400 text-navy-900'
                  : 'bg-navy-700 text-navy-300 hover:bg-navy-600'
                }
              `}
            >
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Price Range and Sort */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <label className="text-sm text-navy-300">Price Range (per night)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-32"
                />
                <span className="text-sm text-navy-300">
                  ${priceRange[0]} - ${priceRange[1]}
                </span>
              </div>
            </div>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-navy-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="score">Best Match</option>
            <option value="price">Lowest Price</option>
            <option value="rating">Highest Rating</option>
            <option value="distance">Closest to Center</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {errors.accommodation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-400/10 border border-red-400/20 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
          <div>
            <div className="font-medium text-red-400">Search Error</div>
            <div className="text-sm text-red-400/80">{errors.accommodation}</div>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="text-center space-y-4">
            <Loader2 className="mx-auto animate-spin text-teal-400" size={32} />
            <div>
              <div className="font-medium text-navy-100">Finding accommodations...</div>
              <div className="text-sm text-navy-400">Searching the best places to stay</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Accommodation Options */}
      {!isSearching && filteredAndSortedOptions.length > 0 && (
        <motion.div
          className="grid gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {filteredAndSortedOptions.map((option) => {
            const Icon = getAccommodationIcon(option.type);
            const isSelected = selectedAccommodation?.id === option.id;

            return (
              <motion.div
                key={option.id}
                variants={staggerItem}
                className="relative"
              >
                <InteractiveCard
                  variant="glass"
                  className={`
                    p-0 overflow-hidden cursor-pointer transition-all duration-300 border
                    ${isSelected 
                      ? 'bg-teal-400/10 border-teal-400 ring-2 ring-teal-400/30' 
                      : 'bg-navy-800/60 border-navy-600 hover:border-navy-500'
                    }
                  `}
                  onClick={() => handleAccommodationSelect(option)}
                >
                  <div className="flex">
                    {/* Image Section */}
                    <div className="relative w-48 h-40 flex-shrink-0">
                      <img
                        src={option.images[0]}
                        alt={option.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Hotel';
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-navy-900/80 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1">
                        <Icon size={14} className="text-teal-400" />
                        <span className="text-xs text-white font-medium">
                          {option.type.charAt(0).toUpperCase() + option.type.slice(1)}
                        </span>
                      </div>
                      {option.sustainability && (
                        <div className="absolute top-2 right-2 bg-green-600/80 backdrop-blur-sm rounded-full p-1">
                          <TreePine size={14} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        {/* Left Content */}
                        <div className="space-y-3 flex-1">
                          {/* Header */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-navy-100 text-lg">{option.name}</h3>
                              <div className="flex items-center">
                                {renderStars(option.starRating)}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-navy-300">
                              <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                <span>{option.location.distanceFromCenter.toFixed(1)} km from center</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users size={14} />
                                <span>{option.room.maxOccupancy} guests max</span>
                              </div>
                            </div>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-3">
                            <div className="bg-teal-400 text-navy-900 px-2 py-1 rounded-md font-bold text-sm">
                              {option.rating.score.toFixed(1)}
                            </div>
                            <div className="text-sm">
                              <span className="text-navy-100 font-medium">Excellent</span>
                              <span className="text-navy-400 ml-1">
                                ({option.rating.count.toLocaleString()} reviews)
                              </span>
                            </div>
                          </div>

                          {/* Amenities */}
                          <div className="flex flex-wrap gap-2">
                            {option.amenities.general.slice(0, 4).map((amenity, idx) => {
                              const amenityIcons: { [key: string]: any } = {
                                'WiFi': Wifi,
                                'Pool': '🏊',
                                'Gym': '💪',
                                'Parking': Car,
                                'Breakfast': Coffee,
                                'Restaurant': Utensils
                              };
                              
                              const IconComponent = amenityIcons[amenity];
                              
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1 text-xs px-2 py-1 bg-navy-700/60 rounded-md text-navy-300"
                                >
                                  {typeof IconComponent === 'string' ? (
                                    <span>{IconComponent}</span>
                                  ) : IconComponent ? (
                                    <IconComponent size={12} />
                                  ) : null}
                                  <span>{amenity}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Policies */}
                          <div className="flex items-center gap-4 text-xs text-navy-400">
                            {option.policies.cancellation.free && (
                              <div className="flex items-center gap-1">
                                <Shield size={12} className="text-green-400" />
                                <span>Free cancellation</span>
                              </div>
                            )}
                            <span>Check-in: {option.policies.checkIn}</span>
                            <span>Check-out: {option.policies.checkOut}</span>
                          </div>
                        </div>

                        {/* Right Content - Pricing */}
                        <div className="text-right space-y-2 ml-6">
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-navy-100">
                              ${option.price.perNight.toLocaleString()}
                            </div>
                            <div className="text-xs text-navy-400">per night</div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-teal-300">
                              ${option.price.total.toLocaleString()}
                            </div>
                            <div className="text-xs text-navy-400">
                              total for {tripDuration} night{tripDuration > 1 ? 's' : ''}
                            </div>
                            {option.price.taxes && (
                              <div className="text-xs text-navy-500">
                                +${option.price.taxes.toLocaleString()} taxes
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    i < Math.round(option.score / 2) 
                                      ? 'bg-teal-400' 
                                      : 'bg-navy-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-navy-400">
                              {option.score.toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-2 -right-2"
                      >
                        <div className="bg-teal-400 rounded-full p-1">
                          <CheckCircle size={20} className="text-navy-900" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </InteractiveCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* No Results */}
      {!isSearching && filteredAndSortedOptions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 space-y-4"
        >
          <div className="text-6xl">🏨</div>
          <div>
            <h3 className="text-lg font-semibold text-navy-100 mb-2">
              No accommodations found
            </h3>
            <p className="text-navy-400">
              Try adjusting your filters or price range to see more options.
            </p>
          </div>
        </motion.div>
      )}

      {/* Selected Accommodation Summary */}
      {selectedAccommodation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-teal-400/10 border border-teal-400/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="text-teal-400 flex-shrink-0" size={20} />
            <div>
              <div className="font-medium text-teal-300">
                Accommodation Selected: {selectedAccommodation.name}
              </div>
              <div className="text-sm text-teal-400/80">
                ${selectedAccommodation.price.total.toLocaleString()} total • {selectedAccommodation.rating.score.toFixed(1)}/10 rating
                {selectedAccommodation.bookingUrl && (
                  <span> • Ready to book when you&#39;re ready</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Helper function to generate price breakdown
function generatePriceBreakdown(basePrice: number, duration: number, startDate: string) {
  const breakdown: { [date: string]: number } = {};
  const start = new Date(startDate);
  
  for (let i = 0; i < duration; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Slight price variation for realism
    const variation = 1 + (Math.random() - 0.5) * 0.2; // ±10% variation
    breakdown[dateStr] = Math.round(basePrice * variation);
  }
  
  return breakdown;
}

// Helper function to calculate accommodation score
function calculateAccommodationScore(hotel: any, tripDuration: number): number {
  let score = 5.0; // Base score
  
  // Rating factor
  if (hotel.rating >= 9) score += 2;
  else if (hotel.rating >= 8) score += 1;
  else if (hotel.rating < 6) score -= 1;
  
  // Price factor (value for money)
  const pricePerNight = hotel.price;
  if (pricePerNight < 100) score += 1;
  else if (pricePerNight > 300) score -= 0.5;
  
  // Amenities factor
  const amenityCount = (hotel.amenities || []).length;
  if (amenityCount > 5) score += 0.5;
  
  // Review count factor (popularity)
  if (hotel.reviewCount > 500) score += 0.5;
  
  return Math.max(0, Math.min(10, score));
}

export default AccommodationStep;