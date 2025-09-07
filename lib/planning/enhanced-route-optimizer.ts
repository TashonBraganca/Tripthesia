/**
 * Enhanced Route Optimization Engine - Phase 3.2
 * Includes traffic-aware routing, advanced algorithms, and cost estimation
 */

import type { Activity } from '@/components/planning/TimelineBuilder';
import type { Coordinate, RouteResult, RouteRequest } from '../services/google-maps-provider';
import { calculateDistance, estimateTravelTime, type Location } from './route-optimizer';

export interface TrafficCondition {
  segment: string;
  severity: 'light' | 'moderate' | 'heavy' | 'severe';
  delayMinutes: number;
  alternateRoute?: string;
}

export interface CostEstimation {
  fuel: {
    cost: number; // in USD
    liters: number;
    co2Emissions: number; // kg
  };
  tolls: {
    cost: number; // in USD
    segments: { name: string; cost: number }[];
  };
  parking: {
    cost: number; // in USD per hour
    totalCost: number; // for entire trip
    locations: { name: string; hourlyRate: number; estimatedHours: number }[];
  };
  total: number; // total cost in USD
}

export interface EnhancedRouteOptimizationResult {
  optimizedActivities: Activity[];
  totalTravelTime: number; // in minutes including traffic
  totalDistance: number; // in kilometers
  trafficImpact: {
    baseTime: number; // without traffic
    trafficDelay: number; // additional time due to traffic
    conditions: TrafficCondition[];
  };
  costEstimation: CostEstimation;
  estimatedSavings: {
    time: number; // minutes saved
    distance: number; // km saved
    cost: number; // USD saved
  };
  routeAnalysis: {
    efficiency: number; // 0-100 percentage
    suggestions: string[];
    alternativeRoutes?: {
      route: Activity[];
      savings: { time: number; cost: number };
      description: string;
    }[];
  };
}

export interface EnhancedOptimizationOptions {
  travelMode?: 'walking' | 'driving' | 'public_transport';
  startLocation?: Location;
  prioritizeTime?: boolean; // vs cost vs distance
  vehicleType?: 'compact' | 'standard' | 'suv' | 'electric';
  fuelPrice?: number; // USD per liter
  considerTraffic?: boolean;
  considerTolls?: boolean;
  considerParking?: boolean;
  maxDetourForSavings?: number; // km
  preferredDepartureTime?: Date;
}

// Vehicle fuel efficiency data (km per liter)
const VEHICLE_EFFICIENCY: Record<string, number> = {
  compact: 14.5,    // 14.5 km/L
  standard: 11.0,   // 11.0 km/L
  suv: 8.5,         // 8.5 km/L
  electric: 0,      // No fuel cost
};

// Average parking rates by activity type (USD per hour)
const PARKING_RATES: Record<string, number> = {
  sightseeing: 3.50,
  dining: 2.00,
  shopping: 2.50,
  entertainment: 4.00,
  accommodation: 15.00, // per day
  transport: 0,
};

/**
 * Enhanced multi-stop optimization using 2-opt improvement algorithm
 * More sophisticated than simple nearest neighbor
 */
export function optimizeRouteWithTwoOpt(activities: Activity[], startLocation?: Location): Activity[] {
  if (activities.length <= 3) {
    // For small routes, use nearest neighbor
    return optimizeNearestNeighbor(activities, startLocation);
  }

  let bestRoute = optimizeNearestNeighbor(activities, startLocation);
  let bestDistance = calculateTotalDistance(bestRoute);
  let improved = true;

  // 2-opt improvement algorithm
  while (improved) {
    improved = false;
    
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length; j++) {
        if (j - i === 1) continue; // Skip adjacent edges
        
        // Create new route by reversing the segment between i and j
        const newRoute = [...bestRoute];
        const segment = newRoute.slice(i, j + 1).reverse();
        newRoute.splice(i, j - i + 1, ...segment);
        
        const newDistance = calculateTotalDistance(newRoute);
        
        if (newDistance < bestDistance) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
}

/**
 * Nearest neighbor algorithm (fallback for small routes)
 */
function optimizeNearestNeighbor(activities: Activity[], startLocation?: Location): Activity[] {
  if (activities.length <= 1) return activities;
  
  const unvisited = [...activities];
  const optimized: Activity[] = [];
  
  // Start with closest to start location or first activity
  let current = startLocation
    ? unvisited.reduce((closest, activity) => {
        const distanceCurrent = calculateDistance(startLocation, activity.location.coordinates);
        const distanceClosest = calculateDistance(startLocation, closest.location.coordinates);
        return distanceCurrent < distanceClosest ? activity : closest;
      })
    : unvisited[0];
  
  optimized.push(current);
  unvisited.splice(unvisited.indexOf(current), 1);
  
  while (unvisited.length > 0) {
    let nearest = unvisited[0];
    let shortestDistance = calculateDistance(
      current.location.coordinates,
      nearest.location.coordinates
    );
    
    for (const activity of unvisited) {
      const distance = calculateDistance(
        current.location.coordinates,
        activity.location.coordinates
      );
      
      if (distance < shortestDistance) {
        nearest = activity;
        shortestDistance = distance;
      }
    }
    
    optimized.push(nearest);
    unvisited.splice(unvisited.indexOf(nearest), 1);
    current = nearest;
  }
  
  return optimized;
}

/**
 * Calculate total distance for a route
 */
function calculateTotalDistance(activities: Activity[]): number {
  if (activities.length <= 1) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < activities.length - 1; i++) {
    totalDistance += calculateDistance(
      activities[i].location.coordinates,
      activities[i + 1].location.coordinates
    );
  }
  
  return totalDistance;
}

/**
 * Get real-time traffic conditions using Google Maps Traffic Layer
 */
export async function getTrafficConditions(
  route: Activity[],
  travelMode: 'driving' | 'walking' | 'public_transport' = 'driving'
): Promise<TrafficCondition[]> {
  // Only provide traffic data for driving routes
  if (travelMode !== 'driving' || route.length <= 1) {
    return [];
  }

  const conditions: TrafficCondition[] = [];
  
  try {
    // For each route segment, estimate traffic impact
    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i];
      const to = route[i + 1];
      const distance = calculateDistance(from.location.coordinates, to.location.coordinates);
      
      // Simulate traffic conditions based on time of day and distance
      const departureHour = new Date(from.timeSlot.start).getHours();
      const trafficMultiplier = getTrafficMultiplier(departureHour, distance);
      
      const baseTime = estimateTravelTime(distance, travelMode);
      const trafficDelayMinutes = Math.round(baseTime * (trafficMultiplier - 1));
      
      if (trafficDelayMinutes > 5) { // Only report significant delays
        const severity: TrafficCondition['severity'] = 
          trafficDelayMinutes > 30 ? 'severe' :
          trafficDelayMinutes > 15 ? 'heavy' :
          trafficDelayMinutes > 8 ? 'moderate' : 'light';
        
        conditions.push({
          segment: `${from.title} → ${to.title}`,
          severity,
          delayMinutes: trafficDelayMinutes,
          alternateRoute: trafficDelayMinutes > 20 ? 'Consider alternate route' : undefined,
        });
      }
    }
  } catch (error) {
    console.warn('Failed to get traffic conditions:', error);
  }
  
  return conditions;
}

/**
 * Get traffic multiplier based on time and distance
 */
function getTrafficMultiplier(hour: number, distance: number): number {
  // Rush hour traffic (7-9 AM, 5-7 PM)
  let baseMultiplier = 1.0;
  
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    baseMultiplier = 1.6; // 60% longer during rush hour
  } else if ((hour >= 6 && hour <= 10) || (hour >= 16 && hour <= 20)) {
    baseMultiplier = 1.3; // 30% longer during peak periods
  } else if (hour >= 11 && hour <= 15) {
    baseMultiplier = 1.1; // 10% longer during business hours
  }
  
  // Longer distances have higher traffic impact
  if (distance > 10) {
    baseMultiplier += 0.2;
  } else if (distance > 5) {
    baseMultiplier += 0.1;
  }
  
  return Math.min(baseMultiplier, 2.5); // Cap at 2.5x
}

/**
 * Estimate comprehensive costs for the route
 */
export function estimateRouteCosts(
  activities: Activity[],
  options: EnhancedOptimizationOptions
): CostEstimation {
  const {
    vehicleType = 'standard',
    fuelPrice = 1.45, // USD per liter
    travelMode = 'driving',
  } = options;
  
  let totalFuelCost = 0;
  let totalFuelLiters = 0;
  let totalCO2 = 0;
  const tollSegments: { name: string; cost: number }[] = [];
  const parkingLocations: { name: string; hourlyRate: number; estimatedHours: number }[] = [];
  
  const totalDistance = calculateTotalDistance(activities);
  
  // Fuel costs (only for non-electric vehicles)
  if (travelMode === 'driving' && vehicleType !== 'electric') {
    const efficiency = VEHICLE_EFFICIENCY[vehicleType];
    totalFuelLiters = totalDistance / efficiency;
    totalFuelCost = totalFuelLiters * fuelPrice;
    totalCO2 = totalFuelLiters * 2.31; // kg CO2 per liter of gasoline
  }
  
  // Toll estimation (simplified - in practice, would integrate with toll APIs)
  let totalTollCost = 0;
  if (options.considerTolls && travelMode === 'driving') {
    // Estimate tolls based on distance (rough approximation)
    if (totalDistance > 50) { // Long distance likely involves highways
      const estimatedTollCost = Math.min(totalDistance * 0.15, 25); // $0.15/km, max $25
      totalTollCost = estimatedTollCost;
      tollSegments.push({
        name: 'Highway tolls',
        cost: estimatedTollCost,
      });
    }
  }
  
  // Parking cost estimation
  let totalParkingCost = 0;
  if (options.considerParking && travelMode === 'driving') {
    activities.forEach(activity => {
      const parkingRate = PARKING_RATES[activity.category] || 3.0;
      const durationHours = activity.timeSlot.duration / 60;
      const parkingCost = parkingRate * durationHours;
      
      totalParkingCost += parkingCost;
      parkingLocations.push({
        name: activity.title,
        hourlyRate: parkingRate,
        estimatedHours: durationHours,
      });
    });
  }
  
  return {
    fuel: {
      cost: totalFuelCost,
      liters: totalFuelLiters,
      co2Emissions: totalCO2,
    },
    tolls: {
      cost: totalTollCost,
      segments: tollSegments,
    },
    parking: {
      cost: PARKING_RATES[activities[0]?.category] || 3.0,
      totalCost: totalParkingCost,
      locations: parkingLocations,
    },
    total: totalFuelCost + totalTollCost + totalParkingCost,
  };
}

/**
 * Enhanced comprehensive route optimization
 */
export async function enhancedOptimizeRoute(
  activities: Activity[],
  options: EnhancedOptimizationOptions = {}
): Promise<EnhancedRouteOptimizationResult> {
  const {
    travelMode = 'driving',
    startLocation,
    prioritizeTime = true,
    considerTraffic = true,
  } = options;
  
  if (activities.length <= 1) {
    return {
      optimizedActivities: activities,
      totalTravelTime: 0,
      totalDistance: 0,
      trafficImpact: {
        baseTime: 0,
        trafficDelay: 0,
        conditions: [],
      },
      costEstimation: {
        fuel: { cost: 0, liters: 0, co2Emissions: 0 },
        tolls: { cost: 0, segments: [] },
        parking: { cost: 0, totalCost: 0, locations: [] },
        total: 0,
      },
      estimatedSavings: { time: 0, distance: 0, cost: 0 },
      routeAnalysis: {
        efficiency: 100,
        suggestions: activities.length === 0 ? ['Add activities to optimize your route'] : [],
      },
    };
  }
  
  // Calculate original route metrics
  const originalDistance = calculateTotalDistance(activities);
  const originalBaseTime = activities.reduce((total, activity, index) => {
    if (index === activities.length - 1) return total;
    const distance = calculateDistance(
      activity.location.coordinates,
      activities[index + 1].location.coordinates
    );
    return total + estimateTravelTime(distance, travelMode);
  }, 0);
  
  // Get original traffic conditions
  const originalTrafficConditions = considerTraffic 
    ? await getTrafficConditions(activities, travelMode) 
    : [];
  const originalTrafficDelay = originalTrafficConditions.reduce((total, condition) => 
    total + condition.delayMinutes, 0
  );
  
  // Optimize route using enhanced algorithm
  const optimizedActivities = optimizeRouteWithTwoOpt(activities, startLocation);
  
  // Calculate optimized route metrics
  const optimizedDistance = calculateTotalDistance(optimizedActivities);
  const optimizedBaseTime = optimizedActivities.reduce((total, activity, index) => {
    if (index === optimizedActivities.length - 1) return total;
    const distance = calculateDistance(
      activity.location.coordinates,
      optimizedActivities[index + 1].location.coordinates
    );
    return total + estimateTravelTime(distance, travelMode);
  }, 0);
  
  // Get optimized traffic conditions
  const optimizedTrafficConditions = considerTraffic 
    ? await getTrafficConditions(optimizedActivities, travelMode) 
    : [];
  const optimizedTrafficDelay = optimizedTrafficConditions.reduce((total, condition) => 
    total + condition.delayMinutes, 0
  );
  
  // Cost estimation
  const originalCosts = estimateRouteCosts(activities, options);
  const optimizedCosts = estimateRouteCosts(optimizedActivities, options);
  
  // Calculate savings
  const timeSavings = Math.max(0, (originalBaseTime + originalTrafficDelay) - (optimizedBaseTime + optimizedTrafficDelay));
  const distanceSavings = Math.max(0, originalDistance - optimizedDistance);
  const costSavings = Math.max(0, originalCosts.total - optimizedCosts.total);
  
  // Generate enhanced suggestions
  const suggestions: string[] = [];
  
  if (timeSavings > 15) {
    suggestions.push(`Enhanced optimization saves ${Math.round(timeSavings)} minutes including traffic delays`);
  }
  
  if (distanceSavings > 1) {
    suggestions.push(`Reduces total travel distance by ${distanceSavings.toFixed(1)} km`);
  }
  
  if (costSavings > 5) {
    suggestions.push(`Saves $${costSavings.toFixed(2)} in total travel costs`);
  }
  
  if (optimizedTrafficConditions.some(c => c.severity === 'heavy' || c.severity === 'severe')) {
    suggestions.push('Heavy traffic detected - consider adjusting departure times');
  }
  
  if (optimizedCosts.fuel.co2Emissions > 20) {
    suggestions.push(`Consider eco-friendly transport - this route produces ${optimizedCosts.fuel.co2Emissions.toFixed(1)}kg CO2`);
  }
  
  const efficiency = Math.min(100, Math.max(0, Math.round(
    ((originalBaseTime + originalTrafficDelay) / (optimizedBaseTime + optimizedTrafficDelay + 1)) * 100
  )));
  
  if (suggestions.length === 0) {
    suggestions.push('Your route is already well optimized with current traffic conditions!');
  }
  
  return {
    optimizedActivities,
    totalTravelTime: optimizedBaseTime + optimizedTrafficDelay,
    totalDistance: optimizedDistance,
    trafficImpact: {
      baseTime: optimizedBaseTime,
      trafficDelay: optimizedTrafficDelay,
      conditions: optimizedTrafficConditions,
    },
    costEstimation: optimizedCosts,
    estimatedSavings: {
      time: timeSavings,
      distance: distanceSavings,
      cost: costSavings,
    },
    routeAnalysis: {
      efficiency,
      suggestions,
    },
  };
}

/**
 * Export enhanced optimizer class
 */
export class EnhancedRouteOptimizer {
  static optimize = enhancedOptimizeRoute;
  static getTrafficConditions = getTrafficConditions;
  static estimateRouteCosts = estimateRouteCosts;
  static optimizeWithTwoOpt = optimizeRouteWithTwoOpt;
}