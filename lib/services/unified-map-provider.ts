"use client";

import { Coordinate, RouteRequest, RouteResult, RouteWaypoint } from './google-maps-provider';

// Map provider types
export type MapProvider = 'mapbox' | 'google';

export interface MapProviderConfig {
  apiKey: string;
  provider: MapProvider;
}

export interface UnifiedMapInstance {
  provider: MapProvider;
  instance: any; // mapboxgl.Map | google.maps.Map
  containerElement: HTMLElement;
}

export interface MapStyle {
  style: string; // Mapbox style URL or Google Maps style array
  name: string;
}

export interface UnifiedMapConfig {
  center: Coordinate;
  zoom: number;
  style?: MapStyle;
  interactive?: boolean;
}

export abstract class BaseMapProvider {
  protected apiKey: string;
  public provider: MapProvider;

  constructor(config: MapProviderConfig) {
    this.apiKey = config.apiKey;
    this.provider = config.provider;
  }

  abstract initialize(container: HTMLElement, config: UnifiedMapConfig): Promise<UnifiedMapInstance>;
  abstract calculateRoute(request: RouteRequest): Promise<RouteResult>;
  abstract addMarker(coordinate: Coordinate, options?: any): Promise<any>;
  abstract removeMarker(marker: any): void;
  abstract fitBounds(bounds: { northeast: Coordinate; southwest: Coordinate }): void;
  abstract cleanup(): void;
  abstract isSupported(): Promise<boolean>;
}

// Mapbox implementation
export class MapboxProvider extends BaseMapProvider {
  private mapboxgl: any = null;
  private map: any = null;
  private markers: any[] = [];

  async isSupported(): Promise<boolean> {
    try {
      // Check if Mapbox is supported by the browser
      if (typeof window === 'undefined') return false;
      
      const mapboxgl = await import('mapbox-gl');
      return mapboxgl.default.supported();
    } catch (error) {
      console.warn('Mapbox not supported:', error);
      return false;
    }
  }

  async initialize(container: HTMLElement, config: UnifiedMapConfig): Promise<UnifiedMapInstance> {
    try {
      const mapboxgl = await import('mapbox-gl');
      this.mapboxgl = mapboxgl.default;
      
      // Set access token
      this.mapboxgl.accessToken = this.apiKey;

      // Create map
      this.map = new this.mapboxgl.Map({
        container,
        style: config.style?.style || 'mapbox://styles/mapbox/streets-v12',
        center: [config.center.lng, config.center.lat],
        zoom: config.zoom,
        interactive: config.interactive !== false,
      });

      // Wait for map to load
      await new Promise((resolve, reject) => {
        this.map.on('load', resolve);
        this.map.on('error', reject);
      });

      return {
        provider: 'mapbox',
        instance: this.map,
        containerElement: container,
      };
    } catch (error) {
      console.error('Failed to initialize Mapbox:', error);
      throw new Error(`Mapbox initialization failed: ${error}`);
    }
  }

  async calculateRoute(request: RouteRequest): Promise<RouteResult> {
    // Extract coordinates from origin and destination
    const originCoord = typeof request.origin === 'string' ? request.origin : request.origin;
    const destCoord = typeof request.destination === 'string' ? request.destination : request.destination;
    
    if (typeof originCoord === 'string' || typeof destCoord === 'string') {
      throw new Error('String coordinates not supported for Mapbox routing');
    }
    
    // Use Mapbox Directions API
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoord.lng},${originCoord.lat};${destCoord.lng},${destCoord.lat}`;
    
    const params = new URLSearchParams({
      access_token: this.apiKey,
      geometries: 'geojson',
      steps: 'true',
      overview: 'full',
    });

    if (request.waypoints && request.waypoints.length > 0) {
      const waypointsStr = request.waypoints
        .map(w => {
          const location = typeof w.location === 'string' ? w.location : w.location;
          if (typeof location === 'string') {
            throw new Error('String waypoint coordinates not supported for Mapbox routing');
          }
          return `${location.lng},${location.lat}`;
        })
        .join(';');
      // Reconstruct URL with waypoints
      const fullUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoord.lng},${originCoord.lat};${waypointsStr};${destCoord.lng},${destCoord.lat}?${params}`;
      
      const response = await fetch(fullUrl);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        return this.convertMapboxRouteToRouteResult(data.routes[0]);
      }
    } else {
      const response = await fetch(`${directionsUrl}?${params}`);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        return this.convertMapboxRouteToRouteResult(data.routes[0]);
      }
    }

    throw new Error('No routes found');
  }

  private convertMapboxRouteToRouteResult(mapboxRoute: any): RouteResult {
    return {
      summary: mapboxRoute.legs.map((leg: any) => `${leg.distance}m, ${Math.round(leg.duration/60)}min`).join(' → '),
      legs: mapboxRoute.legs.map((leg: any) => ({
        startAddress: `${leg.steps[0].maneuver.location[1]}, ${leg.steps[0].maneuver.location[0]}`,
        endAddress: `${leg.steps[leg.steps.length-1].maneuver.location[1]}, ${leg.steps[leg.steps.length-1].maneuver.location[0]}`,
        startLocation: {
          lat: leg.steps[0].maneuver.location[1],
          lng: leg.steps[0].maneuver.location[0],
        },
        endLocation: {
          lat: leg.steps[leg.steps.length-1].maneuver.location[1],
          lng: leg.steps[leg.steps.length-1].maneuver.location[0],
        },
        distance: {
          text: `${Math.round(leg.distance/1000)} km`,
          value: leg.distance,
        },
        duration: {
          text: `${Math.round(leg.duration/60)} min`,
          value: leg.duration,
        },
        steps: leg.steps.map((step: any) => ({
          instruction: step.maneuver.instruction || step.name || 'Continue',
          distance: {
            text: `${Math.round(step.distance)} m`,
            value: step.distance,
          },
          duration: {
            text: `${Math.round(step.duration)} s`,
            value: step.duration,
          },
          startLocation: {
            lat: step.maneuver.location[1],
            lng: step.maneuver.location[0],
          },
          endLocation: {
            lat: step.maneuver.location[1],
            lng: step.maneuver.location[0],
          },
          travelMode: 'DRIVING',
        })),
      })),
      overviewPolyline: this.encodePolyline(mapboxRoute.geometry.coordinates),
      bounds: {
        northeast: {
          lat: Math.max(...mapboxRoute.geometry.coordinates.map((c: number[]) => c[1])),
          lng: Math.max(...mapboxRoute.geometry.coordinates.map((c: number[]) => c[0])),
        },
        southwest: {
          lat: Math.min(...mapboxRoute.geometry.coordinates.map((c: number[]) => c[1])),
          lng: Math.min(...mapboxRoute.geometry.coordinates.map((c: number[]) => c[0])),
        },
      },
      totalDistance: {
        text: `${Math.round(mapboxRoute.distance/1000)} km`,
        value: mapboxRoute.distance,
      },
      totalDuration: {
        text: `${Math.round(mapboxRoute.duration/60)} min`,
        value: mapboxRoute.duration,
      },
      warnings: [],
    };
  }

  private encodePolyline(coordinates: number[][]): string {
    // Simple polyline encoding for coordinates
    return coordinates.map(coord => `${coord[1]},${coord[0]}`).join('|');
  }

  async addMarker(coordinate: Coordinate, options: any = {}): Promise<any> {
    if (!this.map || !this.mapboxgl) throw new Error('Map not initialized');

    const marker = new this.mapboxgl.Marker(options)
      .setLngLat([coordinate.lng, coordinate.lat])
      .addTo(this.map);

    this.markers.push(marker);
    return marker;
  }

  removeMarker(marker: any): void {
    if (marker && marker.remove) {
      marker.remove();
      this.markers = this.markers.filter(m => m !== marker);
    }
  }

  fitBounds(bounds: { northeast: Coordinate; southwest: Coordinate }): void {
    if (!this.map) return;
    
    this.map.fitBounds([
      [bounds.southwest.lng, bounds.southwest.lat],
      [bounds.northeast.lng, bounds.northeast.lat],
    ], {
      padding: 50,
    });
  }

  cleanup(): void {
    this.markers.forEach(marker => this.removeMarker(marker));
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

// Google Maps implementation (wraps existing GoogleMapsProvider)
export class GoogleMapsProvider extends BaseMapProvider {
  private googleProvider: any = null;
  private map: google.maps.Map | null = null;

  async isSupported(): Promise<boolean> {
    try {
      return typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    } catch (error) {
      console.warn('Google Maps not supported:', error);
      return false;
    }
  }

  async initialize(container: HTMLElement, config: UnifiedMapConfig): Promise<UnifiedMapInstance> {
    try {
      // Dynamic import of google maps provider
      const { GoogleMapsProvider: GMapsProvider } = await import('./google-maps-provider');
      this.googleProvider = new GMapsProvider(this.apiKey);

      // Load Google Maps
      const { Loader } = await import('@googlemaps/js-api-loader');
      const loader = new Loader({
        apiKey: this.apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry'],
      });

      await loader.load();

      // Create map with custom styling similar to Mapbox
      const mapConfig: google.maps.MapOptions = {
        center: config.center,
        zoom: config.zoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry.fill',
            stylers: [{ saturation: -40 }, { lightness: 25 }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ visibility: 'on' }, { color: '#1e293b' }]
          }
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: true,
        fullscreenControl: true,
      };

      this.map = new google.maps.Map(container, mapConfig);

      return {
        provider: 'google',
        instance: this.map,
        containerElement: container,
      };
    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
      throw new Error(`Google Maps initialization failed: ${error}`);
    }
  }

  async calculateRoute(request: RouteRequest): Promise<RouteResult> {
    if (!this.googleProvider) {
      throw new Error('Google Maps provider not initialized');
    }
    return this.googleProvider.calculateRoute(request);
  }

  async addMarker(coordinate: Coordinate, options: any = {}): Promise<google.maps.Marker> {
    if (!this.map) throw new Error('Map not initialized');

    const marker = new google.maps.Marker({
      position: coordinate,
      map: this.map,
      ...options,
    });

    return marker;
  }

  removeMarker(marker: google.maps.Marker): void {
    if (marker) {
      marker.setMap(null);
    }
  }

  fitBounds(bounds: { northeast: Coordinate; southwest: Coordinate }): void {
    if (!this.map) return;

    const googleBounds = new google.maps.LatLngBounds(
      bounds.southwest,
      bounds.northeast
    );
    this.map.fitBounds(googleBounds);
  }

  cleanup(): void {
    // Google Maps cleanup is handled by the map instance
    this.map = null;
    this.googleProvider = null;
  }
}

// Unified map provider with automatic fallback
export class UnifiedMapProvider {
  private primaryProvider: BaseMapProvider | null = null;
  private fallbackProvider: BaseMapProvider | null = null;
  private activeProvider: BaseMapProvider | null = null;

  constructor(
    private mapboxApiKey: string,
    private googleMapsApiKey: string
  ) {
    this.primaryProvider = new MapboxProvider({
      apiKey: mapboxApiKey,
      provider: 'mapbox',
    });
    
    this.fallbackProvider = new GoogleMapsProvider({
      apiKey: googleMapsApiKey,
      provider: 'google',
    });
  }

  async initialize(container: HTMLElement, config: UnifiedMapConfig): Promise<UnifiedMapInstance> {
    // Try Mapbox first
    if (this.primaryProvider && this.mapboxApiKey) {
      try {
        const isSupported = await this.primaryProvider.isSupported();
        if (isSupported) {
          const instance = await this.primaryProvider.initialize(container, config);
          this.activeProvider = this.primaryProvider;
          console.log('✅ Mapbox initialized successfully');
          return instance;
        }
      } catch (error) {
        console.warn('Mapbox initialization failed, falling back to Google Maps:', error);
      }
    }

    // Fallback to Google Maps
    if (this.fallbackProvider && this.googleMapsApiKey) {
      try {
        const isSupported = await this.fallbackProvider.isSupported();
        if (isSupported) {
          const instance = await this.fallbackProvider.initialize(container, config);
          this.activeProvider = this.fallbackProvider;
          console.log('✅ Google Maps initialized successfully (fallback)');
          return instance;
        }
      } catch (error) {
        console.error('Both Mapbox and Google Maps initialization failed:', error);
        throw new Error('Failed to initialize any mapping provider');
      }
    }

    throw new Error('No valid API keys provided for mapping providers');
  }

  async calculateRoute(request: RouteRequest): Promise<RouteResult> {
    if (!this.activeProvider) {
      throw new Error('No active map provider');
    }
    return this.activeProvider.calculateRoute(request);
  }

  async addMarker(coordinate: Coordinate, options?: any): Promise<any> {
    if (!this.activeProvider) {
      throw new Error('No active map provider');
    }
    return this.activeProvider.addMarker(coordinate, options);
  }

  removeMarker(marker: any): void {
    if (this.activeProvider) {
      this.activeProvider.removeMarker(marker);
    }
  }

  fitBounds(bounds: { northeast: Coordinate; southwest: Coordinate }): void {
    if (this.activeProvider) {
      this.activeProvider.fitBounds(bounds);
    }
  }

  getActiveProvider(): MapProvider | null {
    return this.activeProvider?.provider || null;
  }

  cleanup(): void {
    if (this.activeProvider) {
      this.activeProvider.cleanup();
      this.activeProvider = null;
    }
  }
}