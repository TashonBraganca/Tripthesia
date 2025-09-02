/**
 * POI (Points of Interest) Detection Service
 * Finds relevant stops along travel routes using Google Places API
 */

import { GoogleMapsProvider, type Coordinate, type PlaceResult, type RouteResult } from './google-maps-provider';
import { z } from 'zod';

// POI Categories with Google Places types
export const POI_CATEGORIES = {
  ACCOMMODATION: {
    name: 'Accommodation',
    icon: '🏨',
    types: ['lodging', 'rv_park', 'campground'],
    priority: 'high',
    searchRadius: 5000, // 5km
  },
  FUEL: {
    name: 'Fuel & Services',
    icon: '⛽',
    types: ['gas_station', 'charging_station', 'car_repair'],
    priority: 'critical',
    searchRadius: 2000, // 2km
  },
  DINING: {
    name: 'Dining',
    icon: '🍽️',
    types: ['restaurant', 'meal_takeaway', 'cafe', 'fast_food'],
    priority: 'medium',
    searchRadius: 3000, // 3km
  },
  REST_AREAS: {
    name: 'Rest Areas',
    icon: '🌳',
    types: ['park', 'rest_stop', 'tourist_attraction'],
    priority: 'medium',
    searchRadius: 5000, // 5km
  },
  ATTRACTIONS: {
    name: 'Attractions',
    icon: '🎯',
    types: ['tourist_attraction', 'museum', 'amusement_park', 'zoo'],
    priority: 'low',
    searchRadius: 10000, // 10km
  },
  EMERGENCY: {
    name: 'Emergency Services',
    icon: '🏥',
    types: ['hospital', 'pharmacy', 'police', 'fire_station'],
    priority: 'critical',
    searchRadius: 15000, // 15km
  },
  SHOPPING: {
    name: 'Shopping',
    icon: '🛍️',
    types: ['shopping_mall', 'supermarket', 'convenience_store'],
    priority: 'low',
    searchRadius: 5000, // 5km
  },
  SERVICES: {
    name: 'Services',
    icon: '🏦',
    types: ['bank', 'atm', 'post_office', 'car_rental'],
    priority: 'medium',
    searchRadius: 3000, // 3km
  },
} as const;

export type POICategory = keyof typeof POI_CATEGORIES;

// Enhanced POI interface
export interface POI extends PlaceResult {
  category: POICategory;
  distanceFromRoute: number; // meters
  estimatedDetour: number; // additional travel time in minutes
  priority: 'critical' | 'high' | 'medium' | 'low';
  routeSegmentIndex: number; // which segment of the route this POI is near
  recommendationScore: number; // 0-100 based on relevance, rating, etc.
  amenities: string[];
  operatingHours?: {
    isOpen: boolean;
    closesAt?: string;
    opensAt?: string;
  };
  contact?: {
    phone?: string;
    website?: string;
  };
  pricing?: {
    level: number; // 1-4 scale
    estimatedCost?: string;
  };
}

export interface POISearchRequest {
  route: RouteResult;
  categories: POICategory[];
  maxDetourMinutes?: number; // Maximum acceptable detour time
  maxDistanceFromRoute?: number; // Maximum distance from route in meters
  userPreferences?: {
    budget?: 'low' | 'medium' | 'high';
    interests?: string[];
    accessibility?: boolean;
    familyFriendly?: boolean;
  };
  prioritizeCritical?: boolean; // Ensure critical POIs (fuel, emergency) are included
}

export interface POISearchResult {
  pois: POI[];
  routeSegments: {
    segmentIndex: number;
    poisCount: number;
    criticalPoisCount: number;
    recommendations: string[];
  }[];
  summary: {
    totalPOIs: number;
    byCategoryCount: Record<POICategory, number>;
    averageDetour: number;
    criticalGaps: string[]; // Warnings about missing critical POIs
  };
}

// Validation schema
const POISearchRequestSchema = z.object({
  categories: z.array(z.enum(Object.keys(POI_CATEGORIES) as [POICategory, ...POICategory[]])),
  maxDetourMinutes: z.number().min(0).max(60).optional(),
  maxDistanceFromRoute: z.number().min(100).max(50000).optional(),
  userPreferences: z.object({
    budget: z.enum(['low', 'medium', 'high']).optional(),
    interests: z.array(z.string()).optional(),
    accessibility: z.boolean().optional(),
    familyFriendly: z.boolean().optional(),
  }).optional(),
  prioritizeCritical: z.boolean().optional(),
});

export class POIDetector {
  private mapsProvider: GoogleMapsProvider;

  constructor(mapsProvider: GoogleMapsProvider) {
    this.mapsProvider = mapsProvider;
  }

  /**
   * Find POIs along a route with intelligent filtering and scoring
   */
  async findPOIsAlongRoute(request: POISearchRequest): Promise<POISearchResult> {
    try {
      // Validate request
      const validatedRequest = POISearchRequestSchema.parse({
        categories: request.categories,
        maxDetourMinutes: request.maxDetourMinutes,
        maxDistanceFromRoute: request.maxDistanceFromRoute,
        userPreferences: request.userPreferences,
        prioritizeCritical: request.prioritizeCritical,
      });

      const route = request.route;
      const maxDetour = validatedRequest.maxDetourMinutes || 15; // 15 minutes default
      const maxDistance = validatedRequest.maxDistanceFromRoute || 5000; // 5km default

      // Extract route points for POI searching
      const routePoints = this.extractRoutePoints(route);
      const allPOIs: POI[] = [];
      
      // Search for each category along the route
      for (const category of validatedRequest.categories) {
        const categoryConfig = POI_CATEGORIES[category];
        const searchRadius = Math.min(categoryConfig.searchRadius, maxDistance);
        
        for (let i = 0; i < routePoints.length; i += Math.max(1, Math.floor(routePoints.length / 10))) {
          const searchPoint = routePoints[i];
          
          try {
            // Search for places of this category
            const places = await this.searchPOIsAtLocation(
              searchPoint,
              category,
              searchRadius,
              validatedRequest.userPreferences
            );

            // Process and score the POIs
            const processedPOIs = await this.processPOIsForRoute(
              places,
              route,
              category,
              i,
              maxDetour
            );

            allPOIs.push(...processedPOIs);
            
            // Small delay to respect API rate limits
            await this.delay(50);
          } catch (error) {
            console.warn(`Failed to search ${category} at route point ${i}:`, error);
          }
        }
      }

      // Remove duplicates and apply final filtering
      const uniquePOIs = this.removeDuplicatePOIs(allPOIs);
      const filteredPOIs = this.applyIntelligentFiltering(uniquePOIs, validatedRequest);
      
      // Sort by recommendation score
      filteredPOIs.sort((a, b) => b.recommendationScore - a.recommendationScore);

      // Generate route segments analysis
      const routeSegments = this.analyzeRouteSegments(filteredPOIs, route);

      // Generate summary
      const summary = this.generatePOISummary(filteredPOIs, validatedRequest);

      return {
        pois: filteredPOIs,
        routeSegments,
        summary,
      };

    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid POI search request: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Get recommended POIs for a specific route segment
   */
  async getSegmentRecommendations(
    route: RouteResult,
    segmentIndex: number,
    categories: POICategory[] = ['FUEL', 'DINING', 'REST_AREAS']
  ): Promise<POI[]> {
    if (segmentIndex >= route.legs.length) {
      throw new Error('Segment index out of range');
    }

    const leg = route.legs[segmentIndex];
    const midpoint: Coordinate = {
      lat: (leg.startLocation.lat + leg.endLocation.lat) / 2,
      lng: (leg.startLocation.lng + leg.endLocation.lng) / 2,
    };

    const searchRequest: POISearchRequest = {
      route,
      categories,
      maxDetourMinutes: 10,
      maxDistanceFromRoute: 3000,
      prioritizeCritical: true,
    };

    const result = await this.findPOIsAlongRoute(searchRequest);
    return result.pois.filter(poi => poi.routeSegmentIndex === segmentIndex);
  }

  // Private helper methods

  private extractRoutePoints(route: RouteResult): Coordinate[] {
    const points: Coordinate[] = [];
    
    // Add start and end points
    if (route.legs.length > 0) {
      points.push(route.legs[0].startLocation);
      
      // Add intermediate points from each leg
      route.legs.forEach(leg => {
        // Sample points along each leg based on distance
        const legDistance = leg.distance.value;
        const sampleInterval = Math.max(5000, legDistance / 10); // Sample every 5km or 1/10th of leg
        
        leg.steps.forEach((step, stepIndex) => {
          if (stepIndex % Math.max(1, Math.floor(leg.steps.length / 5)) === 0) {
            points.push(step.startLocation);
          }
        });
        
        points.push(leg.endLocation);
      });
    }

    return points;
  }

  private async searchPOIsAtLocation(
    location: Coordinate,
    category: POICategory,
    radius: number,
    userPreferences?: any
  ): Promise<PlaceResult[]> {
    const categoryConfig = POI_CATEGORIES[category];
    const places: PlaceResult[] = [];
    
    // Search for each type in the category
    for (const type of categoryConfig.types) {
      try {
        const results = await this.mapsProvider.searchPlaces({
          location,
          radius,
          type,
          fields: [
            'place_id', 'name', 'formatted_address', 'geometry', 'types',
            'rating', 'price_level', 'business_status', 'opening_hours'
          ],
        });
        
        places.push(...results);
      } catch (error) {
        console.warn(`Failed to search for ${type} places:`, error);
      }
    }

    return places;
  }

  private async processPOIsForRoute(
    places: PlaceResult[],
    route: RouteResult,
    category: POICategory,
    segmentIndex: number,
    maxDetour: number
  ): Promise<POI[]> {
    const categoryConfig = POI_CATEGORIES[category];
    const processedPOIs: POI[] = [];

    for (const place of places) {
      try {
        // Calculate distance from route
        const distanceFromRoute = this.calculateDistanceFromRoute(place.location, route);
        
        // Estimate detour time (simplified calculation)
        const estimatedDetour = Math.max(1, Math.round(distanceFromRoute / 1000 * 2)); // 2 minutes per km

        if (estimatedDetour <= maxDetour) {
          // Calculate recommendation score
          const recommendationScore = this.calculateRecommendationScore(
            place,
            category,
            distanceFromRoute,
            estimatedDetour
          );

          const poi: POI = {
            ...place,
            category,
            distanceFromRoute,
            estimatedDetour,
            priority: categoryConfig.priority,
            routeSegmentIndex: segmentIndex,
            recommendationScore,
            amenities: this.extractAmenities(place, category),
            operatingHours: this.processOperatingHours(place.openingHours),
            pricing: place.priceLevel ? {
              level: place.priceLevel,
              estimatedCost: this.estimateCost(place.priceLevel, category),
            } : undefined,
          };

          processedPOIs.push(poi);
        }
      } catch (error) {
        console.warn('Failed to process POI:', place.name, error);
      }
    }

    return processedPOIs;
  }

  private calculateDistanceFromRoute(poiLocation: Coordinate, route: RouteResult): number {
    let minDistance = Infinity;

    // Check distance to all route segments
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        const distance = this.calculateHaversineDistance(
          poiLocation,
          step.startLocation
        );
        minDistance = Math.min(minDistance, distance);
      }
    }

    return minDistance;
  }

  private calculateHaversineDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateRecommendationScore(
    place: PlaceResult,
    category: POICategory,
    distanceFromRoute: number,
    estimatedDetour: number
  ): number {
    let score = 50; // Base score

    // Rating impact (0-40 points)
    if (place.rating) {
      score += (place.rating - 2.5) * 8; // Scale 1-5 rating to -12 to +20 points
    }

    // Distance penalty (0 to -30 points)
    const distancePenalty = Math.min(30, (distanceFromRoute / 1000) * 10);
    score -= distancePenalty;

    // Detour penalty (0 to -20 points)
    const detourPenalty = Math.min(20, estimatedDetour * 2);
    score -= detourPenalty;

    // Category priority bonus
    const categoryConfig = POI_CATEGORIES[category];
    const priorityBonus = {
      critical: 20,
      high: 10,
      medium: 5,
      low: 0,
    }[categoryConfig.priority];
    score += priorityBonus;

    // Business status penalty
    if (place.businessStatus === 'CLOSED_PERMANENTLY') {
      score -= 50;
    } else if (place.businessStatus === 'CLOSED_TEMPORARILY') {
      score -= 20;
    }

    // Price level consideration (for budget-conscious travelers)
    if (place.priceLevel) {
      const priceBonus = place.priceLevel <= 2 ? 10 : place.priceLevel >= 4 ? -10 : 0;
      score += priceBonus;
    }

    return Math.max(0, Math.min(100, score));
  }

  private extractAmenities(place: PlaceResult, category: POICategory): string[] {
    const amenities: string[] = [];

    // Based on place types and category
    if (place.types.includes('wheelchair_accessible_entrance')) {
      amenities.push('Wheelchair Accessible');
    }

    if (category === 'ACCOMMODATION') {
      if (place.types.includes('spa')) amenities.push('Spa');
      if (place.types.includes('gym')) amenities.push('Fitness Center');
      if (place.rating && place.rating > 4) amenities.push('Highly Rated');
    }

    if (category === 'FUEL') {
      if (place.types.includes('charging_station')) amenities.push('EV Charging');
      if (place.types.includes('convenience_store')) amenities.push('Convenience Store');
      amenities.push('Restrooms');
    }

    if (category === 'DINING') {
      if (place.types.includes('meal_delivery')) amenities.push('Delivery Available');
      if (place.types.includes('meal_takeaway')) amenities.push('Takeaway');
      if (place.priceLevel && place.priceLevel <= 2) amenities.push('Budget Friendly');
    }

    return amenities;
  }

  private processOperatingHours(openingHours?: any): POI['operatingHours'] {
    if (!openingHours) return undefined;

    return {
      isOpen: openingHours.isOpen || false,
      closesAt: openingHours.closesAt,
      opensAt: openingHours.opensAt,
    };
  }

  private estimateCost(priceLevel: number, category: POICategory): string {
    const costs = {
      ACCOMMODATION: ['$50-80', '$80-120', '$120-200', '$200+'],
      DINING: ['$5-15', '$15-30', '$30-60', '$60+'],
      FUEL: ['Standard', 'Standard', 'Premium', 'Premium'],
      SERVICES: ['$5-20', '$20-50', '$50-100', '$100+'],
    };

    const categoryCosts = costs[category as keyof typeof costs] || ['$', '$$', '$$$', '$$$$'];
    return categoryCosts[Math.min(priceLevel - 1, categoryCosts.length - 1)] || 'Unknown';
  }

  private removeDuplicatePOIs(pois: POI[]): POI[] {
    const seen = new Set<string>();
    return pois.filter(poi => {
      if (seen.has(poi.placeId)) return false;
      seen.add(poi.placeId);
      return true;
    });
  }

  private applyIntelligentFiltering(pois: POI[], request: any): POI[] {
    let filtered = pois;

    // Prioritize critical POIs if requested
    if (request.prioritizeCritical) {
      const critical = filtered.filter(poi => poi.priority === 'critical');
      const nonCritical = filtered.filter(poi => poi.priority !== 'critical');
      
      // Ensure we have critical POIs, then add others up to a reasonable limit
      filtered = [
        ...critical.slice(0, 20), // Max 20 critical POIs
        ...nonCritical.slice(0, 30), // Max 30 non-critical POIs
      ];
    } else {
      // Limit total POIs to prevent information overload
      filtered = filtered.slice(0, 50);
    }

    // Apply user preferences
    if (request.userPreferences) {
      filtered = this.applyUserPreferences(filtered, request.userPreferences);
    }

    return filtered;
  }

  private applyUserPreferences(pois: POI[], preferences: any): POI[] {
    return pois.filter(poi => {
      // Budget filter
      if (preferences.budget === 'low' && poi.pricing && poi.pricing.level > 2) {
        return false;
      }
      if (preferences.budget === 'high' && poi.pricing && poi.pricing.level < 3) {
        return false;
      }

      // Accessibility filter
      if (preferences.accessibility && !poi.amenities.includes('Wheelchair Accessible')) {
        return false;
      }

      // Family-friendly filter (simplified)
      if (preferences.familyFriendly && poi.category === 'DINING' && poi.rating && poi.rating < 3.5) {
        return false;
      }

      return true;
    });
  }

  private analyzeRouteSegments(pois: POI[], route: RouteResult): any[] {
    const segments = route.legs.map((leg, index) => {
      const segmentPOIs = pois.filter(poi => poi.routeSegmentIndex === index);
      const criticalPOIs = segmentPOIs.filter(poi => poi.priority === 'critical');
      
      const recommendations: string[] = [];
      if (criticalPOIs.length === 0) {
        recommendations.push('Consider adding fuel stops along this segment');
      }
      if (segmentPOIs.filter(poi => poi.category === 'DINING').length === 0 && leg.duration.value > 7200) {
        recommendations.push('Long segment - consider meal stops');
      }

      return {
        segmentIndex: index,
        poisCount: segmentPOIs.length,
        criticalPoisCount: criticalPOIs.length,
        recommendations,
      };
    });

    return segments;
  }

  private generatePOISummary(pois: POI[], request: any): any {
    const byCategoryCount = {} as Record<POICategory, number>;
    
    // Initialize counts
    Object.keys(POI_CATEGORIES).forEach(category => {
      byCategoryCount[category as POICategory] = 0;
    });

    // Count POIs by category
    pois.forEach(poi => {
      byCategoryCount[poi.category]++;
    });

    const averageDetour = pois.length > 0 
      ? pois.reduce((sum, poi) => sum + poi.estimatedDetour, 0) / pois.length
      : 0;

    const criticalGaps: string[] = [];
    if (byCategoryCount.FUEL === 0) {
      criticalGaps.push('No fuel stations found along route');
    }
    if (byCategoryCount.EMERGENCY === 0) {
      criticalGaps.push('Limited emergency services along route');
    }

    return {
      totalPOIs: pois.length,
      byCategoryCount,
      averageDetour: Math.round(averageDetour),
      criticalGaps,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default POIDetector;