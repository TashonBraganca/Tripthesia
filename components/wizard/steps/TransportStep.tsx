'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, 
  Car, 
  Train, 
  Bus, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { useWizardAPI } from '@/lib/services/wizard-api-integration';
import { InteractiveCard } from '@/components/effects/InteractiveCard';
import { staggerContainer, staggerItem } from '@/lib/animations/variants';

// ==================== TYPES ====================

interface TransportOption {
  id: string;
  type: 'flight' | 'car' | 'train' | 'bus';
  provider: string;
  name: string;
  duration: string;
  price: number;
  currency: string;
  departure?: {
    time: string;
    location: string;
    terminal?: string;
  };
  arrival?: {
    time: string;
    location: string;
    terminal?: string;
  };
  stops?: number;
  amenities: string[];
  sustainability: {
    emissions: number;
    rating: 'low' | 'medium' | 'high';
  };
  comfort: 'economy' | 'comfort' | 'premium' | 'luxury';
  bookingUrl?: string;
  score: number;
}

interface TransportStepProps {
  className?: string;
}

// ==================== TRANSPORT STEP COMPONENT ====================

export const TransportStep: React.FC<TransportStepProps> = ({ className = '' }) => {
  const { state, updateFormData, completeCurrentStep, validateCurrentStep } = useTripWizard();
  const { searchResults, isSearching, searchTripData, errors } = useWizardAPI();

  // Local state
  const [selectedTransport, setSelectedTransport] = useState<TransportOption | null>(
    state.formData.transport?.selectedFlight || null
  );
  const [filterType, setFilterType] = useState<'all' | 'flight' | 'car' | 'train' | 'bus'>('all');
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'score'>('score');
  const [showComparison, setShowComparison] = useState(false);

  // Transform API results to our transport options format
  const transportOptions: TransportOption[] = React.useMemo(() => {
    const flights = (searchResults.flights || []).map(flight => ({
      id: flight.id,
      type: 'flight' as const,
      provider: flight.provider || 'Unknown',
      name: `${flight.airline} ${flight.flightNumber || ''}`,
      duration: flight.duration,
      price: flight.price,
      currency: flight.currency || 'USD',
      departure: {
        time: flight.departure?.time || '',
        location: flight.departure?.airport || '',
        terminal: flight.departure?.terminal
      },
      arrival: {
        time: flight.arrival?.time || '',
        location: flight.arrival?.airport || '',
        terminal: flight.arrival?.terminal
      },
      stops: flight.stops || 0,
      amenities: flight.amenities || ['Standard seat', 'Refreshments'],
      sustainability: {
        emissions: 150 + Math.random() * 100,
        rating: 'medium' as const
      },
      comfort: flight.cabinClass || 'economy',
      bookingUrl: flight.bookingLink,
      score: flight.score || 5
    }));

    const transport = (searchResults.transport || []).map(option => ({
      id: option.id,
      type: option.type as 'car' | 'train' | 'bus',
      provider: option.provider,
      name: `${option.type.charAt(0).toUpperCase() + option.type.slice(1)} Transport`,
      duration: option.duration ? `${Math.floor(option.duration / 60)}h ${option.duration % 60}m` : '2h 30m',
      price: option.price,
      currency: option.currency || 'USD',
      stops: 0,
      amenities: option.instructions?.slice(0, 3) || ['Direct route'],
      sustainability: {
        emissions: option.type === 'train' ? 20 : option.type === 'bus' ? 40 : 120,
        rating: option.type === 'train' ? 'low' : option.type === 'bus' ? 'medium' : 'high'
      },
      comfort: 'comfort' as const,
      score: option.type === 'train' ? 8 : option.type === 'bus' ? 6 : 7
    }));

    return [...flights, ...transport];
  }, [searchResults.flights, searchResults.transport]);

  // Filter and sort options
  const filteredAndSortedOptions = React.useMemo(() => {
    let filtered = transportOptions;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(option => option.type === filterType);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'duration':
          return a.duration.localeCompare(b.duration);
        case 'score':
          return b.score - a.score;
        default:
          return 0;
      }
    });
  }, [transportOptions, filterType, sortBy]);

  // Auto-search when step becomes active
  useEffect(() => {
    if (state.currentStep === 'transport' && state.formData.from && state.formData.to) {
      searchTripData(state.formData, 'transport', {
        debounceMs: 0 // Immediate search for transport step
      });
    }
  }, [state.currentStep, state.formData.from, state.formData.to]);

  // Handle transport selection
  const handleTransportSelect = useCallback((option: TransportOption) => {
    setSelectedTransport(option);
    
    updateFormData({
      transport: {
        selectedFlight: option.type === 'flight' ? option : undefined,
        selectedTransport: option.type !== 'flight' ? option : undefined,
        alternatives: filteredAndSortedOptions.slice(0, 5).filter(opt => opt.id !== option.id)
      }
    });

    // Auto-complete step if valid selection
    if (validateCurrentStep()) {
      setTimeout(() => {
        completeCurrentStep();
      }, 500);
    }
  }, [filteredAndSortedOptions, updateFormData, validateCurrentStep, completeCurrentStep]);

  // Get icon for transport type
  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'flight': return Plane;
      case 'car': return Car;
      case 'train': return Train;
      case 'bus': return Bus;
      default: return MapPin;
    }
  };

  // Get sustainability color
  const getSustainabilityColor = (rating: string) => {
    switch (rating) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-navy-100">
          How will you get there?
        </h2>
        <p className="text-navy-400 max-w-2xl mx-auto">
          Choose your preferred transportation option. We'll find the best routes and prices for your journey
          from {state.formData.from?.name} to {state.formData.to?.name}.
        </p>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(['all', 'flight', 'car', 'train', 'bus'] as const).map((type) => (
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
              {type === 'all' ? 'All Options' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'price' | 'duration' | 'score')}
          className="px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-navy-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="score">Best Match</option>
          <option value="price">Lowest Price</option>
          <option value="duration">Shortest Duration</option>
        </select>
      </div>

      {/* Error Display */}
      {errors.transport && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-400/10 border border-red-400/20 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
          <div>
            <div className="font-medium text-red-400">Search Error</div>
            <div className="text-sm text-red-400/80">{errors.transport}</div>
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
              <div className="font-medium text-navy-100">Searching for transport options...</div>
              <div className="text-sm text-navy-400">This may take a few seconds</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transport Options */}
      {!isSearching && filteredAndSortedOptions.length > 0 && (
        <motion.div
          className="grid gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {filteredAndSortedOptions.map((option, index) => {
            const Icon = getTransportIcon(option.type);
            const isSelected = selectedTransport?.id === option.id;

            return (
              <motion.div
                key={option.id}
                variants={staggerItem}
                className="relative"
              >
                <InteractiveCard
                  variant="glass"
                  className={`
                    p-6 cursor-pointer transition-all duration-300 border
                    ${isSelected 
                      ? 'bg-teal-400/10 border-teal-400 ring-2 ring-teal-400/30' 
                      : 'bg-navy-800/60 border-navy-600 hover:border-navy-500'
                    }
                  `}
                  onClick={() => handleTransportSelect(option)}
                >
                  <div className="flex items-center justify-between">
                    {/* Left Section */}
                    <div className="flex items-center gap-4">
                      <div className={`
                        p-3 rounded-lg transition-colors duration-300
                        ${isSelected ? 'bg-teal-400/20 text-teal-300' : 'bg-navy-700 text-navy-300'}
                      `}>
                        <Icon size={24} />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-navy-100">{option.name}</h3>
                          <span className="text-xs text-navy-400">by {option.provider}</span>
                        </div>
                        
                        {option.departure && option.arrival && (
                          <div className="flex items-center gap-4 text-sm text-navy-300">
                            <div className="flex items-center gap-1">
                              <span>{option.departure.time}</span>
                              <span className="text-navy-500">from</span>
                              <span>{option.departure.location}</span>
                            </div>
                            <ArrowRight size={14} className="text-navy-500" />
                            <div className="flex items-center gap-1">
                              <span>{option.arrival.time}</span>
                              <span className="text-navy-500">to</span>
                              <span>{option.arrival.location}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-navy-400">
                            <Clock size={14} />
                            <span>{option.duration}</span>
                          </div>
                          
                          {option.stops > 0 && (
                            <div className="text-yellow-400">
                              {option.stops} stop{option.stops > 1 ? 's' : ''}
                            </div>
                          )}
                          
                          <div className={`flex items-center gap-1 ${getSustainabilityColor(option.sustainability.rating)}`}>
                            <span className="text-xs">CO₂:</span>
                            <span className="text-xs">{Math.round(option.sustainability.emissions)}kg</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="text-right space-y-2">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-navy-100">
                          ${option.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-navy-400">
                          per person • {option.currency}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2">
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

                  {/* Amenities */}
                  <div className="mt-4 pt-4 border-t border-navy-600">
                    <div className="flex flex-wrap gap-2">
                      {option.amenities.slice(0, 4).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-navy-700/60 rounded-md text-navy-300"
                        >
                          {amenity}
                        </span>
                      ))}
                      {option.amenities.length > 4 && (
                        <span className="text-xs px-2 py-1 bg-navy-700/60 rounded-md text-navy-400">
                          +{option.amenities.length - 4} more
                        </span>
                      )}
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
          <div className="text-6xl">🚫</div>
          <div>
            <h3 className="text-lg font-semibold text-navy-100 mb-2">
              No transport options found
            </h3>
            <p className="text-navy-400">
              Try adjusting your filters or check back later for more options.
            </p>
          </div>
        </motion.div>
      )}

      {/* Selected Transport Summary */}
      {selectedTransport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-teal-400/10 border border-teal-400/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="text-teal-400 flex-shrink-0" size={20} />
            <div>
              <div className="font-medium text-teal-300">
                Transport Selected: {selectedTransport.name}
              </div>
              <div className="text-sm text-teal-400/80">
                ${selectedTransport.price.toLocaleString()} • {selectedTransport.duration}
                {selectedTransport.bookingUrl && (
                  <span> • Ready to book when you're ready</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TransportStep;