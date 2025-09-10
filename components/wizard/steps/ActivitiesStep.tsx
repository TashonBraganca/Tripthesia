'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin,
  Clock,
  Users,
  Star,
  Camera,
  Utensils,
  Mountain,
  Building2,
  Waves,
  TreePine,
  Palette,
  Music,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Heart,
  Calendar,
  DollarSign,
  Accessibility,
  Shield,
  Award
} from 'lucide-react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { useWizardAPI } from '@/lib/services/wizard-api-integration';
import { InteractiveCard } from '@/components/effects/InteractiveCard';
import { staggerContainer, staggerItem } from '@/lib/animations/variants';

// ==================== TYPES ====================

interface ActivityOption {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  location: {
    name: string;
    address?: string;
    coordinates?: [number, number];
    meetingPoint?: string;
    distanceFromCenter?: number;
  };
  duration: {
    min: number; // minutes
    max?: number;
    formatted: string;
    fullDay?: boolean;
  };
  price: {
    adult: number;
    child?: number;
    currency: string;
    formatted: string;
    includes: string[];
    excludes?: string[];
  };
  schedule: {
    availability: 'daily' | 'selected_days' | 'seasonal';
    times?: string[];
    days?: string[];
    advanceBooking?: number; // days required
  };
  group: {
    minSize?: number;
    maxSize?: number;
    private?: boolean;
    shared?: boolean;
  };
  difficulty: 'easy' | 'moderate' | 'challenging' | 'extreme';
  ageRestriction: {
    min?: number;
    max?: number;
    childFriendly: boolean;
  };
  accessibility: {
    wheelchairAccessible: boolean;
    mobilityImpaired: boolean;
    notes?: string;
  };
  rating: {
    score: number;
    count: number;
    breakdown?: {
      value: number;
      guide: number;
      organization: number;
      safety: number;
    };
  };
  highlights: string[];
  includes: string[];
  whatToBring?: string[];
  images: string[];
  booking: {
    url?: string;
    instantConfirmation: boolean;
    mobileTicket: boolean;
    cancellation: {
      allowed: boolean;
      deadline?: string;
      refund?: number; // percentage
    };
  };
  provider: string;
  score: number;
  isPopular?: boolean;
  isNew?: boolean;
}

interface ActivitiesStepProps {
  className?: string;
}

// Activity categories with icons
const ACTIVITY_CATEGORIES = {
  'all': { icon: MapPin, label: 'All Activities' },
  'sightseeing': { icon: Camera, label: 'Sightseeing' },
  'adventure': { icon: Mountain, label: 'Adventure' },
  'culture': { icon: Building2, label: 'Culture & History' },
  'nature': { icon: TreePine, label: 'Nature & Wildlife' },
  'food': { icon: Utensils, label: 'Food & Drink' },
  'art': { icon: Palette, label: 'Arts & Entertainment' },
  'music': { icon: Music, label: 'Music & Shows' },
  'water-sports': { icon: Waves, label: 'Water Sports' }
};

// ==================== ACTIVITIES STEP COMPONENT ====================

export const ActivitiesStep: React.FC<ActivitiesStepProps> = ({ className = '' }) => {
  const { state, updateFormData, completeCurrentStep, validateCurrentStep } = useTripWizard();
  const { searchResults, isSearching, searchActivities, errors } = useWizardAPI();

  // Local state
  const [selectedActivities, setSelectedActivities] = useState<ActivityOption[]>(
    state.formData.activities || []
  );
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'duration' | 'popularity'>('popularity');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [maxActivities] = useState(8); // Limit selection

  // Transform API results to activity options
  const activityOptions: ActivityOption[] = React.useMemo(() => {
    return (searchResults.activities || []).map(activity => ({
      id: activity.id,
      name: activity.name,
      description: activity.description,
      category: activity.category || 'sightseeing',
      subcategory: activity.subcategory,
      tags: activity.tags || [],
      location: {
        name: activity.location?.name || 'City Center',
        address: activity.location?.address,
        coordinates: activity.location?.coordinates,
        meetingPoint: activity.location?.meetingPoint,
        distanceFromCenter: Math.random() * 10 + 1 // Mock data
      },
      duration: {
        min: activity.duration || 120,
        max: activity.duration ? activity.duration + 30 : undefined,
        formatted: formatDuration(activity.duration || 120),
        fullDay: (activity.duration || 120) > 360 // More than 6 hours
      },
      price: {
        adult: activity.price || 50,
        child: activity.price ? Math.round(activity.price * 0.7) : undefined,
        currency: activity.currency || 'USD',
        formatted: `$${activity.price || 50}`,
        includes: ['Professional guide', 'Entry fees'],
        excludes: ['Food and drinks', 'Transportation']
      },
      schedule: {
        availability: 'daily',
        times: ['09:00', '14:00', '18:00'],
        advanceBooking: 1
      },
      group: {
        minSize: 1,
        maxSize: 15,
        private: Math.random() > 0.7,
        shared: true
      },
      difficulty: getDifficultyFromCategory(activity.category),
      ageRestriction: {
        min: activity.category === 'adventure' ? 12 : undefined,
        childFriendly: activity.category !== 'adventure'
      },
      accessibility: {
        wheelchairAccessible: Math.random() > 0.6,
        mobilityImpaired: Math.random() > 0.4,
        notes: Math.random() > 0.7 ? 'Some walking required' : undefined
      },
      rating: {
        score: activity.rating || (8 + Math.random() * 2),
        count: activity.reviewCount || Math.floor(Math.random() * 500) + 50,
        breakdown: {
          value: 8.5,
          guide: 8.8,
          organization: 8.3,
          safety: 9.1
        }
      },
      highlights: generateHighlights(activity.category),
      includes: ['Professional guide', 'Entry fees', 'Small group'],
      whatToBring: ['Comfortable shoes', 'Camera', 'Water bottle'],
      images: activity.images || [`https://picsum.photos/400/300?random=${Math.random()}`],
      booking: {
        url: activity.bookingUrl,
        instantConfirmation: true,
        mobileTicket: true,
        cancellation: {
          allowed: true,
          deadline: '24 hours',
          refund: 100
        }
      },
      provider: 'getyourguide',
      score: calculateActivityScore(activity),
      isPopular: Math.random() > 0.7,
      isNew: Math.random() > 0.9
    }));
  }, [searchResults.activities]);

  // Auto-search when step becomes active
  useEffect(() => {
    if (state.currentStep === 'activities' && state.formData.to) {
      searchActivities(state.formData);
    }
  }, [state.currentStep, state.formData.to]);

  // Filter and sort activities
  const filteredAndSortedOptions = React.useMemo(() => {
    let filtered = activityOptions;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(activity => activity.category === filterCategory);
    }
    
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(activity => activity.difficulty === filterDifficulty);
    }
    
    filtered = filtered.filter(activity => 
      activity.price.adult >= priceRange[0] && activity.price.adult <= priceRange[1]
    );
    
    if (showOnlyAvailable) {
      filtered = filtered.filter(activity => activity.schedule.availability === 'daily');
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price.adult - b.price.adult;
        case 'rating':
          return b.rating.score - a.rating.score;
        case 'duration':
          return a.duration.min - b.duration.min;
        case 'popularity':
          return b.score - a.score;
        default:
          return 0;
      }
    });
  }, [activityOptions, filterCategory, filterDifficulty, priceRange, sortBy, showOnlyAvailable]);

  // Handle activity selection/deselection
  const handleActivityToggle = useCallback((activity: ActivityOption) => {
    const isSelected = selectedActivities.some(a => a.id === activity.id);
    let newSelection: ActivityOption[];

    if (isSelected) {
      newSelection = selectedActivities.filter(a => a.id !== activity.id);
    } else {
      if (selectedActivities.length >= maxActivities) {
        return; // Don't add more than max allowed
      }
      newSelection = [...selectedActivities, activity];
    }

    setSelectedActivities(newSelection);
    updateFormData({ activities: newSelection });
  }, [selectedActivities, maxActivities, updateFormData]);

  // Complete step when activities are selected
  const handleContinue = useCallback(() => {
    if (selectedActivities.length > 0 && validateCurrentStep()) {
      completeCurrentStep();
    }
  }, [selectedActivities, validateCurrentStep, completeCurrentStep]);

  // Get category icon
  const getCategoryIcon = (category: string) => {
    return ACTIVITY_CATEGORIES[category as keyof typeof ACTIVITY_CATEGORIES]?.icon || MapPin;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'challenging': return 'text-orange-400';
      case 'extreme': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-navy-100">
          What would you like to do?
        </h2>
        <p className="text-navy-400 max-w-2xl mx-auto">
          Discover amazing experiences in {state.formData.to?.name}. 
          Select up to {maxActivities} activities that interest you.
        </p>
        
        {/* Selection Counter */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-navy-300">
            {selectedActivities.length} of {maxActivities} selected
          </span>
          <div className="flex gap-1">
            {Array.from({ length: maxActivities }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < selectedActivities.length ? 'bg-teal-400' : 'bg-navy-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="space-y-4">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(ACTIVITY_CATEGORIES).map(([key, { icon: Icon, label }]) => (
            <button
              key={key}
              onClick={() => setFilterCategory(key)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${filterCategory === key
                  ? 'bg-teal-400 text-navy-900'
                  : 'bg-navy-700 text-navy-300 hover:bg-navy-600'
                }
              `}
            >
              <Icon size={16} />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>

        {/* Additional Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Difficulty Filter */}
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 bg-navy-700 border border-navy-600 rounded-lg text-navy-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="all">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="challenging">Challenging</option>
              <option value="extreme">Extreme</option>
            </select>

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-navy-300">Price:</span>
              <input
                type="range"
                min="0"
                max="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="w-24"
              />
              <span className="text-sm text-navy-300 w-20">
                $0-${priceRange[1]}
              </span>
            </div>

            {/* Available Only Toggle */}
            <label className="flex items-center gap-2 text-sm text-navy-300">
              <input
                type="checkbox"
                checked={showOnlyAvailable}
                onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                className="rounded"
              />
              Available today
            </label>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-navy-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="popularity">Most Popular</option>
            <option value="rating">Highest Rating</option>
            <option value="price">Lowest Price</option>
            <option value="duration">Shortest Duration</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {errors.activities && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-400/10 border border-red-400/20 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
          <div>
            <div className="font-medium text-red-400">Search Error</div>
            <div className="text-sm text-red-400/80">{errors.activities}</div>
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
              <div className="font-medium text-navy-100">Finding activities...</div>
              <div className="text-sm text-navy-400">Discovering the best experiences</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Activities Grid */}
      {!isSearching && filteredAndSortedOptions.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {filteredAndSortedOptions.map((activity) => {
            const Icon = getCategoryIcon(activity.category);
            const isSelected = selectedActivities.some(a => a.id === activity.id);
            const canSelect = !isSelected && selectedActivities.length < maxActivities;

            return (
              <motion.div
                key={activity.id}
                variants={staggerItem}
                className="relative"
              >
                <InteractiveCard
                  variant="glass"
                  className={`
                    p-0 overflow-hidden cursor-pointer transition-all duration-300 border h-full
                    ${isSelected 
                      ? 'bg-teal-400/10 border-teal-400 ring-2 ring-teal-400/30' 
                      : canSelect
                        ? 'bg-navy-800/60 border-navy-600 hover:border-navy-500'
                        : 'bg-navy-800/30 border-navy-700 opacity-60 cursor-not-allowed'
                    }
                  `}
                  onClick={() => canSelect || isSelected ? handleActivityToggle(activity) : undefined}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={activity.images[0]}
                      alt={activity.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Activity';
                      }}
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-2">
                      <div className="bg-navy-900/80 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1">
                        <Icon size={12} className="text-teal-400" />
                        <span className="text-xs text-white font-medium capitalize">
                          {activity.category.replace('-', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {activity.isPopular && (
                        <div className="bg-orange-500/80 backdrop-blur-sm rounded-md px-2 py-1">
                          <Award size={12} className="text-white" />
                        </div>
                      )}
                      {activity.isNew && (
                        <div className="bg-green-500/80 backdrop-blur-sm rounded-md px-2 py-1">
                          <span className="text-xs text-white font-bold">NEW</span>
                        </div>
                      )}
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute bottom-2 left-2 bg-teal-400 text-navy-900 px-2 py-1 rounded-md font-bold text-sm">
                      {activity.rating.score.toFixed(1)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Title and Description */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-navy-100 line-clamp-2 leading-tight">
                        {activity.name}
                      </h3>
                      <p className="text-sm text-navy-400 line-clamp-2">
                        {activity.description}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-navy-300">
                          <Clock size={14} />
                          <span>{activity.duration.formatted}</span>
                        </div>
                        <div className="flex items-center gap-1 text-navy-300">
                          <Users size={14} />
                          <span>Max {activity.group.maxSize}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1 ${getDifficultyColor(activity.difficulty)}`}>
                          <span className="text-xs font-medium uppercase">{activity.difficulty}</span>
                        </div>
                        {activity.accessibility.wheelchairAccessible && (
                          <div className="flex items-center gap-1 text-blue-400">
                            <Accessibility size={14} />
                            <span className="text-xs">Accessible</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="flex flex-wrap gap-1">
                      {activity.highlights.slice(0, 2).map((highlight, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-navy-700/60 rounded-md text-navy-300"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>

                    {/* Price and Booking */}
                    <div className="flex items-center justify-between pt-2 border-t border-navy-600">
                      <div>
                        <div className="text-lg font-bold text-navy-100">
                          ${activity.price.adult}
                        </div>
                        <div className="text-xs text-navy-400">per person</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {activity.booking.instantConfirmation && (
                          <div className="flex items-center gap-1 text-green-400">
                            <CheckCircle size={12} />
                            <span className="text-xs">Instant</span>
                          </div>
                        )}
                        {activity.booking.cancellation.allowed && (
                          <div className="flex items-center gap-1 text-blue-400">
                            <Shield size={12} />
                            <span className="text-xs">Free cancel</span>
                          </div>
                        )}
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
          <div className="text-6xl">🎯</div>
          <div>
            <h3 className="text-lg font-semibold text-navy-100 mb-2">
              No activities found
            </h3>
            <p className="text-navy-400">
              Try adjusting your filters to discover more experiences.
            </p>
          </div>
        </motion.div>
      )}

      {/* Selected Activities Summary */}
      {selectedActivities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-teal-400/10 border border-teal-400/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-teal-400 flex-shrink-0" size={20} />
                <div>
                  <div className="font-medium text-teal-300">
                    {selectedActivities.length} Activit{selectedActivities.length > 1 ? 'ies' : 'y'} Selected
                  </div>
                  <div className="text-sm text-teal-400/80">
                    Total estimated cost: ${selectedActivities.reduce((sum, a) => sum + a.price.adult, 0).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleContinue}
                className="px-4 py-2 bg-teal-400 text-navy-900 font-medium rounded-lg hover:bg-teal-300 transition-colors duration-200"
              >
                Continue to Review
              </button>
            </div>
            
            {/* Selected Activities List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-2 bg-navy-800/40 rounded-md"
                >
                  <img
                    src={activity.images[0]}
                    alt={activity.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-navy-100 text-sm truncate">
                      {activity.name}
                    </div>
                    <div className="text-xs text-navy-400">
                      ${activity.price.adult} • {activity.duration.formatted}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Helper functions
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours}h ${mins}m`;
}

function getDifficultyFromCategory(category: string): 'easy' | 'moderate' | 'challenging' | 'extreme' {
  switch (category) {
    case 'adventure': return 'challenging';
    case 'sightseeing': return 'easy';
    case 'culture': return 'easy';
    case 'nature': return 'moderate';
    case 'water-sports': return 'challenging';
    default: return 'moderate';
  }
}

function generateHighlights(category: string): string[] {
  const highlights: Record<string, string[]> = {
    'sightseeing': ['Iconic landmarks', 'Photo opportunities', 'Historical insights'],
    'adventure': ['Adrenaline rush', 'Expert guides', 'Safety equipment'],
    'culture': ['Local traditions', 'Expert storytelling', 'Authentic experience'],
    'nature': ['Wildlife viewing', 'Scenic routes', 'Environmental learning'],
    'food': ['Local cuisine', 'Chef guidance', 'Market visits'],
    'art': ['Creative workshops', 'Artist interactions', 'Unique creations'],
    'music': ['Live performances', 'Cultural immersion', 'Local artists']
  };
  
  return highlights[category] || ['Great experience', 'Expert guide', 'Memorable moments'];
}

function calculateActivityScore(activity: any): number {
  let score = 5.0; // Base score
  
  // Rating factor
  if (activity.rating >= 9) score += 2;
  else if (activity.rating >= 8) score += 1;
  else if (activity.rating < 6) score -= 1;
  
  // Price factor (value for money)
  const price = activity.price;
  if (price < 30) score += 1;
  else if (price > 150) score -= 0.5;
  
  // Category popularity
  const popularCategories = ['sightseeing', 'culture', 'adventure'];
  if (popularCategories.includes(activity.category)) score += 0.5;
  
  return Math.max(0, Math.min(10, score));
}

export default ActivitiesStep;