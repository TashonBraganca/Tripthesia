"use client";

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Route, 
  Clock, 
  Navigation, 
  Zap, 
  MapPin, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw,
  Car,
  User,
  Bus
} from 'lucide-react';
import { optimizeRoute, RouteOptimizationResult, findLocationClusters, suggestOptimalTiming } from '@/lib/planning/route-optimizer';
import type { Activity, DayPlan } from './TimelineBuilder';

interface RouteOptimizerProps {
  dayPlan: DayPlan;
  onOptimize: (optimizedActivities: Activity[]) => void;
  className?: string;
}

type TravelMode = 'walking' | 'driving' | 'public_transport';

const travelModeOptions = [
  { value: 'walking' as const, label: 'Walking', icon: User, speed: '5 km/h' },
  { value: 'driving' as const, label: 'Driving', icon: Car, speed: '25 km/h' },
  { value: 'public_transport' as const, label: 'Public Transit', icon: Bus, speed: '20 km/h' },
];

export default function RouteOptimizer({ dayPlan, onOptimize, className = '' }: RouteOptimizerProps) {
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<RouteOptimizationResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate current route metrics
  const currentRouteMetrics = useMemo(() => {
    if (dayPlan.activities.length === 0) return null;
    
    return optimizeRoute(dayPlan.activities, { travelMode });
  }, [dayPlan.activities, travelMode]);

  // Find location clusters
  const locationClusters = useMemo(() => {
    return findLocationClusters(dayPlan.activities);
  }, [dayPlan.activities]);

  // Get timing suggestions
  const timingSuggestions = useMemo(() => {
    return suggestOptimalTiming(dayPlan.activities);
  }, [dayPlan.activities]);

  const handleOptimizeRoute = useCallback(async () => {
    if (dayPlan.activities.length <= 1) return;
    
    setIsOptimizing(true);
    
    // Simulate processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = optimizeRoute(dayPlan.activities, {
      travelMode,
      prioritizeTime: true,
      preserveTimeConstraints: true,
    });
    
    setOptimizationResult(result);
    setIsOptimizing(false);
  }, [dayPlan.activities, travelMode]);

  const handleApplyOptimization = useCallback(() => {
    if (optimizationResult) {
      onOptimize(optimizationResult.optimizedActivities);
      setOptimizationResult(null);
    }
  }, [optimizationResult, onOptimize]);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDistance = (km: number): string => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  if (dayPlan.activities.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg border border-gray-200 p-6 text-center ${className}`}>
        <Route className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Add activities to optimize your route</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Route className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Route Optimizer</h3>
            <p className="text-sm text-gray-600">Minimize travel time and distance</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          {showAdvanced ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Travel Mode Selection */}
      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium text-gray-700">Transportation Mode</legend>
        <div className="grid grid-cols-3 gap-2">
          {travelModeOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <motion.button
                key={option.value}
                onClick={() => setTravelMode(option.value)}
                className={`flex items-center space-x-2 p-3 rounded-lg border text-sm transition-colors ${
                  travelMode === option.value
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <IconComponent className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.speed}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </fieldset>

      {/* Current Route Stats */}
      {currentRouteMetrics && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Travel Time</span>
            </div>
            <p className="text-xl font-bold text-blue-700 mt-1">
              {formatTime(currentRouteMetrics.totalTravelTime)}
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Navigation className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Distance</span>
            </div>
            <p className="text-xl font-bold text-green-700 mt-1">
              {formatDistance(currentRouteMetrics.totalDistance)}
            </p>
          </div>
        </div>
      )}

      {/* Location Clusters */}
      {locationClusters.length > 1 && (
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900">Location Analysis</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Found {locationClusters.length} location clusters. Grouping nearby activities can reduce travel time.
              </p>
              {showAdvanced && (
                <div className="mt-2 space-y-1">
                  {locationClusters.map((cluster, index) => (
                    <div key={index} className="text-xs text-yellow-600">
                      Cluster {index + 1}: {cluster.map(a => a.title).join(', ')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timing Suggestions */}
      {timingSuggestions.suggestions.length > 0 && showAdvanced && (
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-start space-x-2">
            <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-purple-900">Timing Suggestions</h4>
              <div className="mt-1 space-y-1">
                {timingSuggestions.suggestions.slice(0, 3).map((suggestion, index) => (
                  <p key={index} className="text-xs text-purple-700">• {suggestion}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optimization Button */}
      <motion.button
        onClick={handleOptimizeRoute}
        disabled={isOptimizing || dayPlan.activities.length <= 1}
        className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
          isOptimizing || dayPlan.activities.length <= 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
        whileHover={!isOptimizing && dayPlan.activities.length > 1 ? { scale: 1.02 } : {}}
        whileTap={!isOptimizing && dayPlan.activities.length > 1 ? { scale: 0.98 } : {}}
      >
        {isOptimizing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Optimizing Route...</span>
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            <span>Optimize Route</span>
          </>
        )}
      </motion.button>

      {/* Optimization Results */}
      <AnimatePresence>
        {optimizationResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Optimization Results</h4>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                optimizationResult.routeAnalysis.efficiency >= 80
                  ? 'bg-green-100 text-green-700'
                  : optimizationResult.routeAnalysis.efficiency >= 60
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {optimizationResult.routeAnalysis.efficiency}% Efficient
              </div>
            </div>

            {/* Savings Display */}
            {(optimizationResult.estimatedSavings.time > 0 || optimizationResult.estimatedSavings.distance > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {optimizationResult.estimatedSavings.time > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Time Saved</span>
                    </div>
                    <p className="text-xl font-bold text-green-700 mt-1">
                      {formatTime(optimizationResult.estimatedSavings.time)}
                    </p>
                  </div>
                )}
                
                {optimizationResult.estimatedSavings.distance > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Navigation className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Distance Saved</span>
                    </div>
                    <p className="text-xl font-bold text-blue-700 mt-1">
                      {formatDistance(optimizationResult.estimatedSavings.distance)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h5>
              <div className="space-y-1">
                {optimizationResult.routeAnalysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1 h-1 bg-indigo-600 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <motion.button
                onClick={handleApplyOptimization}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Apply Optimization
              </motion.button>
              <button
                onClick={() => setOptimizationResult(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conflicts Warning */}
      {dayPlan.conflicts.length > 0 && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900">Schedule Conflicts</h4>
              <p className="text-sm text-red-700 mt-1">
                Resolve {dayPlan.conflicts.length} scheduling conflict{dayPlan.conflicts.length > 1 ? 's' : ''} before optimizing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}