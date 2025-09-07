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
  Bus,
  DollarSign,
  Fuel,
  ParkingCircle,
  Activity as ActivityIcon,
  Leaf
} from 'lucide-react';
import { optimizeRoute, RouteOptimizationResult, findLocationClusters, suggestOptimalTiming } from '@/lib/planning/route-optimizer';
import { enhancedOptimizeRoute, EnhancedRouteOptimizationResult, type EnhancedOptimizationOptions } from '@/lib/planning/enhanced-route-optimizer';
import type { DayPlan } from './TimelineBuilder';
import type { Activity } from './TimelineBuilder';

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

const vehicleOptions = [
  { value: 'compact' as const, label: 'Compact', efficiency: '14.5 km/L' },
  { value: 'standard' as const, label: 'Standard', efficiency: '11.0 km/L' },
  { value: 'suv' as const, label: 'SUV', efficiency: '8.5 km/L' },
  { value: 'electric' as const, label: 'Electric', efficiency: 'No fuel cost' },
];

export default function RouteOptimizer({ dayPlan, onOptimize, className = '' }: RouteOptimizerProps) {
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<RouteOptimizationResult | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<EnhancedRouteOptimizationResult | null>(null);
  const [useEnhancedOptimization, setUseEnhancedOptimization] = useState(true);
  const [vehicleType, setVehicleType] = useState<'compact' | 'standard' | 'suv' | 'electric'>('standard');
  const [considerTraffic, setConsiderTraffic] = useState(true);
  const [considerCosts, setConsiderCosts] = useState(true);
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
    
    try {
      if (useEnhancedOptimization) {
        const enhancedOptions: EnhancedOptimizationOptions = {
          travelMode,
          vehicleType,
          prioritizeTime: true,
          considerTraffic,
          considerTolls: considerCosts,
          considerParking: considerCosts && travelMode === 'driving',
          fuelPrice: 1.45, // USD per liter
        };
        
        const result = await enhancedOptimizeRoute(dayPlan.activities, enhancedOptions);
        setEnhancedResult(result);
        setOptimizationResult(null);
      } else {
        // Fallback to basic optimization
        await new Promise(resolve => setTimeout(resolve, 800));
        const result = optimizeRoute(dayPlan.activities, {
          travelMode,
          prioritizeTime: true,
          preserveTimeConstraints: true,
        });
        setOptimizationResult(result);
        setEnhancedResult(null);
      }
    } catch (error) {
      console.error('Route optimization failed:', error);
      // Fallback to basic optimization
      const result = optimizeRoute(dayPlan.activities, {
        travelMode,
        prioritizeTime: true,
        preserveTimeConstraints: true,
      });
      setOptimizationResult(result);
      setEnhancedResult(null);
    } finally {
      setIsOptimizing(false);
    }
  }, [dayPlan.activities, travelMode, useEnhancedOptimization, vehicleType, considerTraffic, considerCosts]);

  const handleApplyOptimization = useCallback(() => {
    if (enhancedResult) {
      onOptimize(enhancedResult.optimizedActivities);
      setEnhancedResult(null);
    } else if (optimizationResult) {
      onOptimize(optimizationResult.optimizedActivities);
      setOptimizationResult(null);
    }
  }, [enhancedResult, optimizationResult, onOptimize]);

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

      {/* Optimization Mode Toggle */}
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div>
          <h4 className="text-sm font-medium text-blue-900">Enhanced Optimization</h4>
          <p className="text-xs text-blue-700">Includes traffic data, cost estimation, and advanced algorithms</p>
        </div>
        <button
          onClick={() => setUseEnhancedOptimization(!useEnhancedOptimization)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            useEnhancedOptimization ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              useEnhancedOptimization ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
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

      {/* Enhanced Options for Driving */}
      {useEnhancedOptimization && travelMode === 'driving' && (
        <div className="space-y-4">
          {/* Vehicle Selection */}
          <fieldset className="space-y-2">
            <legend className="block text-sm font-medium text-gray-700">Vehicle Type</legend>
            <div className="grid grid-cols-2 gap-2">
              {vehicleOptions.map((vehicle) => (
                <motion.button
                  key={vehicle.value}
                  onClick={() => setVehicleType(vehicle.value)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                    vehicleType === vehicle.value
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-left">
                    <div className="font-medium">{vehicle.label}</div>
                    <div className="text-xs text-gray-500">{vehicle.efficiency}</div>
                  </div>
                  {vehicle.value === 'electric' && <Leaf className="h-3 w-3" />}
                </motion.button>
              ))}
            </div>
          </fieldset>

          {/* Enhanced Options */}
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Consider traffic conditions</span>
              <input
                type="checkbox"
                checked={considerTraffic}
                onChange={(e) => setConsiderTraffic(e.target.checked)}
                className="rounded border-gray-300"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Include cost estimation</span>
              <input
                type="checkbox"
                checked={considerCosts}
                onChange={(e) => setConsiderCosts(e.target.checked)}
                className="rounded border-gray-300"
              />
            </label>
          </div>
        </div>
      )}

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

      {/* Enhanced Optimization Results */}
      <AnimatePresence>
        {enhancedResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Enhanced Optimization Results</h4>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                enhancedResult.routeAnalysis.efficiency >= 80
                  ? 'bg-green-100 text-green-700'
                  : enhancedResult.routeAnalysis.efficiency >= 60
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {enhancedResult.routeAnalysis.efficiency}% Efficient
              </div>
            </div>

            {/* Enhanced Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Time with Traffic */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">Total Time</span>
                </div>
                <p className="text-lg font-bold text-blue-700 mt-1">
                  {formatTime(enhancedResult.totalTravelTime)}
                </p>
                {enhancedResult.trafficImpact.trafficDelay > 0 && (
                  <p className="text-xs text-blue-600">
                    +{Math.round(enhancedResult.trafficImpact.trafficDelay)}m traffic
                  </p>
                )}
              </div>
              
              {/* Distance */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-900">Distance</span>
                </div>
                <p className="text-lg font-bold text-green-700 mt-1">
                  {formatDistance(enhancedResult.totalDistance)}
                </p>
              </div>
              
              {/* Cost */}
              {considerCosts && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-900">Total Cost</span>
                  </div>
                  <p className="text-lg font-bold text-purple-700 mt-1">
                    ${enhancedResult.costEstimation.total.toFixed(2)}
                  </p>
                </div>
              )}
              
              {/* CO2 Emissions */}
              {vehicleType !== 'electric' && (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center space-x-2">
                    <ActivityIcon className="h-4 w-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-900">CO2</span>
                  </div>
                  <p className="text-lg font-bold text-orange-700 mt-1">
                    {enhancedResult.costEstimation.fuel.co2Emissions.toFixed(1)}kg
                  </p>
                </div>
              )}
            </div>

            {/* Cost Breakdown */}
            {considerCosts && enhancedResult.costEstimation.total > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" /> Cost Breakdown
                </h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {enhancedResult.costEstimation.fuel.cost > 0 && (
                    <div className="text-center">
                      <Fuel className="h-4 w-4 mx-auto mb-1 text-red-600" />
                      <p className="font-medium">${enhancedResult.costEstimation.fuel.cost.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">Fuel</p>
                    </div>
                  )}
                  {enhancedResult.costEstimation.tolls.cost > 0 && (
                    <div className="text-center">
                      <Navigation className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                      <p className="font-medium">${enhancedResult.costEstimation.tolls.cost.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">Tolls</p>
                    </div>
                  )}
                  {enhancedResult.costEstimation.parking.totalCost > 0 && (
                    <div className="text-center">
                      <ParkingCircle className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                      <p className="font-medium">${enhancedResult.costEstimation.parking.totalCost.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">Parking</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Traffic Conditions */}
            {enhancedResult.trafficImpact.conditions.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h5 className="text-sm font-medium text-red-900 mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" /> Traffic Conditions
                </h5>
                <div className="space-y-2">
                  {enhancedResult.trafficImpact.conditions.slice(0, 3).map((condition, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-red-700 truncate">{condition.segment}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        condition.severity === 'severe' ? 'bg-red-200 text-red-800' :
                        condition.severity === 'heavy' ? 'bg-orange-200 text-orange-800' :
                        condition.severity === 'moderate' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        +{condition.delayMinutes}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Savings Display */}
            {(enhancedResult.estimatedSavings.time > 0 || enhancedResult.estimatedSavings.distance > 0 || enhancedResult.estimatedSavings.cost > 0) && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h5 className="text-sm font-medium text-green-900 mb-3">Estimated Savings</h5>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {enhancedResult.estimatedSavings.time > 0 && (
                    <div>
                      <p className="text-xl font-bold text-green-700">{formatTime(enhancedResult.estimatedSavings.time)}</p>
                      <p className="text-xs text-green-600">Time Saved</p>
                    </div>
                  )}
                  {enhancedResult.estimatedSavings.distance > 0 && (
                    <div>
                      <p className="text-xl font-bold text-green-700">{formatDistance(enhancedResult.estimatedSavings.distance)}</p>
                      <p className="text-xs text-green-600">Distance Saved</p>
                    </div>
                  )}
                  {enhancedResult.estimatedSavings.cost > 0 && (
                    <div>
                      <p className="text-xl font-bold text-green-700">${enhancedResult.estimatedSavings.cost.toFixed(2)}</p>
                      <p className="text-xs text-green-600">Cost Saved</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Enhanced Recommendations</h5>
              <div className="space-y-1">
                {enhancedResult.routeAnalysis.suggestions.map((suggestion, index) => (
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
                Apply Enhanced Optimization
              </motion.button>
              <button
                onClick={() => setEnhancedResult(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Basic Optimization Results (Fallback) */}
        {optimizationResult && !enhancedResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Basic Optimization Results</h4>
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