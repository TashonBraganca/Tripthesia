"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

// Extend global google maps types
declare global {
  interface Window {
    google: typeof google;
  }
}
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Route, 
  Settings, 
  Layers,
  Zap,
  Car,
  MapIcon,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Share2
} from 'lucide-react';
import { GoogleMapsProvider, type Coordinate, type RouteRequest, type RouteResult } from '@/lib/services/google-maps-provider';
import { UnifiedMapProvider, type UnifiedMapInstance, type MapProvider } from '@/lib/services/unified-map-provider';
import { POIDetector, type POI, type POICategory, POI_CATEGORIES } from '@/lib/services/poi-detector';
import { Button } from '@/components/ui/button';

// Unified map configuration
const DEFAULT_MAP_CONFIG = {
  zoom: 10,
  center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
  style: {
    style: 'mapbox://styles/mapbox/streets-v12', // Mapbox style
    name: 'Streets'
  },
  interactive: true,
};

// Google Maps fallback configuration
const GOOGLE_MAPS_CONFIG = {
  mapTypeId: 'roadmap' as google.maps.MapTypeId,
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
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
};

interface Waypoint {
  id: string;
  location: Coordinate;
  address: string;
  type: 'origin' | 'destination' | 'waypoint';
  marker?: any; // Can be google.maps.Marker or mapboxgl.Marker
}

interface InteractiveMapPlannerProps {
  onRouteCalculated?: (route: RouteResult, pois: POI[]) => void;
  onWaypointsChanged?: (waypoints: Waypoint[]) => void;
  className?: string;
  height?: string;
  initialOrigin?: Coordinate;
  initialDestination?: Coordinate;
  showPOIs?: boolean;
  enableRouteOptimization?: boolean;
}

export default function InteractiveMapPlanner({
  onRouteCalculated,
  onWaypointsChanged,
  className = '',
  height = '600px',
  initialOrigin,
  initialDestination,
  showPOIs = true,
  enableRouteOptimization = true,
}: InteractiveMapPlannerProps) {
  // State management
  const [mapInstance, setMapInstance] = useState<UnifiedMapInstance | null>(null);
  const [activeProvider, setActiveProvider] = useState<MapProvider | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Waypoints and route state
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [currentRoute, setCurrentRoute] = useState<RouteResult | null>(null);
  const [pois, setPOIs] = useState<POI[]>([]);
  const [showPOICategories, setShowPOICategories] = useState<POICategory[]>(['FUEL', 'DINING', 'REST_AREAS']);
  
  // Map controls state
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT'>('DRIVING');
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [optimizeRoute, setOptimizeRoute] = useState(false);
  
  // Services
  const [unifiedProvider, setUnifiedProvider] = useState<UnifiedMapProvider | null>(null);
  const [mapsProvider, setMapsProvider] = useState<GoogleMapsProvider | null>(null);
  const [poiDetector, setPOIDetector] = useState<POIDetector | null>(null);
  
  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLInputElement>(null);

  // Initialize Unified Map Provider (Mapbox with Google Maps fallback)
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!mapboxApiKey && !googleApiKey) {
          throw new Error('No mapping provider API keys found');
        }
        
        if (!mapRef.current) {
          throw new Error('Map container not found');
        }

        // Initialize unified provider
        const provider = new UnifiedMapProvider(
          mapboxApiKey || '',
          googleApiKey || ''
        );

        // Initialize map with unified provider
        const instance = await provider.initialize(mapRef.current, DEFAULT_MAP_CONFIG);
        setMapInstance(instance);
        setActiveProvider(instance.provider);
        setUnifiedProvider(provider);

        // Set up Google Maps specific services if using Google Maps
        if (instance.provider === 'google' && googleApiKey) {
          const { Loader } = await import('@googlemaps/js-api-loader');
          const loader = new Loader({
            apiKey: googleApiKey,
            version: 'weekly',
            libraries: ['places', 'geometry'],
          });
          await loader.load();

          const directionsServiceInstance = new google.maps.DirectionsService();
          const directionsRendererInstance = new google.maps.DirectionsRenderer({
            draggable: true,
            panel: undefined,
          });
          
          directionsRendererInstance.setMap(instance.instance as google.maps.Map);
          
          setDirectionsService(directionsServiceInstance);
          setDirectionsRenderer(directionsRendererInstance);

          // Set up event listeners for Google Maps
          directionsRendererInstance.addListener('directions_changed', () => {
            handleDirectionsChanged(directionsRendererInstance);
          });

          (instance.instance as google.maps.Map).addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              handleMapClick({
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
              });
            }
          });

          // Set up search box for Google Maps
          if (searchBoxRef.current) {
            const searchBox = new google.maps.places.SearchBox(searchBoxRef.current);
            (instance.instance as google.maps.Map).addListener('bounds_changed', () => {
              searchBox.setBounds((instance.instance as google.maps.Map).getBounds() as google.maps.LatLngBounds);
            });

            searchBox.addListener('places_changed', () => {
              const places = searchBox.getPlaces();
              if (places && places.length > 0) {
                handlePlaceSelected(places[0]);
              }
            });
          }
        } else if (instance.provider === 'mapbox') {
          // Set up Mapbox specific event listeners
          (instance.instance as any).on('click', (e: any) => {
            handleMapClick({
              lat: e.lngLat.lat,
              lng: e.lngLat.lng,
            });
          });
        }

        // Initialize services for both providers
        if (googleApiKey) {
          const mapsProviderInstance = new GoogleMapsProvider(googleApiKey);
          const poiDetectorInstance = new POIDetector(mapsProviderInstance);
          setMapsProvider(mapsProviderInstance);
          setPOIDetector(poiDetectorInstance);
        }

        // Initialize with default waypoints if provided
        if (initialOrigin || initialDestination) {
          const initialWaypoints: Waypoint[] = [];
          
          if (initialOrigin) {
            initialWaypoints.push({
              id: 'origin',
              location: initialOrigin,
              address: `${initialOrigin.lat}, ${initialOrigin.lng}`,
              type: 'origin',
            });
          }
          
          if (initialDestination) {
            initialWaypoints.push({
              id: 'destination',
              location: initialDestination,
              address: `${initialDestination.lat}, ${initialDestination.lng}`,
              type: 'destination',
            });
          }
          
          setWaypoints(initialWaypoints);
        }
        
      } catch (err) {
        console.error('Failed to initialize map provider:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMap();
    
    // Cleanup function
    return () => {
      if (unifiedProvider) {
        unifiedProvider.cleanup();
      }
    };
  }, [initialOrigin, initialDestination]);

  // Handle directions change
  const handleDirectionsChanged = useCallback((renderer: google.maps.DirectionsRenderer) => {
    const directions = renderer.getDirections();
    if (directions) {
      // Convert Google Maps directions to our RouteResult format
      const route = convertDirectionsToRouteResult(directions);
      setCurrentRoute(route);
      
      // Find POIs if enabled
      if (showPOIs && poiDetector && showPOICategories.length > 0) {
        findPOIsForRoute(route);
      }
    }
  }, [showPOIs, poiDetector, showPOICategories]);

  // Handle map click for adding waypoints
  const handleMapClick = useCallback(async (location: Coordinate) => {
    if (!unifiedProvider && !mapsProvider) return;

    try {
      let address = `${location.lat}, ${location.lng}`;
      
      // Try to geocode the location to get a readable address
      if (mapsProvider) {
        try {
          const geocodeResults = await mapsProvider.geocode({ location });
          address = geocodeResults[0]?.formattedAddress || address;
        } catch (geocodeErr) {
          console.warn('Geocoding failed, using coordinates:', geocodeErr);
        }
      }
      
      // Determine waypoint type
      let type: 'origin' | 'destination' | 'waypoint' = 'waypoint';
      if (waypoints.length === 0) {
        type = 'origin';
      } else if (waypoints.length === 1) {
        type = 'destination';
      }

      const newWaypoint: Waypoint = {
        id: `waypoint-${Date.now()}`,
        location,
        address,
        type,
      };

      // Add marker to map
      if (unifiedProvider) {
        const markerColor = type === 'origin' ? '#10b981' : type === 'destination' ? '#ef4444' : '#14b8a6';
        const marker = await unifiedProvider.addMarker(location, {
          color: markerColor,
          draggable: true,
        });
        newWaypoint.marker = marker;
      }

      const updatedWaypoints = [...waypoints, newWaypoint];
      setWaypoints(updatedWaypoints);
      onWaypointsChanged?.(updatedWaypoints);

      // Calculate route if we have origin and destination
      if (updatedWaypoints.length >= 2) {
        calculateRoute(updatedWaypoints);
      }
    } catch (err) {
      console.error('Failed to add waypoint:', err);
    }
  }, [waypoints, unifiedProvider, mapsProvider, onWaypointsChanged]);

  // Handle place selection from search
  const handlePlaceSelected = useCallback((place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location) return;

    const location: Coordinate = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    const waypoint: Waypoint = {
      id: `place-${Date.now()}`,
      location,
      address: place.formatted_address || place.name || '',
      type: waypoints.length === 0 ? 'origin' : 'destination',
    };

    const updatedWaypoints = [...waypoints, waypoint];
    setWaypoints(updatedWaypoints);
    onWaypointsChanged?.(updatedWaypoints);

    if (mapInstance && activeProvider === 'google') {
      (mapInstance.instance as google.maps.Map).setCenter(location);
      (mapInstance.instance as google.maps.Map).setZoom(12);
    }
  }, [waypoints, mapInstance, activeProvider, onWaypointsChanged]);

  // Calculate route using unified provider
  const calculateRoute = useCallback(async (waypointsToUse: Waypoint[] = waypoints) => {
    if (waypointsToUse.length < 2) {
      return;
    }

    try {
      const origin = waypointsToUse.find(w => w.type === 'origin') || waypointsToUse[0];
      const destination = waypointsToUse.find(w => w.type === 'destination') || waypointsToUse[waypointsToUse.length - 1];
      const intermediateWaypoints = waypointsToUse.filter(w => w.type === 'waypoint');

      // Use unified provider for routing if available
      if (unifiedProvider) {
        const routeRequest: RouteRequest = {
          origin: origin.location,
          destination: destination.location,
          waypoints: intermediateWaypoints.map(w => ({ location: w.location, stopover: true })),
          travelMode: travelMode.toLowerCase() as any,
          avoidTolls,
          avoidHighways,
          optimizeWaypoints: optimizeRoute && enableRouteOptimization,
        };

        const route = await unifiedProvider.calculateRoute(routeRequest);
        setCurrentRoute(route);
        
        // Find POIs if enabled
        if (showPOIs && poiDetector && showPOICategories.length > 0) {
          findPOIsForRoute(route);
        }
        
        // Fit bounds to show entire route
        unifiedProvider.fitBounds(route.bounds);
        
        return;
      }

      // Fallback to Google Maps DirectionsService for legacy support
      if (directionsService && directionsRenderer && activeProvider === 'google') {
        const request: google.maps.DirectionsRequest = {
          origin: new google.maps.LatLng(origin.location.lat, origin.location.lng),
          destination: new google.maps.LatLng(destination.location.lat, destination.location.lng),
          waypoints: intermediateWaypoints.map(w => ({
            location: new google.maps.LatLng(w.location.lat, w.location.lng),
            stopover: true,
          })),
          travelMode: google.maps.TravelMode[travelMode],
          optimizeWaypoints: optimizeRoute && enableRouteOptimization,
          avoidTolls,
          avoidHighways,
          unitSystem: google.maps.UnitSystem.METRIC,
        };

        directionsService.route(request, (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result);
          } else {
            setError(`Failed to calculate route: ${status}`);
          }
        });
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      setError('Failed to calculate route');
    }
  }, [waypoints, unifiedProvider, directionsService, directionsRenderer, activeProvider, travelMode, optimizeRoute, enableRouteOptimization, avoidTolls, avoidHighways, showPOIs, poiDetector, showPOICategories]);

  // Find POIs along the route
  const findPOIsForRoute = useCallback(async (route: RouteResult) => {
    if (!poiDetector || showPOICategories.length === 0) return;

    try {
      const poiResult = await poiDetector.findPOIsAlongRoute({
        route,
        categories: showPOICategories,
        maxDetourMinutes: 15,
        maxDistanceFromRoute: 5000,
        prioritizeCritical: true,
      });

      setPOIs(poiResult.pois);
      onRouteCalculated?.(route, poiResult.pois);
    } catch (err) {
      console.error('Failed to find POIs:', err);
    }
  }, [poiDetector, showPOICategories, onRouteCalculated]);

  // Remove waypoint
  const removeWaypoint = useCallback((waypointId: string) => {
    const waypointToRemove = waypoints.find(w => w.id === waypointId);
    if (waypointToRemove?.marker && unifiedProvider) {
      unifiedProvider.removeMarker(waypointToRemove.marker);
    }
    
    const updatedWaypoints = waypoints.filter(w => w.id !== waypointId);
    setWaypoints(updatedWaypoints);
    onWaypointsChanged?.(updatedWaypoints);
    
    if (updatedWaypoints.length >= 2) {
      calculateRoute(updatedWaypoints);
    }
  }, [waypoints, unifiedProvider, onWaypointsChanged, calculateRoute]);

  // Clear all waypoints
  const clearWaypoints = useCallback(() => {
    // Remove all markers
    waypoints.forEach(waypoint => {
      if (waypoint.marker && unifiedProvider) {
        unifiedProvider.removeMarker(waypoint.marker);
      }
    });
    
    setWaypoints([]);
    setCurrentRoute(null);
    setPOIs([]);
    onWaypointsChanged?.([]);
    
    if (directionsRenderer && activeProvider === 'google') {
      directionsRenderer.setDirections({ routes: [] } as any);
    }
  }, [waypoints, unifiedProvider, directionsRenderer, activeProvider, onWaypointsChanged]);

  // Convert Google Maps DirectionsResult to our RouteResult format
  const convertDirectionsToRouteResult = (directions: google.maps.DirectionsResult): RouteResult => {
    const route = directions.routes[0];
    
    return {
      summary: route.summary || '',
      legs: route.legs.map(leg => ({
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        startLocation: {
          lat: leg.start_location.lat(),
          lng: leg.start_location.lng(),
        },
        endLocation: {
          lat: leg.end_location.lat(),
          lng: leg.end_location.lng(),
        },
        distance: {
          text: leg.distance?.text || '',
          value: leg.distance?.value || 0,
        },
        duration: {
          text: leg.duration?.text || '',
          value: leg.duration?.value || 0,
        },
        steps: leg.steps.map(step => ({
          instruction: step.instructions,
          distance: {
            text: step.distance?.text || '',
            value: step.distance?.value || 0,
          },
          duration: {
            text: step.duration?.text || '',
            value: step.duration?.value || 0,
          },
          startLocation: {
            lat: step.start_location.lat(),
            lng: step.start_location.lng(),
          },
          endLocation: {
            lat: step.end_location.lat(),
            lng: step.end_location.lng(),
          },
          travelMode: step.travel_mode,
        })),
      })),
      overviewPolyline: (route.overview_polyline as any)?.points || '',
      bounds: {
        northeast: {
          lat: route.bounds?.getNorthEast().lat() || 0,
          lng: route.bounds?.getNorthEast().lng() || 0,
        },
        southwest: {
          lat: route.bounds?.getSouthWest().lat() || 0,
          lng: route.bounds?.getSouthWest().lng() || 0,
        },
      },
      totalDistance: {
        text: route.legs.reduce((sum: number, leg: any) => sum + (leg.distance?.value || 0), 0) + ' m',
        value: route.legs.reduce((sum: number, leg: any) => sum + (leg.distance?.value || 0), 0),
      },
      totalDuration: {
        text: route.legs.reduce((sum: number, leg: any) => sum + (leg.duration?.value || 0), 0) + ' s',
        value: route.legs.reduce((sum: number, leg: any) => sum + (leg.duration?.value || 0), 0),
      },
      warnings: route.warnings || [],
    };
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-navy-900/50 backdrop-blur-sm rounded-xl border border-navy-700/50 ${className}`} style={{ height }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
          <p className="text-navy-300">Loading interactive map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-navy-900/50 backdrop-blur-sm rounded-xl border border-red-500/20 ${className}`} style={{ height }}>
        <div className="text-center space-y-2">
          <div className="text-red-400 text-xl">⚠️</div>
          <p className="text-red-400">Failed to load map</p>
          <p className="text-navy-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-navy-900/30 backdrop-blur-sm rounded-xl border border-navy-700/50 overflow-hidden ${className}`}>
      {/* Map Container */}
      <div ref={mapRef} style={{ height }} className="w-full" />
      
      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex flex-col space-y-2">
        {/* Search Box */}
        <div className="flex space-x-2">
          <input
            ref={searchBoxRef}
            type="text"
            placeholder="Search for places..."
            className="flex-1 px-4 py-2 bg-navy-800/90 backdrop-blur border border-navy-600 rounded-lg text-navy-100 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
          />
          <Button
            onClick={() => calculateRoute()}
            disabled={waypoints.length < 2}
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Route className="w-4 h-4" />
          </Button>
        </div>

        {/* Travel Mode and Options */}
        <div className="flex flex-wrap gap-2 bg-navy-800/90 backdrop-blur rounded-lg p-2 border border-navy-600">
          <select
            value={travelMode}
            onChange={(e) => setTravelMode(e.target.value as any)}
            className="bg-navy-700 border border-navy-600 rounded px-2 py-1 text-navy-100 text-sm"
          >
            <option value="DRIVING">🚗 Driving</option>
            <option value="WALKING">🚶 Walking</option>
            <option value="BICYCLING">🚴 Bicycling</option>
            <option value="TRANSIT">🚌 Transit</option>
          </select>

          <label className="flex items-center space-x-1 text-sm text-navy-200">
            <input
              type="checkbox"
              checked={avoidTolls}
              onChange={(e) => setAvoidTolls(e.target.checked)}
              className="rounded"
            />
            <span>Avoid Tolls</span>
          </label>

          <label className="flex items-center space-x-1 text-sm text-navy-200">
            <input
              type="checkbox"
              checked={optimizeRoute}
              onChange={(e) => setOptimizeRoute(e.target.checked)}
              className="rounded"
            />
            <span>Optimize</span>
          </label>

          <Button
            onClick={clearWaypoints}
            size="sm"
            variant="outline"
            className="text-navy-300 border-navy-600 hover:bg-navy-700"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Waypoints List */}
      {waypoints.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-navy-800/90 backdrop-blur rounded-lg border border-navy-600 p-3 max-w-sm">
          <h3 className="text-navy-200 font-medium mb-2 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Route Points
          </h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {waypoints.map((waypoint) => (
              <div key={waypoint.id} className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  waypoint.type === 'origin' ? 'bg-green-400' :
                  waypoint.type === 'destination' ? 'bg-red-400' : 'bg-teal-400'
                }`} />
                <span className="text-navy-300 truncate flex-1">{waypoint.address}</span>
                <button
                  onClick={() => removeWaypoint(waypoint.id)}
                  className="text-navy-500 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route Summary */}
      {currentRoute && (
        <div className="absolute bottom-4 right-4 bg-navy-800/90 backdrop-blur rounded-lg border border-navy-600 p-3 max-w-xs">
          <h3 className="text-navy-200 font-medium mb-2 flex items-center">
            <Navigation className="w-4 h-4 mr-2" />
            Route Summary
          </h3>
          <div className="space-y-1 text-sm text-navy-300">
            <div>Distance: {Math.round(currentRoute.totalDistance.value / 1000)} km</div>
            <div>Duration: {Math.round(currentRoute.totalDuration.value / 60)} min</div>
            {pois.length > 0 && (
              <div className="text-teal-400">POIs found: {pois.length}</div>
            )}
          </div>
        </div>
      )}

      {/* POI Controls */}
      {showPOIs && (
        <div className="absolute top-4 right-4 bg-navy-800/90 backdrop-blur rounded-lg border border-navy-600 p-2">
          <div className="flex flex-wrap gap-1">
            {(Object.keys(POI_CATEGORIES) as POICategory[]).slice(0, 6).map((category) => {
              const config = POI_CATEGORIES[category];
              const isActive = showPOICategories.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => {
                    const updated = isActive
                      ? showPOICategories.filter(c => c !== category)
                      : [...showPOICategories, category];
                    setShowPOICategories(updated);
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'bg-navy-700 text-navy-300 hover:bg-navy-600'
                  }`}
                  title={config.name}
                >
                  {config.icon}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}