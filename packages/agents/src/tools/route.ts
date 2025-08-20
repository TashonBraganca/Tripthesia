import { z } from "zod";

export const RouteToolParams = z.object({
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(2), // [lng, lat] pairs
  profile: z.enum(["driving", "walking", "cycling", "public_transport"]).default("driving"),
  geometry: z.boolean().default(true),
  instructions: z.boolean().default(true),
  avoid: z.array(z.enum(["tolls", "highways", "ferries"])).optional(),
});

export const RouteToolResult = z.object({
  distance: z.number(), // meters
  duration: z.number(), // seconds
  geometry: z.string().optional(), // GeoJSON LineString
  instructions: z.array(z.object({
    text: z.string(),
    distance: z.number(),
    duration: z.number(),
    type: z.string(),
  })).optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(), // [minLng, minLat, maxLng, maxLat]
});

export type RouteToolParams = z.infer<typeof RouteToolParams>;
export type RouteToolResult = z.infer<typeof RouteToolResult>;

export class RouteCache {
  private cache = new Map<string, { data: RouteToolResult; timestamp: number }>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  private getCacheKey(params: RouteToolParams): string {
    return `${params.coordinates.map(c => c.join(",")).join("|")}-${params.profile}`;
  }

  getCached(params: RouteToolParams): RouteToolResult | null {
    const key = this.getCacheKey(params);
    const cached = this.cache.get(key);
    
    if (!cached || Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  setCached(params: RouteToolParams, result: RouteToolResult): void {
    const key = this.getCacheKey(params);
    this.cache.set(key, { data: result, timestamp: Date.now() });
  }
}

const routeCache = new RouteCache();

export async function calculateRoute(params: RouteToolParams): Promise<RouteToolResult> {
  // Check cache first
  const cached = routeCache.getCached(params);
  if (cached) {
    return cached;
  }

  try {
    const result = await getOpenRouteServiceRoute(params);
    routeCache.setCached(params, result);
    return result;
  } catch (error) {
    console.warn("OpenRouteService failed, using fallback:", error);
    return getStraightLineRoute(params);
  }
}

async function getOpenRouteServiceRoute(params: RouteToolParams): Promise<RouteToolResult> {
  const apiKey = process.env.OPENROUTE_SERVICE_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTE_SERVICE_API_KEY not configured");
  }

  const profileMap = {
    driving: "driving-car",
    walking: "foot-walking", 
    cycling: "cycling-regular",
    public_transport: "driving-car", // Fallback to driving for now
  };

  const url = `https://api.openrouteservice.org/v2/directions/${profileMap[params.profile]}`;
  
  const body = {
    coordinates: params.coordinates,
    format: "json",
    geometry: params.geometry,
    instructions: params.instructions,
    options: params.avoid ? { avoid_features: params.avoid } : undefined,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenRouteService API error: ${response.status}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];
  
  if (!route) {
    throw new Error("No route found");
  }

  return {
    distance: route.summary.distance,
    duration: route.summary.duration,
    geometry: route.geometry,
    instructions: route.segments?.[0]?.steps?.map((step: any) => ({
      text: step.instruction,
      distance: step.distance,
      duration: step.duration,
      type: step.type,
    })),
    bbox: data.bbox,
  };
}

function getStraightLineRoute(params: RouteToolParams): RouteToolResult {
  // Calculate straight-line distance as fallback
  const start = params.coordinates[0];
  const end = params.coordinates[params.coordinates.length - 1];
  
  const distance = haversineDistance(start[1], start[0], end[1], end[0]);
  
  // Estimate duration based on mode
  const speedKmh = {
    driving: 50,
    walking: 5,
    cycling: 15,
    public_transport: 30,
  }[params.profile];
  
  const duration = (distance / 1000) / speedKmh * 3600; // Convert to seconds

  return {
    distance: Math.round(distance),
    duration: Math.round(duration),
    geometry: undefined,
    instructions: [{
      text: `Head ${getDirection(start, end)} toward destination`,
      distance: Math.round(distance),
      duration: Math.round(duration),
      type: "straight",
    }],
  };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function getDirection(start: [number, number], end: [number, number]): string {
  const dLng = end[0] - start[0];
  const dLat = end[1] - start[1];
  
  const angle = Math.atan2(dLng, dLat) * 180 / Math.PI;
  
  if (angle >= -22.5 && angle < 22.5) return "north";
  if (angle >= 22.5 && angle < 67.5) return "northeast";
  if (angle >= 67.5 && angle < 112.5) return "east";
  if (angle >= 112.5 && angle < 157.5) return "southeast";
  if (angle >= 157.5 || angle < -157.5) return "south";
  if (angle >= -157.5 && angle < -112.5) return "southwest";
  if (angle >= -112.5 && angle < -67.5) return "west";
  return "northwest";
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

// Alias for backward compatibility
export const getRouteInfo = calculateRoute;