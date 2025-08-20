import { z } from "zod";

export const WeatherToolParams = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  days: z.number().min(1).max(14).default(7),
  includeHourly: z.boolean().default(false),
});

export const WeatherToolResult = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    timezone: z.string(),
  }),
  current: z.object({
    temperature: z.number(),
    weatherCode: z.number(),
    windSpeed: z.number(),
    humidity: z.number(),
    description: z.string(),
  }).optional(),
  daily: z.array(z.object({
    date: z.string(),
    temperatureMax: z.number(),
    temperatureMin: z.number(),
    weatherCode: z.number(),
    precipitation: z.number(),
    description: z.string(),
  })),
  alerts: z.array(z.object({
    title: z.string(),
    description: z.string(),
    severity: z.enum(["minor", "moderate", "severe", "extreme"]),
  })).default([]),
});

export type WeatherToolParams = z.infer<typeof WeatherToolParams>;
export type WeatherToolResult = z.infer<typeof WeatherToolResult>;

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
  80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail",
};

export class WeatherCache {
  private cache = new Map<string, { data: WeatherToolResult; timestamp: number }>();
  private readonly TTL = 6 * 60 * 60 * 1000; // 6 hours

  private getCacheKey(params: WeatherToolParams): string {
    return `${params.lat.toFixed(2)}-${params.lng.toFixed(2)}-${params.days}`;
  }

  getCached(params: WeatherToolParams): WeatherToolResult | null {
    const key = this.getCacheKey(params);
    const cached = this.cache.get(key);
    
    if (!cached || Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  setCached(params: WeatherToolParams, result: WeatherToolResult): void {
    const key = this.getCacheKey(params);
    this.cache.set(key, { data: result, timestamp: Date.now() });
  }
}

const weatherCache = new WeatherCache();

export async function getWeather(params: WeatherToolParams): Promise<WeatherToolResult> {
  // Check cache first
  const cached = weatherCache.getCached(params);
  if (cached) {
    return cached;
  }

  try {
    const result = await getOpenMeteoWeather(params);
    weatherCache.setCached(params, result);
    return result;
  } catch (error) {
    console.warn("Weather API failed:", error);
    throw new Error("Weather data temporarily unavailable");
  }
}

async function getOpenMeteoWeather(params: WeatherToolParams): Promise<WeatherToolResult> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", params.lat.toString());
  url.searchParams.set("longitude", params.lng.toString());
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum");
  url.searchParams.set("current_weather", "true");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", params.days.toString());

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  const data = await response.json();
  
  const current = data.current_weather ? {
    temperature: data.current_weather.temperature,
    weatherCode: data.current_weather.weathercode,
    windSpeed: data.current_weather.windspeed,
    humidity: 0, // Not available in current_weather
    description: WEATHER_CODES[data.current_weather.weathercode] || "Unknown",
  } : undefined;

  const daily = data.daily.time.map((date: string, i: number) => ({
    date,
    temperatureMax: data.daily.temperature_2m_max[i],
    temperatureMin: data.daily.temperature_2m_min[i],
    weatherCode: data.daily.weathercode[i],
    precipitation: data.daily.precipitation_sum[i],
    description: WEATHER_CODES[data.daily.weathercode[i]] || "Unknown",
  }));

  return {
    location: {
      lat: params.lat,
      lng: params.lng,
      timezone: data.timezone,
    },
    current,
    daily,
    alerts: [], // Open-Meteo doesn't provide alerts in free tier
  };
}

export function getWeatherImpact(weatherCode: number): {
  severity: "low" | "medium" | "high";
  activities: string[];
  recommendation: string;
} {
  if ([0, 1, 2].includes(weatherCode)) {
    return {
      severity: "low",
      activities: ["all outdoor activities"],
      recommendation: "Perfect weather for any outdoor activities",
    };
  }
  
  if ([3, 45, 48, 51, 53].includes(weatherCode)) {
    return {
      severity: "medium",
      activities: ["indoor activities", "covered attractions"],
      recommendation: "Consider indoor activities or bring appropriate gear",
    };
  }
  
  if ([61, 63, 65, 71, 73, 75, 80, 81, 82, 95, 96].includes(weatherCode)) {
    return {
      severity: "high",
      activities: ["indoor activities", "museums", "shopping"],
      recommendation: "Strong recommendation for indoor activities",
    };
  }
  
  return {
    severity: "medium",
    activities: ["weather-dependent"],
    recommendation: "Check current conditions before outdoor activities",
  };
}