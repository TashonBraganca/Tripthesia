import { z } from "zod";
import { PlaceRef } from "../validation";

export const PlacesToolParams = z.object({
  query: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().min(100).max(100000).default(10000),
  categories: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).default(20),
});

export const PlacesToolResult = z.object({
  places: z.array(PlaceRef),
  total: z.number(),
  source: z.enum(["foursquare", "opentripmap", "hybrid"]),
});

export type PlacesToolParams = z.infer<typeof PlacesToolParams>;
export type PlacesToolResult = z.infer<typeof PlacesToolResult>;

interface FoursquarePlace {
  fsq_id: string;
  name: string;
  categories: Array<{
    id: string;
    name: string;
    primary?: boolean;
  }>;
  geocodes: {
    main: {
      latitude: number;
      longitude: number;
    };
  };
  hours?: {
    open: Array<{
      day: number;
      open: string;
      close: string;
    }>;
  };
}

interface OpenTripMapPlace {
  xid: string;
  name: string;
  kinds: string;
  point: {
    lat: number;
    lon: number;
  };
}

// Foursquare category mapping to our simplified categories
const CATEGORY_MAPPING: Record<string, string> = {
  "13065": "food", // Restaurant
  "13003": "bar", // Bar
  "16000": "sight", // Landmark
  "12000": "nature", // Outdoors
  "19014": "lodging", // Hotel
  "10000": "business", // Professional Services
};

export class PlacesCache {
  private cache = new Map<string, { data: PlacesToolResult; timestamp: number }>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  get(key: string): PlacesToolResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(key: string, data: PlacesToolResult): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCacheKey(params: PlacesToolParams): string {
    return `${params.query}-${params.lat}-${params.lng}-${params.radius}-${params.categories?.join(",") || ""}-${params.limit}`;
  }

  getCached(params: PlacesToolParams): PlacesToolResult | null {
    return this.get(this.getCacheKey(params));
  }

  setCached(params: PlacesToolParams, result: PlacesToolResult): void {
    this.set(this.getCacheKey(params), result);
  }
}

const placesCache = new PlacesCache();

export async function searchPlaces(params: PlacesToolParams): Promise<PlacesToolResult> {
  // Check cache first
  const cached = placesCache.getCached(params);
  if (cached) {
    return cached;
  }

  // Try Foursquare first if API key is available
  if (process.env.FOURSQUARE_API_KEY) {
    try {
      const foursquareResult = await searchFoursquare(params);
      if (foursquareResult.places.length > 0) {
        placesCache.setCached(params, foursquareResult);
        return foursquareResult;
      }
    } catch (error) {
      console.warn("Foursquare search failed:", error);
    }
  }

  // Try OpenTripMap if available
  try {
    const otmResult = await searchOpenTripMap(params);
    placesCache.setCached(params, otmResult);
    return otmResult;
  } catch (error) {
    console.warn("OpenTripMap search failed:", error);
  }

  // Fallback to mock data if no APIs available
  console.warn("No place search APIs available, using mock data");
  const mockResult = createMockPlaces(params);
  placesCache.setCached(params, mockResult);
  return mockResult;
}

async function searchFoursquare(params: PlacesToolParams): Promise<PlacesToolResult> {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    throw new Error("FOURSQUARE_API_KEY not configured");
  }

  const url = new URL("https://api.foursquare.com/v3/places/search");
  url.searchParams.set("query", params.query);
  url.searchParams.set("ll", `${params.lat},${params.lng}`);
  url.searchParams.set("radius", params.radius.toString());
  url.searchParams.set("limit", Math.min(params.limit, 50).toString());
  
  if (params.categories?.length) {
    url.searchParams.set("categories", params.categories.join(","));
  }

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": apiKey,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Foursquare API error: ${response.status}`);
  }

  const data = await response.json();
  const places = data.results?.map((place: FoursquarePlace): PlaceRef => ({
    id: place.fsq_id,
    name: place.name,
    category: mapFoursquareCategory(place.categories),
    lat: place.geocodes.main.latitude,
    lng: place.geocodes.main.longitude,
    source: "fsq" as const,
    hours: place.hours ? {
      open: place.hours.open.map(h => [
        timeToMinutes(h.open),
        timeToMinutes(h.close),
      ] as [number, number])
    } : undefined,
  })) || [];

  return {
    places,
    total: places.length,
    source: "foursquare",
  };
}

async function searchOpenTripMap(params: PlacesToolParams): Promise<PlacesToolResult> {
  // OpenTripMap has a free tier that doesn't require API key for basic usage
  // For production, you should get an API key from opentripmap.io

  // Calculate bounding box
  const latDelta = params.radius / 111000; // Rough conversion to degrees
  const lngDelta = params.radius / (111000 * Math.cos(params.lat * Math.PI / 180));

  const url = new URL("https://api.opentripmap.com/0.1/en/places/bbox");
  url.searchParams.set("lon_min", (params.lng - lngDelta).toString());
  url.searchParams.set("lat_min", (params.lat - latDelta).toString());
  url.searchParams.set("lon_max", (params.lng + lngDelta).toString());
  url.searchParams.set("lat_max", (params.lat + latDelta).toString());
  url.searchParams.set("kinds", mapCategoriesToOTMKinds(params.categories));
  url.searchParams.set("limit", params.limit.toString());
  // Note: Add your OpenTripMap API key here for production use
  // url.searchParams.set("apikey", process.env.OPENTRIPMAP_API_KEY || "");

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`OpenTripMap API error: ${response.status}`);
  }

  const data = await response.json();
  const places = data.features?.map((place: OpenTripMapPlace): PlaceRef => ({
    id: place.xid,
    name: place.name || "Unnamed Place",
    category: mapOTMKindsToCategory(place.kinds),
    lat: place.point.lat,
    lng: place.point.lon,
    source: "otm" as const,
  })).filter((place: PlaceRef) => 
    place.name.toLowerCase().includes(params.query.toLowerCase())
  ) || [];

  return {
    places,
    total: places.length,
    source: "opentripmap",
  };
}

function mapFoursquareCategory(categories: FoursquarePlace["categories"]): string {
  const primaryCategory = categories.find(c => c.primary) || categories[0];
  return CATEGORY_MAPPING[primaryCategory?.id] || "sight";
}

function mapCategoriesToOTMKinds(categories?: string[]): string {
  if (!categories?.length) {
    return "interesting_places";
  }
  
  const kindMap: Record<string, string> = {
    food: "foods",
    bar: "foods", 
    sight: "historic,architecture,museums",
    nature: "natural",
    business: "other",
    lodging: "accomodations",
  };
  
  return categories.map(cat => kindMap[cat] || "interesting_places").join(",");
}

function mapOTMKindsToCategory(kinds: string): string {
  if (kinds.includes("foods")) return "food";
  if (kinds.includes("historic") || kinds.includes("architecture") || kinds.includes("museums")) return "sight";
  if (kinds.includes("natural")) return "nature";
  if (kinds.includes("accomodations")) return "lodging";
  return "sight";
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Mock places function for when APIs are unavailable
function createMockPlaces(params: PlacesToolParams): PlacesToolResult {
  const mockPlaces = [
    {
      id: "mock-1",
      name: `Popular attraction near ${params.query}`,
      category: "sight",
      lat: params.lat + (Math.random() - 0.5) * 0.01,
      lng: params.lng + (Math.random() - 0.5) * 0.01,
      rating: 4.2,
      priceLevel: 2,
      verified: false,
    },
    {
      id: "mock-2", 
      name: `Restaurant in ${params.query}`,
      category: "food",
      lat: params.lat + (Math.random() - 0.5) * 0.01,
      lng: params.lng + (Math.random() - 0.5) * 0.01,
      rating: 4.0,
      priceLevel: 2,
      verified: false,
    },
    {
      id: "mock-3",
      name: `Activity near ${params.query}`,
      category: "activity", 
      lat: params.lat + (Math.random() - 0.5) * 0.01,
      lng: params.lng + (Math.random() - 0.5) * 0.01,
      rating: 4.1,
      priceLevel: 1,
      verified: false,
    },
  ];

  const limitedPlaces = mockPlaces.slice(0, Math.min(params.limit, 3));
  
  return {
    places: limitedPlaces,
    total: limitedPlaces.length,
    source: "hybrid" as const,
  };
}

// Legacy export for backward compatibility
export const placesSearchSchema = PlacesToolParams;
export { searchPlaces as searchPlaces };