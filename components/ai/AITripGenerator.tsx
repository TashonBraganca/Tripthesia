"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Plane,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Share,
  Heart
} from 'lucide-react';

interface AITripGeneratorProps {
  onTripGenerated?: (trip: GeneratedTrip) => void;
  className?: string;
}

interface GeneratedTrip {
  title: string;
  overview: string;
  dailyItinerary: DailyItinerary[];
  budgetBreakdown: BudgetBreakdown;
  recommendations: Recommendations;
  localInsights: string[];
  hiddenGems: string[];
  metadata: {
    generatedAt: string;
    model: string;
    userId: string;
  };
}

interface DailyItinerary {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
  estimatedCost: number;
  transportation: string[];
}

interface Activity {
  time: string;
  title: string;
  description: string;
  location: string;
  duration: number;
  category: 'sightseeing' | 'dining' | 'entertainment' | 'shopping' | 'transport' | 'accommodation';
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  tips: string[];
}

interface BudgetBreakdown {
  accommodation: number;
  food: number;
  activities: number;
  transportation: number;
  shopping: number;
  miscellaneous: number;
  total: number;
  currency: string;
}

interface Recommendations {
  bestTimeToVisit: string;
  weatherTips: string[];
  culturalTips: string[];
  safetyTips: string[];
  packingTips: string[];
}

interface TripGenerationForm {
  destination: string;
  duration: number;
  budget: number;
  currency: 'USD' | 'INR';
  interests: string[];
  travelStyle: 'budget' | 'mid-range' | 'luxury';
  groupSize: number;
  accommodation: 'hostel' | 'hotel' | 'resort' | 'apartment';
  transportation: 'flight' | 'train' | 'bus' | 'car';
  specialRequests: string;
}

const interestOptions = [
  'Historical Sites', 'Museums', 'Food & Cuisine', 'Nature & Wildlife',
  'Adventure Sports', 'Shopping', 'Nightlife', 'Art & Culture',
  'Photography', 'Local Festivals', 'Architecture', 'Beaches',
  'Mountains', 'Religious Sites', 'Markets', 'Music'
];

const destinations = [
  'Tokyo, Japan', 'Paris, France', 'New York, USA', 'London, UK',
  'Bangkok, Thailand', 'Singapore', 'Dubai, UAE', 'Sydney, Australia',
  'Rome, Italy', 'Barcelona, Spain', 'Mumbai, India', 'Delhi, India',
  'Goa, India', 'Kerala, India', 'Rajasthan, India', 'Bali, Indonesia'
];

export default function AITripGenerator({ onTripGenerated, className = '' }: AITripGeneratorProps) {
  const [formData, setFormData] = useState<TripGenerationForm>({
    destination: '',
    duration: 7,
    budget: 1000,
    currency: 'USD',
    interests: [],
    travelStyle: 'mid-range',
    groupSize: 2,
    accommodation: 'hotel',
    transportation: 'flight',
    specialRequests: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrip, setGeneratedTrip] = useState<GeneratedTrip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = useCallback((field: keyof TripGenerationForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const toggleInterest = useCallback((interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  }, []);

  const generateTrip = useCallback(async () => {
    if (!formData.destination.trim()) {
      setError('Please enter a destination');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate trip');
      }

      const trip = await response.json();
      setGeneratedTrip(trip);
      onTripGenerated?.(trip);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate trip');
    } finally {
      setIsGenerating(false);
    }
  }, [formData, onTripGenerated]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sightseeing': return '🏛️';
      case 'dining': return '🍽️';
      case 'entertainment': return '🎭';
      case 'shopping': return '🛍️';
      case 'transport': return '🚗';
      case 'accommodation': return '🏨';
      default: return '📍';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Sparkles className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Trip Generator</h2>
          <p className="text-sm text-gray-600">Create personalized itineraries with AI</p>
        </div>
      </div>

      {/* Trip Generation Form */}
      {!generatedTrip && (
        <div className="space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  placeholder="e.g., Paris, France"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              {/* Destination Suggestions */}
              {formData.destination && (
                <div className="mt-1 bg-gray-50 rounded-lg p-2">
                  <div className="flex flex-wrap gap-1">
                    {destinations
                      .filter(dest => dest.toLowerCase().includes(formData.destination.toLowerCase()))
                      .slice(0, 3)
                      .map(dest => (
                        <button
                          key={dest}
                          onClick={() => handleInputChange('destination', dest)}
                          className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        >
                          {dest}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (days)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 1)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Budget
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', parseInt(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value as 'USD' | 'INR')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          {/* Travel Style & Group Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Travel Style
              </label>
              <select
                value={formData.travelStyle}
                onChange={(e) => handleInputChange('travelStyle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="budget">Budget Travel</option>
                <option value="mid-range">Mid-Range</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Size
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.groupSize}
                  onChange={(e) => handleInputChange('groupSize', parseInt(e.target.value) || 1)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interests & Activities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {interestOptions.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                    formData.interests.includes(interest)
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1"
          >
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▼
            </motion.div>
          </button>

          {/* Advanced Options */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accommodation Type
                    </label>
                    <select
                      value={formData.accommodation}
                      onChange={(e) => handleInputChange('accommodation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="hostel">Hostel</option>
                      <option value="hotel">Hotel</option>
                      <option value="resort">Resort</option>
                      <option value="apartment">Apartment/Airbnb</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Transportation
                    </label>
                    <select
                      value={formData.transportation}
                      onChange={(e) => handleInputChange('transportation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="flight">Flight</option>
                      <option value="train">Train</option>
                      <option value="bus">Bus</option>
                      <option value="car">Car/Road Trip</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    value={formData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    placeholder="Any specific requirements, dietary restrictions, accessibility needs, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <motion.button
            onClick={generateTrip}
            disabled={isGenerating || !formData.destination.trim()}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
              isGenerating || !formData.destination.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
            whileHover={!isGenerating && formData.destination.trim() ? { scale: 1.02 } : {}}
            whileTap={!isGenerating && formData.destination.trim() ? { scale: 0.98 } : {}}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Your Perfect Trip...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate AI Trip</span>
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* Generated Trip Display */}
      {generatedTrip && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Trip Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {generatedTrip.title}
              </h3>
              <p className="text-gray-600 mb-4">{generatedTrip.overview}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{generatedTrip.dailyItinerary.length} days</span>
                </span>
                <span className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatCurrency(generatedTrip.budgetBreakdown.total, generatedTrip.budgetBreakdown.currency)}</span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Heart className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Share className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGeneratedTrip(null)}
                className="px-3 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
              >
                Generate New
              </button>
            </div>
          </div>

          {/* Daily Itinerary */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Daily Itinerary</h4>
            {generatedTrip.dailyItinerary.map((day, index) => (
              <div key={day.day} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">
                      Day {day.day}: {day.theme}
                    </h5>
                    <p className="text-sm text-gray-600">{day.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(day.estimatedCost, generatedTrip.budgetBreakdown.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {day.transportation.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {day.activities.map((activity, actIndex) => (
                    <div key={actIndex} className="flex items-start space-x-3 bg-white rounded-lg p-3">
                      <div className="text-xl">{getCategoryIcon(activity.category)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h6 className="font-medium text-gray-900">{activity.title}</h6>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(activity.priority)}`}>
                              {activity.priority}
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              {formatCurrency(activity.estimatedCost, generatedTrip.budgetBreakdown.currency)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>📍 {activity.location}</span>
                          <span>🕐 {activity.time}</span>
                          <span>⏱️ {activity.duration}min</span>
                        </div>
                        {activity.tips.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700">Tips:</p>
                            <ul className="text-xs text-gray-600 list-disc list-inside">
                              {activity.tips.map((tip, tipIndex) => (
                                <li key={tipIndex}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Budget Breakdown */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Budget Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(generatedTrip.budgetBreakdown)
                .filter(([key]) => key !== 'total' && key !== 'currency')
                .map(([category, amount]) => (
                  <div key={category} className="text-center">
                    <p className="text-sm font-medium text-gray-700 capitalize">
                      {category.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(amount, generatedTrip.budgetBreakdown.currency)}
                    </p>
                  </div>
                ))}
            </div>
            <div className="border-t border-green-200 mt-4 pt-4 text-center">
              <p className="text-lg font-bold text-green-800">
                Total: {formatCurrency(generatedTrip.budgetBreakdown.total, generatedTrip.budgetBreakdown.currency)}
              </p>
            </div>
          </div>

          {/* Hidden Gems & Local Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Hidden Gems</h4>
              <ul className="space-y-2">
                {generatedTrip.hiddenGems.map((gem, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                    <span className="text-yellow-600">💎</span>
                    <span>{gem}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Local Insights</h4>
              <ul className="space-y-2">
                {generatedTrip.localInsights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                    <span className="text-blue-600">💡</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Travel Recommendations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Best Time to Visit:</p>
                <p className="text-sm text-gray-600">{generatedTrip.recommendations.bestTimeToVisit}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Cultural Tips:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {generatedTrip.recommendations.culturalTips.slice(0, 3).map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}