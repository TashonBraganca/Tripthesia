/**
 * Google Maps Platform Provider - Comprehensive Integration
 * Supports Routes API, Places API, Geocoding API, and Maps JavaScript API
 */

import { createAPIManager, APIError } from './api-manager';
import { z } from 'zod';

// Core interfaces for Google Maps integration
export interface Coordinate {
  lat: number;
  lng: number;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: Coordinate;
  types: string[];
  rating?: number;
  priceLevel?: number;
  photoUrl?: string;
  businessStatus?: string;
  openingHours?: {
    isOpen?: boolean;
    weekdayText?: string[];
  };
}

export interface RouteWaypoint {
  location: Coordinate | string;
  stopover?: boolean;
  placeId?: string;
}

export interface RouteRequest {
  origin: Coordinate | string;
  destination: Coordinate | string;
  waypoints?: RouteWaypoint[];
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  optimizeWaypoints?: boolean;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  departureTime?: Date;
  units?: 'metric' | 'imperial';
}

export interface RouteStep {
  instruction: string;
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  startLocation: Coordinate;
  endLocation: Coordinate;
  travelMode: string;
}

export interface RouteLeg {
  startAddress: string;
  endAddress: string;
  startLocation: Coordinate;
  endLocation: Coordinate;
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  steps: RouteStep[];
}

export interface RouteResult {
  summary: string;
  legs: RouteLeg[];
  overviewPolyline: string;
  bounds: {
    northeast: Coordinate;
    southwest: Coordinate;
  };
  totalDistance: {
    text: string;
    value: number; // meters
  };
  totalDuration: {
    text: string;
    value: number; // seconds
  };
  warnings: string[];
  waypoints?: {
    geocoderStatus: string;
    partialMatch: boolean;
    placeId: string;
    types: string[];
  }[];
}

export interface PlaceSearchRequest {
  query?: string;
  location?: Coordinate;
  radius?: number; // meters
  type?: string;
  language?: string;
  region?: string;
  fields?: string[];
}

export interface GeocodingRequest {
  address?: string;
  location?: Coordinate;
  placeId?: string;
  language?: string;
  region?: string;
  components?: Record<string, string>;
}

export interface GeocodingResult {
  formattedAddress: string;
  geometry: {
    location: Coordinate;
    locationType: string;
    viewport: {
      northeast: Coordinate;
      southwest: Coordinate;
    };
  };
  placeId: string;
  types: string[];
  addressComponents: {
    longName: string;
    shortName: string;
    types: string[];
  }[];
}

// Validation schemas
const CoordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const RouteRequestSchema = z.object({
  origin: z.union([CoordinateSchema, z.string()]),
  destination: z.union([CoordinateSchema, z.string()]),
  waypoints: z.array(z.object({
    location: z.union([CoordinateSchema, z.string()]),
    stopover: z.boolean().optional(),
    placeId: z.string().optional(),
  })).optional(),
  travelMode: z.enum(['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT']),
  optimizeWaypoints: z.boolean().optional(),
  avoidTolls: z.boolean().optional(),
  avoidHighways: z.boolean().optional(),
  avoidFerries: z.boolean().optional(),
  departureTime: z.date().optional(),
  units: z.enum(['metric', 'imperial']).optional(),
});

export class GoogleMapsProvider {
  private apiManager: any;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiManager = createAPIManager('custom', apiKey, {
      baseUrl: 'https://maps.googleapis.com/maps/api',
      timeout: 10000,
      retryAttempts: 3,
      rateLimitMax: 500, // Conservative limit within free tier
    });
  }

  /**
   * Routes API Integration - Calculate optimal routes
   */
  async calculateRoute(request: RouteRequest): Promise<RouteResult[]> {
    try {
      // Validate request
      const validatedRequest = RouteRequestSchema.parse(request);

      // Build API parameters
      const params = new URLSearchParams({
        origin: typeof validatedRequest.origin === 'string' 
          ? validatedRequest.origin 
          : `${validatedRequest.origin.lat},${validatedRequest.origin.lng}`,
        destination: typeof validatedRequest.destination === 'string'
          ? validatedRequest.destination
          : `${validatedRequest.destination.lat},${validatedRequest.destination.lng}`,
        mode: validatedRequest.travelMode.toLowerCase(),
        key: this.apiKey,
        units: validatedRequest.units || 'metric',
      });

      // Add waypoints if provided
      if (validatedRequest.waypoints && validatedRequest.waypoints.length > 0) {
        const waypointsString = validatedRequest.waypoints
          .map(wp => {
            const location = typeof wp.location === 'string' 
              ? wp.location 
              : `${wp.location.lat},${wp.location.lng}`;
            return wp.stopover === false ? `via:${location}` : location;
          })
          .join('|');
        
        params.append('waypoints', 
          validatedRequest.optimizeWaypoints ? `optimize:true|${waypointsString}` : waypointsString
        );
      }

      // Add avoidance parameters
      const avoid = [];
      if (validatedRequest.avoidTolls) avoid.push('tolls');
      if (validatedRequest.avoidHighways) avoid.push('highways');
      if (validatedRequest.avoidFerries) avoid.push('ferries');
      if (avoid.length > 0) {
        params.append('avoid', avoid.join('|'));
      }

      // Add departure time for transit
      if (validatedRequest.departureTime && validatedRequest.travelMode === 'TRANSIT') {
        params.append('departure_time', Math.floor(validatedRequest.departureTime.getTime() / 1000).toString());
      }

      const cacheKey = `route:${params.toString()}`;
      const response = await this.apiManager.request(
        `/directions/json?${params.toString()}`,
        { method: 'GET' },
        cacheKey
      );

      if (response.status !== 'OK') {
        throw new APIError(
          `Google Maps Directions API error: ${response.status}`,
          400,
          'google_maps',
          false,
          response.error_message
        );
      }

      return this.processRouteResults(response.routes || []);

    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new APIError(
          `Invalid route request: ${error.errors.map(e => e.message).join(', ')}`,
          400,
          'google_maps',
          false,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Places API Integration - Search for places
   */
  async searchPlaces(request: PlaceSearchRequest): Promise<PlaceResult[]> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        language: request.language || 'en',
      });

      // Text search or nearby search
      if (request.query) {
        params.append('query', request.query);
        if (request.location) {
          params.append('location', `${request.location.lat},${request.location.lng}`);
          params.append('radius', (request.radius || 5000).toString());
        }
      }

      if (request.type) {
        params.append('type', request.type);
      }

      if (request.fields) {
        params.append('fields', request.fields.join(','));
      } else {
        // Default fields for comprehensive data
        params.append('fields', 'place_id,name,formatted_address,geometry,types,rating,price_level,photos,business_status,opening_hours');
      }

      const endpoint = request.query ? '/place/textsearch/json' : '/place/nearbysearch/json';
      const cacheKey = `places:${params.toString()}`;
      
      const response = await this.apiManager.request(
        `${endpoint}?${params.toString()}`,
        { method: 'GET' },
        cacheKey
      );

      if (response.status !== 'OK') {
        throw new APIError(
          `Google Places API error: ${response.status}`,
          400,
          'google_maps',
          false,
          response.error_message
        );
      }

      return this.processPlaceResults(response.results || []);

    } catch (error) {
      throw this.enhanceError(error, 'Places API');
    }
  }

  /**
   * Places API - Get place details
   */
  async getPlaceDetails(placeId: string, fields?: string[]): Promise<PlaceResult> {
    try {
      const params = new URLSearchParams({
        place_id: placeId,
        key: this.apiKey,
        fields: fields?.join(',') || 'place_id,name,formatted_address,geometry,types,rating,price_level,photos,business_status,opening_hours,reviews',
      });

      const cacheKey = `place_details:${placeId}:${fields?.join(',')}`;
      const response = await this.apiManager.request(
        `/place/details/json?${params.toString()}`,
        { method: 'GET' },
        cacheKey
      );

      if (response.status !== 'OK') {
        throw new APIError(
          `Google Place Details API error: ${response.status}`,
          400,
          'google_maps',
          false,
          response.error_message
        );
      }

      return this.processPlaceResult(response.result);

    } catch (error) {
      throw this.enhanceError(error, 'Place Details API');
    }
  }

  /**
   * Geocoding API Integration
   */
  async geocode(request: GeocodingRequest): Promise<GeocodingResult[]> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        language: request.language || 'en',
      });

      if (request.address) {
        params.append('address', request.address);
      } else if (request.location) {
        params.append('latlng', `${request.location.lat},${request.location.lng}`);
      } else if (request.placeId) {
        params.append('place_id', request.placeId);
      } else {
        throw new APIError('Geocoding request must include address, location, or placeId', 400, 'google_maps', false);
      }

      if (request.region) {
        params.append('region', request.region);
      }

      if (request.components) {
        const componentsString = Object.entries(request.components)
          .map(([key, value]) => `${key}:${value}`)
          .join('|');
        params.append('components', componentsString);
      }

      const cacheKey = `geocode:${params.toString()}`;
      const response = await this.apiManager.request(
        `/geocode/json?${params.toString()}`,
        { method: 'GET' },
        cacheKey
      );

      if (response.status !== 'OK') {
        throw new APIError(
          `Google Geocoding API error: ${response.status}`,
          400,
          'google_maps',
          false,
          response.error_message
        );
      }

      return response.results || [];

    } catch (error) {
      throw this.enhanceError(error, 'Geocoding API');
    }
  }

  /**
   * Utility method to get distance matrix between multiple origins and destinations
   */
  async getDistanceMatrix(
    origins: (Coordinate | string)[],
    destinations: (Coordinate | string)[],
    options: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
      units?: 'metric' | 'imperial';
      avoidTolls?: boolean;
      avoidHighways?: boolean;
      departureTime?: Date;
    } = {}
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        origins: origins.map(origin => 
          typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`
        ).join('|'),
        destinations: destinations.map(dest => 
          typeof dest === 'string' ? dest : `${dest.lat},${dest.lng}`
        ).join('|'),
        mode: options.mode || 'driving',
        units: options.units || 'metric',
      });

      const avoid = [];
      if (options.avoidTolls) avoid.push('tolls');
      if (options.avoidHighways) avoid.push('highways');
      if (avoid.length > 0) {
        params.append('avoid', avoid.join('|'));
      }

      if (options.departureTime) {
        params.append('departure_time', Math.floor(options.departureTime.getTime() / 1000).toString());
      }

      const cacheKey = `distance_matrix:${params.toString()}`;
      const response = await this.apiManager.request(
        `/distancematrix/json?${params.toString()}`,
        { method: 'GET' },
        cacheKey
      );

      if (response.status !== 'OK') {
        throw new APIError(
          `Google Distance Matrix API error: ${response.status}`,
          400,
          'google_maps',
          false,
          response.error_message
        );
      }

      return response;

    } catch (error) {
      throw this.enhanceError(error, 'Distance Matrix API');
    }
  }

  // Private helper methods
  private processRouteResults(routes: any[]): RouteResult[] {
    return routes.map(route => ({
      summary: route.summary || '',
      legs: route.legs?.map((leg: any) => ({
        startAddress: leg.start_address || '',
        endAddress: leg.end_address || '',
        startLocation: {
          lat: leg.start_location?.lat || 0,
          lng: leg.start_location?.lng || 0,
        },
        endLocation: {
          lat: leg.end_location?.lat || 0,
          lng: leg.end_location?.lng || 0,
        },
        distance: {
          text: leg.distance?.text || '0 km',
          value: leg.distance?.value || 0,
        },
        duration: {
          text: leg.duration?.text || '0 mins',
          value: leg.duration?.value || 0,
        },
        steps: leg.steps?.map((step: any) => ({
          instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || '',
          distance: {
            text: step.distance?.text || '0 m',
            value: step.distance?.value || 0,
          },
          duration: {
            text: step.duration?.text || '0 mins',
            value: step.duration?.value || 0,
          },
          startLocation: {
            lat: step.start_location?.lat || 0,
            lng: step.start_location?.lng || 0,
          },
          endLocation: {
            lat: step.end_location?.lat || 0,
            lng: step.end_location?.lng || 0,
          },
          travelMode: step.travel_mode || 'DRIVING',
        })) || [],
      })) || [],
      overviewPolyline: route.overview_polyline?.points || '',
      bounds: {
        northeast: {
          lat: route.bounds?.northeast?.lat || 0,
          lng: route.bounds?.northeast?.lng || 0,
        },
        southwest: {
          lat: route.bounds?.southwest?.lat || 0,
          lng: route.bounds?.southwest?.lng || 0,
        },
      },
      totalDistance: {
        text: route.legs?.reduce((sum: number, leg: any) => sum + (leg.distance?.value || 0), 0) + ' m',
        value: route.legs?.reduce((sum: number, leg: any) => sum + (leg.distance?.value || 0), 0) || 0,
      },
      totalDuration: {
        text: route.legs?.reduce((sum: number, leg: any) => sum + (leg.duration?.value || 0), 0) + ' s',
        value: route.legs?.reduce((sum: number, leg: any) => sum + (leg.duration?.value || 0), 0) || 0,
      },
      warnings: route.warnings || [],
      waypoints: route.waypoint_order ? route.waypoint_order.map((index: number) => ({
        geocoderStatus: 'OK',
        partialMatch: false,
        placeId: '',
        types: [],
      })) : [],
    }));
  }

  private processPlaceResults(places: any[]): PlaceResult[] {
    return places.map(place => this.processPlaceResult(place));
  }

  private processPlaceResult(place: any): PlaceResult {
    return {
      placeId: place.place_id || '',
      name: place.name || '',
      formattedAddress: place.formatted_address || place.vicinity || '',
      location: {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0,
      },
      types: place.types || [],
      rating: place.rating,
      priceLevel: place.price_level,
      photoUrl: place.photos?.[0] ? 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${this.apiKey}` : 
        undefined,
      businessStatus: place.business_status,
      openingHours: place.opening_hours ? {
        isOpen: place.opening_hours.open_now,
        weekdayText: place.opening_hours.weekday_text,
      } : undefined,
    };
  }

  private enhanceError(error: any, context: string): APIError {
    if (error instanceof APIError) {
      return error;
    }

    return new APIError(
      `${context} error: ${error.message}`,
      error.statusCode || 500,
      'google_maps',
      false,
      error
    );
  }

  /**
   * Health check for Google Maps APIs
   */
  async healthCheck(): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Simple geocoding request to test API connectivity
      await this.geocode({ address: 'New York, NY, USA' });
      
      return {
        healthy: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default GoogleMapsProvider;