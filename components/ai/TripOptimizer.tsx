"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star,
  Users,
  Zap,
  Target,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  ArrowRight,
  Route,
  Calendar,
  Plane,
  Hotel,
  UtensilsCrossed,
  Camera
} from 'lucide-react';

interface TripOptimizerProps {
  tripData: {
    destination?: { name: string; };
    transport?: any;
    accommodation?: any[];
    activities?: any[];
    dining?: any[];
    dates?: { start: string; end: string; };
    travelers?: number;
    budget?: number;
  };
  onApplyOptimization?: (optimization: OptimizationSuggestion) => void;
  className?: string;
}

interface OptimizationSuggestion {
  id: string;
  type: 'cost' | 'time' | 'experience' | 'convenience';
  title: string;
  description: string;
  impact: {
    costSaving?: number;
    timeSaving?: string;
    experienceScore?: number;
    convenienceScore?: number;
  };
  suggestions: {
    step: string;
    current: string;
    suggested: string;
    reason: string;
  }[];
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export function TripOptimizer({ tripData, onApplyOptimization, className = "" }: TripOptimizerProps) {
  const [optimizations, setOptimizations] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');

  const generateOptimizations = useCallback(async () => {
    if (!tripData.destination) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/trip-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: tripData.destination.name,
          tripData: {
            transport: tripData.transport,
            accommodation: tripData.accommodation,
            activities: tripData.activities,
            dining: tripData.dining,
            dates: tripData.dates,
            travelers: tripData.travelers,
            budget: tripData.budget
          },
          preferences: {
            optimizeFor: ['cost', 'experience', 'time', 'convenience']
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate optimizations');
      }

      const data = await response.json();
      setOptimizations(data.optimizations || []);
    } catch (error) {
      console.error('Error generating optimizations:', error);
      setError('Failed to generate trip optimizations. Please try again.');
      
      // Fallback with mock data
      setOptimizations(generateMockOptimizations());
    } finally {
      setLoading(false);
    }
  }, [tripData]);

  const generateMockOptimizations = (): OptimizationSuggestion[] => {
    return [
      {
        id: '1',
        type: 'cost',
        title: 'Save ₹3,200 on Accommodation',
        description: 'Switch to highly-rated business hotels with similar amenities at better prices.',
        impact: {
          costSaving: 3200,
          experienceScore: 4.3
        },
        suggestions: [
          {
            step: 'accommodation',
            current: 'Luxury Hotels',
            suggested: 'Business Hotels',
            reason: 'Similar amenities at 40% lower cost with excellent ratings'
          }
        ],
        priority: 'high',
        category: 'Budget Optimization'
      },
      {
        id: '2',
        type: 'time',
        title: 'Optimize Activity Routing',
        description: 'Reorder activities by location to save 3 hours of travel time per day.',
        impact: {
          timeSaving: '3 hours/day',
          convenienceScore: 4.8
        },
        suggestions: [
          {
            step: 'activities',
            current: 'Random order',
            suggested: 'Location-based grouping',
            reason: 'Minimize travel time between attractions and maximize exploration'
          }
        ],
        priority: 'high',
        category: 'Time Efficiency'
      },
      {
        id: '3',
        type: 'experience',
        title: 'Enhance Cultural Experience',
        description: 'Add local cuisine experiences that complement your dining preferences.',
        impact: {
          experienceScore: 4.7,
          costSaving: 0
        },
        suggestions: [
          {
            step: 'dining',
            current: 'International Cuisine focus',
            suggested: 'Mix of Local & International',
            reason: 'Experience authentic local flavors while maintaining familiar options'
          }
        ],
        priority: 'medium',
        category: 'Experience Enhancement'
      },
      {
        id: '4',
        type: 'convenience',
        title: 'Optimize Transport Connections',
        description: 'Choose transport options with better connections to your accommodation.',
        impact: {
          timeSaving: '45 min',
          convenienceScore: 4.5
        },
        suggestions: [
          {
            step: 'transport',
            current: 'Current selection',
            suggested: 'Better connected options',
            reason: 'Reduce transfer time and improve overall convenience'
          }
        ],
        priority: 'medium',
        category: 'Convenience'
      }
    ];
  };

  useEffect(() => {
    if (tripData.destination && (tripData.accommodation || tripData.activities || tripData.dining || tripData.transport)) {
      generateOptimizations();
    }
  }, [tripData, generateOptimizations]);

  const getOptimizationIcon = (type: string) => {
    switch (type) {
      case 'cost': return DollarSign;
      case 'time': return Clock;
      case 'experience': return Star;
      case 'convenience': return Target;
      default: return Lightbulb;
    }
  };

  const getOptimizationColor = (type: string) => {
    switch (type) {
      case 'cost': return 'text-green-400';
      case 'time': return 'text-blue-400';
      case 'experience': return 'text-purple-400';
      case 'convenience': return 'text-teal-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-400/30 bg-red-500/10';
      case 'medium': return 'border-yellow-400/30 bg-yellow-500/10';
      case 'low': return 'border-gray-400/30 bg-gray-500/10';
      default: return 'border-gray-400/30 bg-gray-500/10';
    }
  };

  const filteredOptimizations = optimizations.filter(opt => 
    selectedType === 'all' || opt.type === selectedType
  );

  if (!tripData.destination) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-teal-500/10 text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-purple-500/20">
          <Sparkles className="w-4 h-4" />
          AI Trip Optimizer
        </div>
        <h3 className="text-2xl font-bold text-navy-100 mb-2">
          Optimize Your Trip
        </h3>
        <p className="text-navy-300">
          AI-powered suggestions to enhance your travel experience
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { id: 'all', label: 'All', icon: Sparkles },
          { id: 'cost', label: 'Cost', icon: DollarSign },
          { id: 'time', label: 'Time', icon: Clock },
          { id: 'experience', label: 'Experience', icon: Star },
          { id: 'convenience', label: 'Convenience', icon: Target }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSelectedType(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedType === id
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'bg-navy-800/30 text-navy-400 hover:bg-navy-700/30 hover:text-navy-300 border border-navy-700/20'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
          <span className="ml-3 text-navy-300">Analyzing your trip...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={generateOptimizations}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Optimizations Grid */}
      <AnimatePresence>
        {filteredOptimizations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredOptimizations.map((optimization, index) => {
              const IconComponent = getOptimizationIcon(optimization.type);
              
              return (
                <motion.div
                  key={optimization.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-6 rounded-2xl border ${getPriorityColor(optimization.priority)} backdrop-blur-sm hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300 group`}
                >
                  {/* Priority Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      optimization.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                      optimization.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {optimization.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Header */}
                  <div className="flex items-start mb-4">
                    <div className="p-3 rounded-xl bg-navy-800/30 mr-4">
                      <IconComponent className={`w-6 h-6 ${getOptimizationColor(optimization.type)}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-navy-100 mb-1 group-hover:text-teal-200 transition-colors">
                        {optimization.title}
                      </h4>
                      <p className="text-sm text-navy-300 mb-2">
                        {optimization.description}
                      </p>
                      <div className="text-xs text-teal-400 font-medium">
                        {optimization.category}
                      </div>
                    </div>
                  </div>

                  {/* Impact Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {optimization.impact.costSaving && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">
                          ₹{optimization.impact.costSaving.toLocaleString()}
                        </div>
                        <div className="text-xs text-navy-400">Cost Saving</div>
                      </div>
                    )}
                    {optimization.impact.timeSaving && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-400">
                          {optimization.impact.timeSaving}
                        </div>
                        <div className="text-xs text-navy-400">Time Saved</div>
                      </div>
                    )}
                    {optimization.impact.experienceScore && (
                      <div className="text-center">
                        <div className="flex items-center justify-center">
                          <Star className="w-4 h-4 text-purple-400 mr-1" />
                          <span className="text-lg font-bold text-purple-400">
                            {optimization.impact.experienceScore}
                          </span>
                        </div>
                        <div className="text-xs text-navy-400">Experience</div>
                      </div>
                    )}
                    {optimization.impact.convenienceScore && (
                      <div className="text-center">
                        <div className="flex items-center justify-center">
                          <Target className="w-4 h-4 text-teal-400 mr-1" />
                          <span className="text-lg font-bold text-teal-400">
                            {optimization.impact.convenienceScore}
                          </span>
                        </div>
                        <div className="text-xs text-navy-400">Convenience</div>
                      </div>
                    )}
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-2 mb-6">
                    {optimization.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="bg-navy-800/20 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-navy-200 capitalize">
                            {suggestion.step}
                          </span>
                          <ArrowRight className="w-3 h-3 text-teal-400" />
                        </div>
                        <div className="text-xs text-navy-400 mb-1">
                          <span className="line-through">{suggestion.current}</span>
                          <span className="mx-2">→</span>
                          <span className="text-teal-300">{suggestion.suggested}</span>
                        </div>
                        <div className="text-xs text-navy-500">
                          {suggestion.reason}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  {onApplyOptimization && (
                    <button
                      onClick={() => onApplyOptimization(optimization)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500/20 text-teal-300 rounded-lg hover:bg-teal-500/30 hover:text-teal-200 transition-all duration-200 group-hover:shadow-md"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Apply Optimization
                    </button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!loading && !error && filteredOptimizations.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-navy-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-navy-300 mb-2">
            No Optimizations Available
          </h4>
          <p className="text-navy-400">
            Add more trip details to get AI-powered optimization suggestions.
          </p>
        </div>
      )}

      {/* Refresh Button */}
      {!loading && filteredOptimizations.length > 0 && (
        <div className="text-center">
          <button
            onClick={generateOptimizations}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-navy-800/30 text-navy-300 rounded-xl hover:bg-navy-700/30 hover:text-navy-200 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Suggestions
          </button>
        </div>
      )}
    </div>
  );
}