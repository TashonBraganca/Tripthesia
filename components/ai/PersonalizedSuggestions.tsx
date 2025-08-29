"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star,
  Users,
  Calendar,
  Accessibility,
  Heart,
  BookOpen,
  TrendingUp,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  Loader2,
  ExternalLink,
  Phone,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface PersonalizedSuggestionsProps {
  destination: string;
  userPreferences?: UserPreferences;
  currentActivities?: Activity[];
  onSuggestionSelect?: (suggestion: PersonalizedSuggestion) => void;
  className?: string;
}

interface UserPreferences {
  interests: string[];
  budget?: number;
  currency?: 'USD' | 'INR';
  travelStyle?: 'budget' | 'mid-range' | 'luxury';
  activityTypes?: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'any';
  duration?: number;
  groupSize?: number;
}

interface Activity {
  title: string;
  location: string;
  category: string;
  time: string;
}

interface PersonalizedSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  location: {
    name: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  estimatedCost: number;
  currency: string;
  duration: number;
  bestTimeToVisit: string[];
  difficulty: 'easy' | 'moderate' | 'challenging';
  crowdLevel: 'low' | 'moderate' | 'high';
  personalizedReason: string;
  tips: string[];
  similarActivities: string[];
  bookingInfo?: {
    advanceBooking: boolean;
    bookingUrl?: string;
    contactInfo?: string;
  };
  accessibility: {
    wheelchairAccessible: boolean;
    publicTransport: boolean;
    walkingRequired: boolean;
  };
  ratings: {
    overall: number;
    authenticity: number;
    valueForMoney: number;
    experienceQuality: number;
  };
  hiddenGem: boolean;
  localInsight: string;
}

interface SuggestionsResponse {
  suggestions: PersonalizedSuggestion[];
  categories: {
    name: string;
    count: number;
    suggestions: string[];
  }[];
  budgetAnalysis: {
    averageCost: number;
    budgetFriendly: number;
    premium: number;
    currency: string;
  };
  localInsights: string[];
  seasonalTips: string[];
}

export default function PersonalizedSuggestions({
  destination,
  userPreferences = { interests: [] },
  currentActivities = [],
  onSuggestionSelect,
  className = ''
}: PersonalizedSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'cost' | 'duration'>('rating');
  const [showHiddenGemsOnly, setShowHiddenGemsOnly] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [likedSuggestions, setLikedSuggestions] = useState<Set<string>>(new Set());

  const loadSuggestions = useCallback(async () => {
    if (!destination) return;

    setIsLoading(true);
    setError(null);

    try {
      const requestData = {
        destination,
        userPreferences,
        currentActivities,
        context: {
          season: getSeasonFromDate(new Date()),
          currentDate: new Date().toISOString(),
        }
      };

      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load suggestions');
      }

      const data = await response.json();
      setSuggestions(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [destination, userPreferences, currentActivities]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const getSeasonFromDate = (date: Date): string => {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'challenging': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCrowdLevelIcon = (level: string) => {
    switch (level) {
      case 'low': return '👥';
      case 'moderate': return '👥👥';
      case 'high': return '👥👥👥';
      default: return '👥';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      sightseeing: '🏛️',
      dining: '🍽️',
      entertainment: '🎭',
      shopping: '🛍️',
      nature: '🌿',
      cultural: '🎨',
      adventure: '🏔️',
      nightlife: '🌃',
      relaxation: '🧘'
    };
    return icons[category] || '📍';
  };

  const toggleLike = (suggestionId: string) => {
    setLikedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const filteredAndSortedSuggestions = suggestions?.suggestions
    .filter(suggestion => {
      if (selectedCategory !== 'all' && suggestion.category !== selectedCategory) return false;
      if (showHiddenGemsOnly && !suggestion.hiddenGem) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.ratings.overall - a.ratings.overall;
        case 'cost':
          return a.estimatedCost - b.estimatedCost;
        case 'duration':
          return a.duration - b.duration;
        default:
          return 0;
      }
    }) || [];

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 text-center ${className}`}>
        <Loader2 className="h-8 w-8 text-purple-600 mx-auto mb-2 animate-spin" />
        <p className="text-gray-600">Finding personalized suggestions for {destination}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Unable to Load Suggestions</h3>
        </div>
        <p className="text-gray-600 text-center mb-4">{error}</p>
        <button
          onClick={loadSuggestions}
          className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!suggestions) return null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Personalized for You</h3>
            <p className="text-sm text-gray-600">{suggestions.suggestions.length} suggestions for {destination}</p>
          </div>
        </div>
        
        <button
          onClick={loadSuggestions}
          disabled={isLoading}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Categories</option>
            {suggestions.categories.map(cat => (
              <option key={cat.name} value={cat.name.toLowerCase()}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'rating' | 'cost' | 'duration')}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="rating">Rating</option>
            <option value="cost">Price</option>
            <option value="duration">Duration</option>
          </select>
        </div>

        <button
          onClick={() => setShowHiddenGemsOnly(!showHiddenGemsOnly)}
          className={`flex items-center space-x-1 text-sm px-3 py-1 rounded-lg border transition-colors ${
            showHiddenGemsOnly
              ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {showHiddenGemsOnly ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          <span>Hidden Gems Only</span>
        </button>
      </div>

      {/* Budget Analysis */}
      {suggestions.budgetAnalysis && (
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Budget Analysis</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-green-700 font-medium">Average Cost</p>
              <p className="text-green-800 font-bold">
                {formatCurrency(suggestions.budgetAnalysis.averageCost, suggestions.budgetAnalysis.currency)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-green-700 font-medium">Budget-Friendly</p>
              <p className="text-green-800 font-bold">{suggestions.budgetAnalysis.budgetFriendly} options</p>
            </div>
            <div className="text-center">
              <p className="text-green-700 font-medium">Premium</p>
              <p className="text-green-800 font-bold">{suggestions.budgetAnalysis.premium} options</p>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions Grid */}
      <div className="space-y-4">
        {filteredAndSortedSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No suggestions match your current filters.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setShowHiddenGemsOnly(false);
              }}
              className="text-purple-600 hover:text-purple-700 mt-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredAndSortedSuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
            >
              {/* Suggestion Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getCategoryIcon(suggestion.category)}</div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                      {suggestion.hiddenGem && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                          💎 Hidden Gem
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                    <div className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                      💡 {suggestion.personalizedReason}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleLike(suggestion.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      likedSuggestions.has(suggestion.id)
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${likedSuggestions.has(suggestion.id) ? 'fill-current' : ''}`} />
                  </button>
                  {onSuggestionSelect && (
                    <button
                      onClick={() => onSuggestionSelect(suggestion)}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                    >
                      Add to Trip
                    </button>
                  )}
                </div>
              </div>

              {/* Suggestion Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-700">{suggestion.location.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-700">
                    {formatCurrency(suggestion.estimatedCost, suggestion.currency)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-700">{suggestion.duration}min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span className="text-gray-700">{suggestion.ratings.overall}/5</span>
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4 text-xs">
                  <span className={`px-2 py-1 rounded-full ${getDifficultyColor(suggestion.difficulty)}`}>
                    {suggestion.difficulty}
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>{getCrowdLevelIcon(suggestion.crowdLevel)}</span>
                    <span className="text-gray-600">{suggestion.crowdLevel} crowds</span>
                  </span>
                  <span className="text-gray-600">
                    Best: {suggestion.bestTimeToVisit.join(', ')}
                  </span>
                </div>
                
                <button
                  onClick={() => setExpandedSuggestion(
                    expandedSuggestion === suggestion.id ? null : suggestion.id
                  )}
                  className="text-purple-600 hover:text-purple-700 text-sm"
                >
                  {expandedSuggestion === suggestion.id ? 'Less' : 'More'} Details
                </button>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedSuggestion === suggestion.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-gray-200"
                  >
                    {/* Location & Address */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">📍 Location</p>
                      <p className="text-sm text-gray-600">{suggestion.location.address}</p>
                    </div>

                    {/* Local Insight */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">💡 Local Insight</p>
                      <p className="text-sm text-gray-600">{suggestion.localInsight}</p>
                    </div>

                    {/* Tips */}
                    {suggestion.tips.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">💫 Tips</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {suggestion.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start space-x-2">
                              <span className="text-purple-600">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Accessibility & Booking Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">♿ Accessibility</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className={`h-3 w-3 ${suggestion.accessibility.wheelchairAccessible ? 'text-green-500' : 'text-gray-400'}`} />
                            <span>Wheelchair accessible</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className={`h-3 w-3 ${suggestion.accessibility.publicTransport ? 'text-green-500' : 'text-gray-400'}`} />
                            <span>Public transport access</span>
                          </div>
                        </div>
                      </div>

                      {suggestion.bookingInfo && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">📞 Booking</p>
                          <div className="space-y-1 text-xs">
                            {suggestion.bookingInfo.advanceBooking && (
                              <p className="text-orange-600">Advance booking recommended</p>
                            )}
                            {suggestion.bookingInfo.bookingUrl && (
                              <a
                                href={suggestion.bookingInfo.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 text-purple-600 hover:text-purple-700"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Book online</span>
                              </a>
                            )}
                            {suggestion.bookingInfo.contactInfo && (
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Phone className="h-3 w-3" />
                                <span>{suggestion.bookingInfo.contactInfo}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Similar Activities */}
                    {suggestion.similarActivities.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">🔗 Similar Activities</p>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.similarActivities.map((activity, actIndex) => (
                            <span
                              key={actIndex}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Local Insights */}
      {suggestions.localInsights.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🏛️ Local Insights</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {suggestions.localInsights.map((insight, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-600">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Seasonal Tips */}
      {suggestions.seasonalTips.length > 0 && (
        <div className="bg-orange-50 rounded-lg p-4">
          <h4 className="font-medium text-orange-900 mb-2">🍂 Seasonal Tips</h4>
          <ul className="text-sm text-orange-800 space-y-1">
            {suggestions.seasonalTips.map((tip, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-orange-600">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}