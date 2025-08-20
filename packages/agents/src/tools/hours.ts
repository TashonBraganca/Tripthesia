import { z } from "zod";

export const HoursToolParams = z.object({
  placeId: z.string(),
  source: z.enum(["fsq", "otm", "google"]),
  date: z.string().datetime().optional(), // Check for specific date
  timezone: z.string().default("UTC"),
});

export const OpeningHours = z.object({
  day: z.number().min(0).max(6), // 0=Sunday, 6=Saturday
  open: z.number().min(0).max(1439), // minutes from midnight
  close: z.number().min(0).max(1439),
  type: z.enum(["regular", "holiday", "special"]).default("regular"),
});

export const HoursToolResult = z.object({
  placeId: z.string(),
  isOpen: z.boolean().nullable(),
  hours: z.array(OpeningHours),
  exceptions: z.array(z.object({
    date: z.string(),
    hours: z.array(OpeningHours).optional(),
    closed: z.boolean(),
    reason: z.string().optional(),
  })).default([]),
  timezone: z.string(),
  lastUpdated: z.string().datetime(),
  source: z.enum(["foursquare", "google", "manual", "unknown"]),
});

export type HoursToolParams = z.infer<typeof HoursToolParams>;
export type HoursToolResult = z.infer<typeof HoursToolResult>;
export type OpeningHours = z.infer<typeof OpeningHours>;

interface FoursquareHours {
  display: string;
  open: Array<{
    day: number;
    open: string;
    close: string;
  }>;
  closed: boolean;
}

export class HoursCache {
  private cache = new Map<string, { data: HoursToolResult; timestamp: number }>();
  private readonly TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  get(placeId: string): HoursToolResult | null {
    const cached = this.cache.get(placeId);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(placeId);
      return null;
    }
    
    return cached.data;
  }

  set(placeId: string, data: HoursToolResult): void {
    this.cache.set(placeId, { data, timestamp: Date.now() });
  }
}

const hoursCache = new HoursCache();

export async function getPlaceHours(params: HoursToolParams): Promise<HoursToolResult> {
  // Check cache first
  const cached = hoursCache.get(params.placeId);
  if (cached) {
    return cached;
  }

  let result: HoursToolResult;

  try {
    switch (params.source) {
      case "fsq":
        result = await getFoursquareHours(params);
        break;
      case "google":
        result = await getGoogleHours(params);
        break;
      default:
        result = getDefaultHours(params);
    }
  } catch (error) {
    console.warn(`Failed to get hours for ${params.placeId}:`, error);
    result = getDefaultHours(params);
  }

  // Cache the result
  hoursCache.set(params.placeId, result);
  
  return result;
}

async function getFoursquareHours(params: HoursToolParams): Promise<HoursToolResult> {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    throw new Error("FOURSQUARE_API_KEY not configured");
  }

  const url = `https://api.foursquare.com/v3/places/${params.placeId}?fields=hours`;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": apiKey,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Foursquare API error: ${response.status}`);
  }

  const data = await response.json();
  const hours = data.hours;

  if (!hours) {
    return getDefaultHours(params);
  }

  const openingHours = hours.open?.map((h: { day: number; open: string; close: string; }): OpeningHours => ({
    day: h.day,
    open: timeStringToMinutes(h.open),
    close: timeStringToMinutes(h.close),
    type: "regular" as const,
  })) || [];

  const now = new Date();
  const isOpen = checkIfOpen(openingHours, now, params.timezone);

  return {
    placeId: params.placeId,
    isOpen,
    hours: openingHours,
    exceptions: [],
    timezone: params.timezone,
    lastUpdated: new Date().toISOString(),
    source: "foursquare",
  };
}

async function getGoogleHours(params: HoursToolParams): Promise<HoursToolResult> {
  // Google Places API implementation would go here
  // For now, return default hours
  console.log("Google Places API not implemented yet");
  return getDefaultHours(params);
}

function getDefaultHours(params: HoursToolParams): HoursToolResult {
  // Default business hours: 9 AM - 6 PM, Monday-Friday
  const defaultHours: OpeningHours[] = [
    // Monday-Friday
    ...Array.from({ length: 5 }, (_, i) => ({
      day: i + 1, // 1=Monday
      open: 9 * 60, // 9 AM
      close: 18 * 60, // 6 PM
      type: "regular" as const,
    })),
  ];

  return {
    placeId: params.placeId,
    isOpen: null, // Unknown
    hours: defaultHours,
    exceptions: [],
    timezone: params.timezone,
    lastUpdated: new Date().toISOString(),
    source: "unknown",
  };
}

function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function checkIfOpen(hours: OpeningHours[], date: Date, timezone: string): boolean | null {
  try {
    // Convert to target timezone
    const localDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    const dayOfWeek = localDate.getDay();
    const minutesFromMidnight = localDate.getHours() * 60 + localDate.getMinutes();

    const todayHours = hours.filter(h => h.day === dayOfWeek);
    
    if (todayHours.length === 0) {
      return false; // Closed if no hours for today
    }

    return todayHours.some(h => 
      minutesFromMidnight >= h.open && 
      minutesFromMidnight <= h.close
    );
  } catch (error) {
    console.warn("Error checking if place is open:", error);
    return null; // Unknown
  }
}

export function formatHours(hours: OpeningHours[], timezone?: string): string {
  if (hours.length === 0) {
    return "Hours not available";
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayHours: { [key: number]: OpeningHours[] } = {};

  // Group hours by day
  hours.forEach(h => {
    if (!dayHours[h.day]) {
      dayHours[h.day] = [];
    }
    dayHours[h.day].push(h);
  });

  // Format each day
  const formatted = Object.entries(dayHours)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([day, dayHoursList]) => {
      const dayName = dayNames[Number(day)];
      if (dayHoursList.length === 0) {
        return `${dayName}: Closed`;
      }
      
      const timeRanges = dayHoursList.map(h => 
        `${minutesToTimeString(h.open)}-${minutesToTimeString(h.close)}`
      ).join(", ");
      
      return `${dayName}: ${timeRanges}`;
    });

  return formatted.join("\n");
}

function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

export function isCurrentlyOpen(result: HoursToolResult): boolean | null {
  if (result.isOpen !== null) {
    return result.isOpen;
  }

  const now = new Date();
  return checkIfOpen(result.hours, now, result.timezone);
}

export function getNextOpenTime(result: HoursToolResult): Date | null {
  const now = new Date();
  const currentDay = now.getDay();
  
  // Check remaining hours today
  const todayHours = result.hours.filter(h => h.day === currentDay);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  for (const hours of todayHours) {
    if (hours.open > currentMinutes) {
      const nextOpen = new Date(now);
      nextOpen.setHours(Math.floor(hours.open / 60), hours.open % 60, 0, 0);
      return nextOpen;
    }
  }
  
  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const checkDay = (currentDay + i) % 7;
    const dayHours = result.hours.filter(h => h.day === checkDay);
    
    if (dayHours.length > 0) {
      const nextOpen = new Date(now);
      nextOpen.setDate(nextOpen.getDate() + i);
      nextOpen.setHours(Math.floor(dayHours[0].open / 60), dayHours[0].open % 60, 0, 0);
      return nextOpen;
    }
  }
  
  return null; // Never opens
}