/**
 * Route optimization utilities for daily activity planning
 */

import type { Activity } from '@/components/planning/TimelineBuilder';

export interface Location {
  lat: number;
  lng: number;
}

export interface RouteOptimizationResult {
  optimizedActivities: Activity[];
  totalTravelTime: number; // in minutes
  totalDistance: number; // in kilometers
  estimatedSavings: {
    time: number; // minutes saved
    distance: number; // km saved
  };
  routeAnalysis: {
    efficiency: number; // 0-100 percentage
    suggestions: string[];
  };
}

export interface TravelSegment {
  from: Activity;
  to: Activity;
  distance: number; // km
  travelTime: number; // minutes
  mode: 'walking' | 'driving' | 'public_transport';
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(loc2.lat - loc1.lat);
  const dLon = toRadians(loc2.lng - loc1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(loc1.lat)) * Math.cos(toRadians(loc2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Estimate travel time based on distance and transportation mode
 */
export function estimateTravelTime(distance: number, mode: 'walking' | 'driving' | 'public_transport' = 'driving'): number {
  const speeds = {
    walking: 5, // km/h
    driving: 25, // km/h (city average with traffic)
    public_transport: 20, // km/h (including waiting time)
  };
  
  const timeInHours = distance / speeds[mode];
  return Math.round(timeInHours * 60); // convert to minutes
}

/**
 * Create travel segments between consecutive activities
 */
export function createTravelSegments(activities: Activity[], mode: 'walking' | 'driving' | 'public_transport' = 'driving'): TravelSegment[] {
  const segments: TravelSegment[] = [];
  
  for (let i = 0; i < activities.length - 1; i++) {
    const from = activities[i];
    const to = activities[i + 1];
    
    const distance = calculateDistance(
      from.location.coordinates,
      to.location.coordinates
    );
    
    const travelTime = estimateTravelTime(distance, mode);
    
    segments.push({
      from,
      to,
      distance,
      travelTime,
      mode,
    });
  }
  
  return segments;
}

/**
 * Traveling Salesman Problem solver using Nearest Neighbor algorithm
 * This is a simplified version - for production, consider more sophisticated algorithms
 */
export function optimizeRouteOrder(activities: Activity[], startLocation?: Location): Activity[] {
  if (activities.length <= 2) return activities;
  
  const unvisited = [...activities];
  const optimized: Activity[] = [];
  
  // Start with the first activity or closest to start location
  let current = startLocation
    ? unvisited.reduce((closest, activity) => {
        const distanceCurrent = calculateDistance(startLocation, activity.location.coordinates);
        const distanceClosest = calculateDistance(startLocation, closest.location.coordinates);
        return distanceCurrent < distanceClosest ? activity : closest;
      })
    : unvisited[0];
  
  optimized.push(current);
  unvisited.splice(unvisited.indexOf(current), 1);
  
  // Greedy nearest neighbor approach
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
 * Smart time adjustment to ensure activities fit within their time constraints
 */
export function adjustActivityTimes(activities: Activity[], travelMode: 'walking' | 'driving' | 'public_transport' = 'driving'): Activity[] {
  if (activities.length === 0) return activities;
  
  const adjusted = [...activities];
  
  // Sort by original start time to maintain some temporal order
  adjusted.sort((a, b) => new Date(a.timeSlot.start).getTime() - new Date(b.timeSlot.start).getTime());
  
  for (let i = 1; i < adjusted.length; i++) {
    const previous = adjusted[i - 1];
    const current = adjusted[i];
    
    const distance = calculateDistance(
      previous.location.coordinates,
      current.location.coordinates
    );
    
    const travelTime = estimateTravelTime(distance, travelMode);
    const previousEnd = new Date(previous.timeSlot.end);
    const requiredStart = new Date(previousEnd.getTime() + (travelTime * 60000));
    const currentStart = new Date(current.timeSlot.start);
    
    // If current activity starts too early, adjust it
    if (requiredStart > currentStart) {
      const newStart = requiredStart.toISOString();
      const newEnd = new Date(requiredStart.getTime() + (current.timeSlot.duration * 60000)).toISOString();
      
      adjusted[i] = {
        ...current,
        timeSlot: {
          ...current.timeSlot,
          start: newStart,
          end: newEnd,
        },
      };
    }
  }
  
  return adjusted;
}

/**
 * Comprehensive route optimization
 */
export function optimizeRoute(
  activities: Activity[],
  options: {
    travelMode?: 'walking' | 'driving' | 'public_transport';
    startLocation?: Location;
    prioritizeTime?: boolean; // vs distance
    preserveTimeConstraints?: boolean;
  } = {}
): RouteOptimizationResult {
  const {
    travelMode = 'driving',
    startLocation,
    prioritizeTime = true,
    preserveTimeConstraints = true,
  } = options;
  
  if (activities.length <= 1) {
    return {
      optimizedActivities: activities,
      totalTravelTime: 0,
      totalDistance: 0,
      estimatedSavings: { time: 0, distance: 0 },
      routeAnalysis: {
        efficiency: 100,
        suggestions: activities.length === 0 ? ['Add activities to optimize your route'] : [],
      },
    };
  }
  
  // Calculate original route metrics
  const originalSegments = createTravelSegments(activities, travelMode);
  const originalTotalDistance = originalSegments.reduce((sum, segment) => sum + segment.distance, 0);
  const originalTotalTime = originalSegments.reduce((sum, segment) => sum + segment.travelTime, 0);
  
  // Optimize route order
  let optimizedActivities = optimizeRouteOrder(activities, startLocation);
  
  // Adjust times if needed
  if (preserveTimeConstraints) {
    optimizedActivities = adjustActivityTimes(optimizedActivities, travelMode);
  }
  
  // Calculate optimized route metrics
  const optimizedSegments = createTravelSegments(optimizedActivities, travelMode);
  const optimizedTotalDistance = optimizedSegments.reduce((sum, segment) => sum + segment.distance, 0);
  const optimizedTotalTime = optimizedSegments.reduce((sum, segment) => sum + segment.travelTime, 0);
  
  // Calculate savings
  const timeSavings = Math.max(0, originalTotalTime - optimizedTotalTime);
  const distanceSavings = Math.max(0, originalTotalDistance - optimizedTotalDistance);
  
  // Calculate efficiency score
  const maxPossibleSavings = originalTotalTime; // theoretical maximum
  const efficiency = maxPossibleSavings > 0 
    ? Math.round(((maxPossibleSavings - optimizedTotalTime) / maxPossibleSavings) * 100)
    : 100;
  
  // Generate suggestions
  const suggestions: string[] = [];
  
  if (timeSavings > 30) {
    suggestions.push(`Optimized route saves ${Math.round(timeSavings)} minutes of travel time`);
  }
  
  if (distanceSavings > 1) {
    suggestions.push(`Reduces total travel distance by ${distanceSavings.toFixed(1)} km`);
  }
  
  if (efficiency < 70) {
    suggestions.push('Consider grouping activities by location to reduce travel time');
  }
  
  if (optimizedSegments.some(segment => segment.travelTime > 60)) {
    suggestions.push('Some activities are far apart - consider transportation mode or timing');
  }
  
  // Check for activities in same area
  const clusters = findLocationClusters(optimizedActivities);
  if (clusters.length > 1) {
    suggestions.push(`Found ${clusters.length} location clusters - consider scheduling by area`);
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Your route is already well optimized!');
  }
  
  return {
    optimizedActivities,
    totalTravelTime: optimizedTotalTime,
    totalDistance: optimizedTotalDistance,
    estimatedSavings: {
      time: timeSavings,
      distance: distanceSavings,
    },
    routeAnalysis: {
      efficiency: Math.max(0, Math.min(100, efficiency)),
      suggestions,
    },
  };
}

/**
 * Find clusters of nearby activities
 */
export function findLocationClusters(activities: Activity[], maxClusterDistance: number = 2): Activity[][] {
  if (activities.length === 0) return [];
  
  const clusters: Activity[][] = [];
  const processed = new Set<string>();
  
  for (const activity of activities) {
    if (processed.has(activity.id)) continue;
    
    const cluster: Activity[] = [activity];
    processed.add(activity.id);
    
    // Find nearby activities
    for (const otherActivity of activities) {
      if (processed.has(otherActivity.id)) continue;
      
      const distance = calculateDistance(
        activity.location.coordinates,
        otherActivity.location.coordinates
      );
      
      if (distance <= maxClusterDistance) {
        cluster.push(otherActivity);
        processed.add(otherActivity.id);
      }
    }
    
    clusters.push(cluster);
  }
  
  return clusters;
}

/**
 * Suggest optimal activity timing based on category and location
 */
export function suggestOptimalTiming(activities: Activity[]): { suggestions: string[]; adjustedActivities: Activity[] } {
  const suggestions: string[] = [];
  const adjustedActivities = [...activities];
  
  // Time-based suggestions by category
  const categoryTiming: Record<string, { ideal: number[]; avoid: number[] }> = {
    sightseeing: { ideal: [9, 10, 11, 14, 15, 16], avoid: [12, 13] }, // Avoid lunch rush
    dining: { ideal: [12, 13, 18, 19, 20], avoid: [] },
    shopping: { ideal: [10, 11, 14, 15, 16], avoid: [12, 13, 18, 19] },
    entertainment: { ideal: [19, 20, 21], avoid: [8, 9, 10] },
    accommodation: { ideal: [15, 16, 17], avoid: [8, 9, 10, 11] }, // Check-in times
    transport: { ideal: [], avoid: [7, 8, 17, 18] }, // Rush hours
  };
  
  activities.forEach((activity, index) => {
    const timing = categoryTiming[activity.category];
    const activityHour = new Date(activity.timeSlot.start).getHours();
    
    if (timing.avoid.includes(activityHour)) {
      suggestions.push(
        `Consider rescheduling ${activity.title} to avoid ${activity.category === 'transport' ? 'rush hour' : 'peak times'}`
      );
    }
    
    if (timing.ideal.length > 0 && !timing.ideal.includes(activityHour)) {
      const idealTimes = timing.ideal.map(h => `${h}:00`).join(', ');
      suggestions.push(`${activity.title} works best around ${idealTimes}`);
    }
  });
  
  return { suggestions, adjustedActivities };
}

// Helper functions
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Export all utilities as a single optimizer class
 */
export class RouteOptimizer {
  static optimize = optimizeRoute;
  static calculateDistance = calculateDistance;
  static estimateTravelTime = estimateTravelTime;
  static createTravelSegments = createTravelSegments;
  static findLocationClusters = findLocationClusters;
  static suggestOptimalTiming = suggestOptimalTiming;
  static adjustActivityTimes = adjustActivityTimes;
}