/**
 * Enhanced POI Detection Service - Phase 3.3
 * Integrates OpenTripMap, Foursquare, and Google Places APIs
 * with advanced route-based filtering
 */

import { GoogleMapsProvider, type Coordinate, type PlaceResult, type RouteResult } from './google-maps-provider';
import { POIDetector, type POI, type POICategory, type POISearchRequest, type POISearchResult, POI_CATEGORIES } from './poi-detector';
import { z } from 'zod';

// OpenTripMap POI interface
export interface OpenTripMapPOI {
  xid: string;
  name: string;
  point: {
    lon: number;
    lat: number;
  };
  kinds: string;
  osm: string;
  wikidata?: string;
  rate: number; // 1-7 popularity rating
  dist: number; // distance from search point
  preview?: {
    source: string;
    height: number;
    width: number;
  };
  wikipedia?: string;
  wikipedia_extracts?: {
    text: string;
    title: string;
  };
}

// Foursquare POI interface
export interface FoursquarePOI {
  fsq_id: string;
  name: string;
  location: {
    address?: string;
    formatted_address?: string;
    locality?: string;
    region?: string;
    postcode?: string;
    country?: string;
    latitude: number;
    longitude: number;
  };
  categories: Array<{
    id: number;
    name: string;
    icon: {
      prefix: string;
      suffix: string;
    };
  }>;
  distance?: number;
  rating?: number;
  price?: number; // 1-4 price level
  hours?: {
    open_now: boolean;
    display: string;
  };
  stats?: {
    total_ratings: number;
    total_tips: number;
  };
  verified: boolean;
  website?: string;
  tel?: string;
}

// Enhanced POI with additional metadata
export interface EnhancedPOI extends POI {
  sources: ('google' | 'opentripmap' | 'foursquare')[];
  culturalSignificance?: {
    hasWikipedia: boolean;
    historicalImportance: number; // 0-10 scale
    touristRating: number; // 0-10 scale
  };
  localPopularity?: {
    foursquareRating?: number;
    totalReviews: number;
    verified: boolean;
  };
  detailedInfo?: {
    description?: string;
    wikipediaExtract?: string;
    website?: string;
    phone?: string;
  };
}

export interface EnhancedPOISearchResult {
  pois: EnhancedPOI[];
  routeSegments: {
    segmentIndex: number;
    poisCount: number;
    criticalPoisCount: number;
    culturalSitesCount: number;
    localFavoritesCount: number;
    recommendations: string[];
  }[];
  summary: {
    totalPOIs: number;
    byCategoryCount: Record<POICategory, number>;
    bySourceCount: Record<'google' | 'opentripmap' | 'foursquare', number>;
    averageDetour: number;
    criticalGaps: string[];
    culturalHighlights: string[];
    localRecommendations: string[];
  };
}

// OpenTripMap category mapping
const OPENTRIPMAP_CATEGORIES: Record<POICategory, string[]> = {
  ACCOMMODATION: ['accomodations'],
  FUEL: ['transport'],
  DINING: ['foods'],
  REST_AREAS: ['natural', 'leisure'],
  ATTRACTIONS: ['cultural', 'historic', 'architecture', 'museums', 'theatres_and_entertainments'],
  EMERGENCY: ['other'],
  SHOPPING: ['shops'],
  SERVICES: ['banks', 'offices'],
};

// Foursquare category mapping  
const FOURSQUARE_CATEGORIES: Record<POICategory, number[]> = {
  ACCOMMODATION: [19014], // Hotels
  FUEL: [17119], // Gas stations
  DINING: [13065], // Food and Dining
  REST_AREAS: [16000], // Outdoors and Recreation
  ATTRACTIONS: [12000], // Arts and Entertainment
  EMERGENCY: [15000], // Health and Medicine
  SHOPPING: [17000], // Retail
  SERVICES: [18000], // Professional Services
};

export class EnhancedPOIDetector {
  private basePOIDetector: POIDetector;
  private mapsProvider: GoogleMapsProvider;
  private openTripMapApiKey?: string;
  private foursquareApiKey?: string;

  constructor(
    mapsProvider: GoogleMapsProvider,
    config: {
      openTripMapApiKey?: string;
      foursquareApiKey?: string;
    } = {}
  ) {
    this.basePOIDetector = new POIDetector(mapsProvider);
    this.mapsProvider = mapsProvider;
    this.openTripMapApiKey = config.openTripMapApiKey || process.env.OPENTRIPMAP_API_KEY;
    this.foursquareApiKey = config.foursquareApiKey || process.env.FOURSQUARE_API_KEY;
  }

  /**
   * Find POIs along route using multiple APIs with intelligent aggregation
   */
  async findEnhancedPOIsAlongRoute(request: POISearchRequest): Promise<EnhancedPOISearchResult> {
    try {
      // Get base POIs from Google Places (using existing implementation)
      const baseResult = await this.basePOIDetector.findPOIsAlongRoute(request);
      
      // Get route points for additional API searches
      const routePoints = this.extractRoutePoints(request.route);
      
      // Search OpenTripMap for cultural/tourist attractions
      const openTripMapPOIs = await this.searchOpenTripMapPOIs(routePoints, request);
      
      // Search Foursquare for local business recommendations
      const foursquarePOIs = await this.searchFoursquarePOIs(routePoints, request);
      
      // Merge and enhance all POIs
      const enhancedPOIs = await this.mergeAndEnhancePOIs(
        baseResult.pois,
        openTripMapPOIs,
        foursquarePOIs,
        request
      );
      
      // Apply advanced route-based filtering
      const filteredPOIs = this.applyAdvancedRouteFiltering(enhancedPOIs, request.route, request);
      
      // Sort by enhanced recommendation score
      filteredPOIs.sort((a, b) => this.calculateEnhancedScore(b) - this.calculateEnhancedScore(a));
      
      // Generate enhanced analysis
      const enhancedSegments = this.analyzeEnhancedRouteSegments(filteredPOIs, request.route);
      const enhancedSummary = this.generateEnhancedSummary(filteredPOIs, request);
      
      return {
        pois: filteredPOIs,
        routeSegments: enhancedSegments,
        summary: enhancedSummary,
      };
      
    } catch (error) {
      console.error('Enhanced POI search failed:', error);
      // Fallback to basic POI detection
      const baseResult = await this.basePOIDetector.findPOIsAlongRoute(request);
      return this.convertToEnhancedResult(baseResult);
    }
  }

  /**
   * Search OpenTripMap for cultural and tourist attractions
   */
  private async searchOpenTripMapPOIs(routePoints: Coordinate[], request: POISearchRequest): Promise<OpenTripMapPOI[]> {
    if (!this.openTripMapApiKey) {
      console.warn('OpenTripMap API key not found, skipping cultural attractions search');
      return [];
    }

    const allPOIs: OpenTripMapPOI[] = [];
    const maxDistance = request.maxDistanceFromRoute || 10000; // 10km for cultural sites
    
    // Focus on cultural categories for OpenTripMap
    const culturalCategories = request.categories.filter(cat => 
      ['ATTRACTIONS', 'REST_AREAS'].includes(cat)
    );
    
    if (culturalCategories.length === 0) return [];

    try {
      // Sample route points (don't search every single point to avoid rate limits)
      const samplePoints = this.sampleRoutePoints(routePoints, 5); // Max 5 search points
      
      for (const point of samplePoints) {
        for (const category of culturalCategories) {
          const kinds = OPENTRIPMAP_CATEGORIES[category].join(',');
          
          try {
            const response = await fetch(
              `https://api.opentripmap.com/0.1/en/places/radius?radius=${maxDistance}&lon=${point.lng}&lat=${point.lat}&kinds=${kinds}&format=json&limit=20&apikey=${this.openTripMapApiKey}`
            );
            
            if (response.ok) {
              const data = await response.json();
              allPOIs.push(...data.features || []);
            }
            
            // Rate limiting
            await this.delay(200);
          } catch (error) {
            console.warn(`OpenTripMap search failed for ${category}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('OpenTripMap API error:', error);
    }

    return allPOIs;
  }

  /**
   * Search Foursquare for local business recommendations
   */
  private async searchFoursquarePOIs(routePoints: Coordinate[], request: POISearchRequest): Promise<FoursquarePOI[]> {
    if (!this.foursquareApiKey) {
      console.warn('Foursquare API key not found, skipping local business search');
      return [];
    }

    const allPOIs: FoursquarePOI[] = [];
    const maxDistance = request.maxDistanceFromRoute || 5000; // 5km for businesses
    
    try {
      // Sample route points for Foursquare searches
      const samplePoints = this.sampleRoutePoints(routePoints, 3); // Max 3 search points
      
      for (const point of samplePoints) {
        for (const category of request.categories) {
          const foursquareCategories = FOURSQUARE_CATEGORIES[category];
          if (!foursquareCategories) continue;
          
          try {
            const categoryIds = foursquareCategories.join(',');
            
            const response = await fetch(
              `https://api.foursquare.com/v3/places/search?ll=${point.lat},${point.lng}&radius=${maxDistance}&categories=${categoryIds}&limit=20&sort=POPULARITY`,
              {
                headers: {
                  'Authorization': `Bearer ${this.foursquareApiKey}`,
                  'Accept': 'application/json',
                },
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              allPOIs.push(...data.results || []);
            }
            
            // Rate limiting
            await this.delay(300);
          } catch (error) {
            console.warn(`Foursquare search failed for ${category}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Foursquare API error:', error);
    }

    return allPOIs;
  }

  /**
   * Merge POIs from all sources and enhance with additional metadata
   */
  private async mergeAndEnhancePOIs(
    basePOIs: POI[],
    openTripMapPOIs: OpenTripMapPOI[],
    foursquarePOIs: FoursquarePOI[],
    request: POISearchRequest
  ): Promise<EnhancedPOI[]> {
    const enhancedPOIs: EnhancedPOI[] = [];
    
    // Convert base Google POIs to enhanced POIs
    for (const poi of basePOIs) {
      const enhancedPOI: EnhancedPOI = {
        ...poi,
        sources: ['google'],
      };
      enhancedPOIs.push(enhancedPOI);
    }
    
    // Add OpenTripMap POIs
    for (const otmPOI of openTripMapPOIs) {
      const enhancedPOI = await this.convertOpenTripMapPOI(otmPOI, request);
      if (enhancedPOI) {
        enhancedPOIs.push(enhancedPOI);
      }
    }
    
    // Add Foursquare POIs
    for (const fsPOI of foursquarePOIs) {
      const enhancedPOI = await this.convertFoursquarePOI(fsPOI, request);
      if (enhancedPOI) {
        enhancedPOIs.push(enhancedPOI);
      }
    }
    
    // Remove duplicates and merge similar POIs
    return this.deduplicateAndMergePOIs(enhancedPOIs);
  }

  /**
   * Convert OpenTripMap POI to enhanced POI format
   */
  private async convertOpenTripMapPOI(otmPOI: OpenTripMapPOI, request: POISearchRequest): Promise<EnhancedPOI | null> {
    try {
      // Determine category based on kinds
      const category = this.categorizeOpenTripMapPOI(otmPOI.kinds);
      if (!category || !request.categories.includes(category)) return null;
      
      const location: Coordinate = {
        lat: otmPOI.point.lat,
        lng: otmPOI.point.lon,
      };
      
      // Calculate route metrics
      const distanceFromRoute = this.calculateDistanceFromRoute(location, request.route);
      const estimatedDetour = Math.max(1, Math.round(distanceFromRoute / 1000 * 3)); // 3 minutes per km
      
      // Skip if too far from route
      const maxDetour = request.maxDetourMinutes || 15;
      if (estimatedDetour > maxDetour) return null;
      
      // Get detailed info if available
      let detailedInfo: EnhancedPOI['detailedInfo'] = {};
      if (otmPOI.xid) {
        try {
          detailedInfo = await this.getOpenTripMapDetails(otmPOI.xid);
        } catch (error) {
          console.warn('Failed to get OpenTripMap details:', error);
        }
      }
      
      return {
        placeId: `otm_${otmPOI.xid}`,
        name: otmPOI.name || 'Unknown Attraction',
        formattedAddress: `${location.lat}, ${location.lng}`,
        location,
        types: otmPOI.kinds.split(','),
        rating: Math.min(5, otmPOI.rate * 0.7), // Convert 1-7 to 1-5 scale
        businessStatus: 'OPERATIONAL',
        category,
        distanceFromRoute,
        estimatedDetour,
        priority: POI_CATEGORIES[category].priority,
        routeSegmentIndex: 0, // Will be calculated later
        recommendationScore: this.calculateOpenTripMapScore(otmPOI, distanceFromRoute),
        amenities: ['Historical Site', 'Tourist Attraction'],
        sources: ['opentripmap'],
        culturalSignificance: {
          hasWikipedia: !!otmPOI.wikipedia,
          historicalImportance: Math.min(10, otmPOI.rate * 1.4),
          touristRating: Math.min(10, otmPOI.rate * 1.4),
        },
        detailedInfo,
      };
    } catch (error) {
      console.warn('Failed to convert OpenTripMap POI:', error);
      return null;
    }
  }

  /**
   * Convert Foursquare POI to enhanced POI format
   */
  private async convertFoursquarePOI(fsPOI: FoursquarePOI, request: POISearchRequest): Promise<EnhancedPOI | null> {
    try {
      // Determine category based on Foursquare categories
      const category = this.categorizeFoursquarePOI(fsPOI.categories);
      if (!category || !request.categories.includes(category)) return null;
      
      const location: Coordinate = {
        lat: fsPOI.location.latitude,
        lng: fsPOI.location.longitude,
      };
      
      // Calculate route metrics
      const distanceFromRoute = this.calculateDistanceFromRoute(location, request.route);
      const estimatedDetour = Math.max(1, Math.round(distanceFromRoute / 1000 * 2)); // 2 minutes per km
      
      // Skip if too far from route
      const maxDetour = request.maxDetourMinutes || 15;
      if (estimatedDetour > maxDetour) return null;
      
      return {
        placeId: `fs_${fsPOI.fsq_id}`,
        name: fsPOI.name,
        formattedAddress: fsPOI.location.formatted_address || fsPOI.location.address || `${location.lat}, ${location.lng}`,
        location,
        types: fsPOI.categories.map(cat => cat.name.toLowerCase().replace(/\s+/g, '_')),
        rating: fsPOI.rating || undefined,
        priceLevel: fsPOI.price || undefined,
        businessStatus: 'OPERATIONAL',
        openingHours: fsPOI.hours ? {
          isOpen: fsPOI.hours.open_now,
        } : undefined,
        category,
        distanceFromRoute,
        estimatedDetour,
        priority: POI_CATEGORIES[category].priority,
        routeSegmentIndex: 0, // Will be calculated later
        recommendationScore: this.calculateFoursquareScore(fsPOI, distanceFromRoute),
        amenities: this.extractFoursquareAmenities(fsPOI),
        sources: ['foursquare'],
        localPopularity: {
          foursquareRating: fsPOI.rating,
          totalReviews: fsPOI.stats?.total_ratings || 0,
          verified: fsPOI.verified,
        },
        detailedInfo: {
          website: fsPOI.website,
          phone: fsPOI.tel,
        },
      };
    } catch (error) {
      console.warn('Failed to convert Foursquare POI:', error);
      return null;
    }
  }

  /**
   * Apply advanced route-based filtering with intelligent spacing
   */
  private applyAdvancedRouteFiltering(pois: EnhancedPOI[], route: RouteResult, request: POISearchRequest): EnhancedPOI[] {
    // Calculate route segment indices for each POI
    pois.forEach(poi => {
      poi.routeSegmentIndex = this.findClosestRouteSegment(poi.location, route);
    });
    
    // Apply category-specific filtering
    const filteredPOIs: EnhancedPOI[] = [];
    
    for (const category of request.categories) {
      const categoryPOIs = pois.filter(poi => poi.category === category);
      const filtered = this.filterPOIsByCategory(categoryPOIs, category, route, request);
      filteredPOIs.push(...filtered);
    }
    
    // Apply intelligent spacing to prevent clustering
    return this.applyIntelligentSpacing(filteredPOIs, route);
  }

  /**
   * Filter POIs by category with specific rules
   */
  private filterPOIsByCategory(pois: EnhancedPOI[], category: POICategory, route: RouteResult, request: POISearchRequest): EnhancedPOI[] {
    const categoryConfig = POI_CATEGORIES[category];
    let maxPOIs: number;
    
    // Category-specific limits
    switch (category) {
      case 'FUEL':
        maxPOIs = Math.max(3, Math.ceil(route.totalDistance.value / 100000)); // Every 100km
        break;
      case 'DINING':
        maxPOIs = Math.max(2, Math.ceil(route.totalDuration.value / 14400)); // Every 4 hours
        break;
      case 'ATTRACTIONS':
        maxPOIs = Math.min(10, pois.length); // Max 10 attractions
        break;
      case 'EMERGENCY':
        maxPOIs = Math.max(2, Math.ceil(route.legs.length / 2)); // At least 2, more for longer routes
        break;
      default:
        maxPOIs = 5;
    }
    
    // Sort by recommendation score and take top POIs
    const sorted = pois.sort((a, b) => this.calculateEnhancedScore(b) - this.calculateEnhancedScore(a));
    return sorted.slice(0, maxPOIs);
  }

  /**
   * Apply intelligent spacing to prevent POI clustering
   */
  private applyIntelligentSpacing(pois: EnhancedPOI[], route: RouteResult): EnhancedPOI[] {
    const spaced: EnhancedPOI[] = [];
    const minSpacing = 5000; // 5km minimum spacing for similar POIs
    
    for (const poi of pois) {
      const tooClose = spaced.some(existing => 
        existing.category === poi.category &&
        this.calculateHaversineDistance(poi.location, existing.location) < minSpacing
      );
      
      if (!tooClose) {
        spaced.push(poi);
      }
    }
    
    return spaced;
  }

  // Helper methods

  private extractRoutePoints(route: RouteResult): Coordinate[] {
    const points: Coordinate[] = [];
    
    route.legs.forEach(leg => {
      points.push(leg.startLocation);
      
      // Sample points from leg steps
      const sampleInterval = Math.max(1, Math.floor(leg.steps.length / 3));
      leg.steps.forEach((step, index) => {
        if (index % sampleInterval === 0) {
          points.push(step.startLocation);
        }
      });
      
      points.push(leg.endLocation);
    });
    
    return points;
  }

  private sampleRoutePoints(points: Coordinate[], maxPoints: number): Coordinate[] {
    if (points.length <= maxPoints) return points;
    
    const interval = Math.floor(points.length / maxPoints);
    const sampled: Coordinate[] = [];
    
    for (let i = 0; i < points.length; i += interval) {
      sampled.push(points[i]);
    }
    
    return sampled.slice(0, maxPoints);
  }

  private calculateDistanceFromRoute(poiLocation: Coordinate, route: RouteResult): number {
    let minDistance = Infinity;
    
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        const distance = this.calculateHaversineDistance(poiLocation, step.startLocation);
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

  private findClosestRouteSegment(location: Coordinate, route: RouteResult): number {
    let minDistance = Infinity;
    let closestSegment = 0;
    
    route.legs.forEach((leg, index) => {
      const distance = this.calculateHaversineDistance(location, leg.startLocation);
      if (distance < minDistance) {
        minDistance = distance;
        closestSegment = index;
      }
    });
    
    return closestSegment;
  }

  private calculateEnhancedScore(poi: EnhancedPOI): number {
    let score = poi.recommendationScore;
    
    // Bonus for multiple sources
    if (poi.sources.length > 1) {
      score += 10;
    }
    
    // Cultural significance bonus
    if (poi.culturalSignificance) {
      score += poi.culturalSignificance.historicalImportance * 2;
      if (poi.culturalSignificance.hasWikipedia) score += 15;
    }
    
    // Local popularity bonus
    if (poi.localPopularity) {
      if (poi.localPopularity.verified) score += 10;
      if (poi.localPopularity.totalReviews > 50) score += 5;
    }
    
    return Math.min(100, score);
  }

  private categorizeOpenTripMapPOI(kinds: string): POICategory | null {
    const kindsList = kinds.toLowerCase().split(',');
    
    if (kindsList.some(k => ['historic', 'architecture', 'museums', 'cultural'].includes(k))) {
      return 'ATTRACTIONS';
    }
    if (kindsList.some(k => ['natural', 'leisure'].includes(k))) {
      return 'REST_AREAS';
    }
    
    return null;
  }

  private categorizeFoursquarePOI(categories: FoursquarePOI['categories']): POICategory | null {
    const categoryNames = categories.map(cat => cat.name.toLowerCase());
    
    if (categoryNames.some(name => name.includes('hotel') || name.includes('accommodation'))) {
      return 'ACCOMMODATION';
    }
    if (categoryNames.some(name => name.includes('gas') || name.includes('fuel'))) {
      return 'FUEL';
    }
    if (categoryNames.some(name => name.includes('food') || name.includes('restaurant') || name.includes('cafe'))) {
      return 'DINING';
    }
    if (categoryNames.some(name => name.includes('attraction') || name.includes('museum') || name.includes('entertainment'))) {
      return 'ATTRACTIONS';
    }
    if (categoryNames.some(name => name.includes('shop') || name.includes('retail'))) {
      return 'SHOPPING';
    }
    
    return null;
  }

  private calculateOpenTripMapScore(otmPOI: OpenTripMapPOI, distanceFromRoute: number): number {
    let score = 50;
    
    // Rate bonus (1-7 scale converted to points)
    score += otmPOI.rate * 5;
    
    // Distance penalty
    score -= (distanceFromRoute / 1000) * 5;
    
    // Wikipedia bonus
    if (otmPOI.wikipedia) score += 20;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateFoursquareScore(fsPOI: FoursquarePOI, distanceFromRoute: number): number {
    let score = 50;
    
    // Rating bonus
    if (fsPOI.rating) {
      score += (fsPOI.rating - 5) * 10; // Foursquare uses 0-10 scale
    }
    
    // Distance penalty
    score -= (distanceFromRoute / 1000) * 5;
    
    // Verification bonus
    if (fsPOI.verified) score += 15;
    
    // Popular place bonus
    if (fsPOI.stats && fsPOI.stats.total_ratings > 50) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private extractFoursquareAmenities(fsPOI: FoursquarePOI): string[] {
    const amenities: string[] = [];
    
    if (fsPOI.verified) amenities.push('Verified Business');
    if (fsPOI.rating && fsPOI.rating > 7) amenities.push('Highly Rated');
    if (fsPOI.price && fsPOI.price <= 2) amenities.push('Budget Friendly');
    if (fsPOI.hours?.open_now) amenities.push('Currently Open');
    
    return amenities;
  }

  private async getOpenTripMapDetails(xid: string): Promise<EnhancedPOI['detailedInfo']> {
    if (!this.openTripMapApiKey) return {};
    
    try {
      const response = await fetch(
        `https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${this.openTripMapApiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          description: data.wikipedia_extracts?.text,
          wikipediaExtract: data.wikipedia_extracts?.text,
          website: data.url,
        };
      }
    } catch (error) {
      console.warn('Failed to get OpenTripMap details:', error);
    }
    
    return {};
  }

  private deduplicateAndMergePOIs(pois: EnhancedPOI[]): EnhancedPOI[] {
    const deduped: EnhancedPOI[] = [];
    const seenLocations = new Map<string, EnhancedPOI>();
    
    for (const poi of pois) {
      // Create location key for deduplication (rounded to ~100m precision)
      const locationKey = `${Math.round(poi.location.lat * 1000)},${Math.round(poi.location.lng * 1000)}`;
      
      const existing = seenLocations.get(locationKey);
      if (existing) {
        // Merge POIs from different sources
        existing.sources = [...new Set([...existing.sources, ...poi.sources])];
        if (poi.culturalSignificance) existing.culturalSignificance = poi.culturalSignificance;
        if (poi.localPopularity) existing.localPopularity = poi.localPopularity;
        if (poi.detailedInfo) existing.detailedInfo = { ...existing.detailedInfo, ...poi.detailedInfo };
        existing.recommendationScore = Math.max(existing.recommendationScore, poi.recommendationScore);
      } else {
        seenLocations.set(locationKey, poi);
        deduped.push(poi);
      }
    }
    
    return deduped;
  }

  private analyzeEnhancedRouteSegments(pois: EnhancedPOI[], route: RouteResult): any[] {
    return route.legs.map((leg, index) => {
      const segmentPOIs = pois.filter(poi => poi.routeSegmentIndex === index);
      const criticalPOIs = segmentPOIs.filter(poi => poi.priority === 'critical');
      const culturalSites = segmentPOIs.filter(poi => poi.culturalSignificance?.hasWikipedia);
      const localFavorites = segmentPOIs.filter(poi => poi.localPopularity?.verified);
      
      const recommendations: string[] = [];
      if (criticalPOIs.length === 0) {
        recommendations.push('Consider adding fuel stops along this segment');
      }
      if (culturalSites.length > 0) {
        recommendations.push(`${culturalSites.length} cultural attractions available`);
      }
      if (localFavorites.length > 0) {
        recommendations.push(`${localFavorites.length} local favorites nearby`);
      }
      
      return {
        segmentIndex: index,
        poisCount: segmentPOIs.length,
        criticalPoisCount: criticalPOIs.length,
        culturalSitesCount: culturalSites.length,
        localFavoritesCount: localFavorites.length,
        recommendations,
      };
    });
  }

  private generateEnhancedSummary(pois: EnhancedPOI[], request: POISearchRequest): any {
    const byCategoryCount = {} as Record<POICategory, number>;
    const bySourceCount = { google: 0, opentripmap: 0, foursquare: 0 };
    
    // Initialize category counts
    Object.keys(POI_CATEGORIES).forEach(category => {
      byCategoryCount[category as POICategory] = 0;
    });
    
    // Count POIs
    pois.forEach(poi => {
      byCategoryCount[poi.category]++;
      poi.sources.forEach(source => {
        bySourceCount[source]++;
      });
    });
    
    const culturalHighlights = pois
      .filter(poi => poi.culturalSignificance?.hasWikipedia)
      .slice(0, 3)
      .map(poi => poi.name);
    
    const localRecommendations = pois
      .filter(poi => poi.localPopularity?.verified)
      .sort((a, b) => (b.localPopularity?.totalReviews || 0) - (a.localPopularity?.totalReviews || 0))
      .slice(0, 3)
      .map(poi => poi.name);
    
    return {
      totalPOIs: pois.length,
      byCategoryCount,
      bySourceCount,
      averageDetour: pois.length > 0 
        ? Math.round(pois.reduce((sum, poi) => sum + poi.estimatedDetour, 0) / pois.length)
        : 0,
      criticalGaps: this.findCriticalGaps(byCategoryCount),
      culturalHighlights,
      localRecommendations,
    };
  }

  private findCriticalGaps(categoryCount: Record<POICategory, number>): string[] {
    const gaps: string[] = [];
    
    if (categoryCount.FUEL === 0) gaps.push('No fuel stations found along route');
    if (categoryCount.EMERGENCY === 0) gaps.push('Limited emergency services along route');
    if (categoryCount.DINING === 0) gaps.push('No dining options found along route');
    
    return gaps;
  }

  private convertToEnhancedResult(baseResult: POISearchResult): EnhancedPOISearchResult {
    return {
      pois: baseResult.pois.map(poi => ({
        ...poi,
        sources: ['google'] as const,
      })),
      routeSegments: baseResult.routeSegments.map(segment => ({
        ...segment,
        culturalSitesCount: 0,
        localFavoritesCount: 0,
      })),
      summary: {
        ...baseResult.summary,
        bySourceCount: { google: baseResult.summary.totalPOIs, opentripmap: 0, foursquare: 0 },
        culturalHighlights: [],
        localRecommendations: [],
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default EnhancedPOIDetector;