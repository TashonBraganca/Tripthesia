/**
 * Open-Meteo Weather API Integration
 * Provides real-time weather data and forecasts for travel planning
 */

import { z } from 'zod';
import { cacheHelpers, cacheKeys, cacheTTL } from './redis';
import { trackError } from './monitoring';

// Weather API Configuration
const WEATHER_API_CONFIG = {
  baseUrl: 'https://api.open-meteo.com/v1/forecast',
  geocodingUrl: 'https://geocoding-api.open-meteo.com/v1/search'
};

// Weather data schemas
export const WeatherDataSchema = z.object({
  location: z.object({
    name: z.string(),
    country: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string()
  }),
  current: z.object({
    time: z.string(),
    temperature: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windDirection: z.number(),
    weatherCode: z.number(),
    isDay: z.boolean(),
    description: z.string(),
    icon: z.string()
  }),
  daily: z.array(z.object({
    date: z.string(),
    temperatureMax: z.number(),
    temperatureMin: z.number(),
    precipitationSum: z.number(),
    precipitationHours: z.number(),
    windSpeedMax: z.number(),
    weatherCode: z.number(),
    sunrise: z.string(),
    sunset: z.string(),
    description: z.string(),
    icon: z.string(),
    suitability: z.object({
      outdoor: z.enum(['excellent', 'good', 'fair', 'poor']),
      sightseeing: z.enum(['excellent', 'good', 'fair', 'poor']),
      beach: z.enum(['excellent', 'good', 'fair', 'poor']),
      hiking: z.enum(['excellent', 'good', 'fair', 'poor'])
    })
  })),
  hourly: z.array(z.object({
    time: z.string(),
    temperature: z.number(),
    humidity: z.number(),
    precipitationProbability: z.number(),
    weatherCode: z.number(),
    description: z.string()
  })).optional()
});

export type WeatherData = z.infer<typeof WeatherDataSchema>;

// Weather recommendation schema
export const WeatherRecommendationSchema = z.object({
  reroute_needed: z.boolean(),
  severity: z.enum(['low', 'medium', 'high']),
  reason: z.string(),
  alternatives: z.array(z.object({
    activity_type: z.string(),
    suggestion: z.string(),
    reason: z.string(),
    indoor: z.boolean()
  })),
  best_time_today: z.object({
    start: z.string(),
    end: z.string(),
    reason: z.string()
  }).optional()
});

export type WeatherRecommendation = z.infer<typeof WeatherRecommendationSchema>;

/**
 * Weather Service Class
 */
export class WeatherService {
  /**
   * Get coordinates for a city name
   */
  static async getCoordinates(cityName: string): Promise<{latitude: number, longitude: number, name: string, country: string} | null> {
    try {
      const cacheKey = `geocode:${cityName.toLowerCase()}`;
      const cached = await cacheHelpers.get<{latitude: number, longitude: number, name: string, country: string}>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await fetch(
        `${WEATHER_API_CONFIG.geocodingUrl}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return null;
      }

      const result = {
        latitude: data.results[0].latitude,
        longitude: data.results[0].longitude,
        name: data.results[0].name,
        country: data.results[0].country
      };

      // Cache for 24 hours
      await cacheHelpers.set(cacheKey, result, 24 * 60 * 60);
      
      return result;
    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        service: 'weather_geocoding',
        city: cityName
      });
      return null;
    }
  }

  /**
   * Get weather data for a location
   */
  static async getWeatherData(cityName: string, days: number = 7): Promise<WeatherData | null> {
    try {
      const cacheKey = cacheKeys.weather(cityName, new Date().toDateString());
      const cached = await cacheHelpers.get<WeatherData>(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Get coordinates first
      const coords = await this.getCoordinates(cityName);
      if (!coords) {
        throw new Error(`Could not find coordinates for ${cityName}`);
      }

      // Fetch weather data
      const params = new URLSearchParams({
        latitude: coords.latitude.toString(),
        longitude: coords.longitude.toString(),
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,is_day',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours,wind_speed_10m_max,weather_code,sunrise,sunset',
        hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code',
        timezone: 'auto',
        forecast_days: days.toString()
      });

      const response = await fetch(`${WEATHER_API_CONFIG.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform the data to our schema
      const weatherData: WeatherData = {
        location: {
          name: coords.name,
          country: coords.country,
          latitude: coords.latitude,
          longitude: coords.longitude,
          timezone: data.timezone || 'UTC'
        },
        current: {
          time: data.current.time,
          temperature: Math.round(data.current.temperature_2m),
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          windDirection: data.current.wind_direction_10m,
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day === 1,
          description: this.getWeatherDescription(data.current.weather_code),
          icon: this.getWeatherIcon(data.current.weather_code, data.current.is_day === 1)
        },
        daily: data.daily.time.map((date: string, index: number) => ({
          date,
          temperatureMax: Math.round(data.daily.temperature_2m_max[index]),
          temperatureMin: Math.round(data.daily.temperature_2m_min[index]),
          precipitationSum: data.daily.precipitation_sum[index],
          precipitationHours: data.daily.precipitation_hours[index],
          windSpeedMax: Math.round(data.daily.wind_speed_10m_max[index]),
          weatherCode: data.daily.weather_code[index],
          sunrise: data.daily.sunrise[index],
          sunset: data.daily.sunset[index],
          description: this.getWeatherDescription(data.daily.weather_code[index]),
          icon: this.getWeatherIcon(data.daily.weather_code[index], true),
          suitability: this.calculateActivitySuitability(
            data.daily.weather_code[index],
            data.daily.temperature_2m_max[index],
            data.daily.precipitation_sum[index],
            data.daily.wind_speed_10m_max[index]
          )
        })),
        hourly: data.hourly?.time?.map((time: string, index: number) => ({
          time,
          temperature: Math.round(data.hourly.temperature_2m[index]),
          humidity: data.hourly.relative_humidity_2m[index],
          precipitationProbability: data.hourly.precipitation_probability[index],
          weatherCode: data.hourly.weather_code[index],
          description: this.getWeatherDescription(data.hourly.weather_code[index])
        })) || []
      };

      // Cache for 2 hours
      await cacheHelpers.set(cacheKey, weatherData, cacheTTL.weather);

      return weatherData;
    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        service: 'weather_api',
        city: cityName,
        days
      });
      return null;
    }
  }

  /**
   * Get weather-based activity recommendations
   */
  static async getWeatherRecommendations(cityName: string, plannedActivities: string[]): Promise<WeatherRecommendation | null> {
    try {
      const weatherData = await this.getWeatherData(cityName, 1);
      if (!weatherData) return null;

      const today = weatherData.daily[0];
      const current = weatherData.current;

      // Determine if rerouting is needed
      const isRainy = today.precipitationSum > 5; // More than 5mm
      const isWindy = today.windSpeedMax > 30; // More than 30 km/h
      const isTooHot = today.temperatureMax > 35; // Above 35°C
      const isTooCold = today.temperatureMax < 5; // Below 5°C

      const rerouteNeeded = isRainy || isWindy || isTooHot || isTooCold;
      
      let severity: 'low' | 'medium' | 'high' = 'low';
      let reason = 'Weather conditions are favorable for planned activities.';
      
      if (rerouteNeeded) {
        if (today.precipitationSum > 15 || today.windSpeedMax > 50 || today.temperatureMax > 40 || today.temperatureMax < 0) {
          severity = 'high';
          reason = 'Severe weather conditions detected. Strong recommendation to modify outdoor plans.';
        } else {
          severity = 'medium';
          reason = 'Moderate weather concerns. Consider indoor alternatives for some activities.';
        }
      }

      // Generate alternatives
      const alternatives = [];
      
      if (isRainy) {
        alternatives.push({
          activity_type: 'indoor_cultural',
          suggestion: 'Visit museums, art galleries, or shopping centers',
          reason: `${today.precipitationSum}mm of rain expected`,
          indoor: true
        });
        alternatives.push({
          activity_type: 'covered_dining',
          suggestion: 'Explore indoor markets and covered food halls',
          reason: 'Stay dry while experiencing local cuisine',
          indoor: true
        });
      }

      if (isWindy) {
        alternatives.push({
          activity_type: 'sheltered_activities',
          suggestion: 'Choose ground-level activities and avoid high viewpoints',
          reason: `Wind speeds up to ${today.windSpeedMax} km/h`,
          indoor: false
        });
      }

      if (isTooHot) {
        alternatives.push({
          activity_type: 'early_morning',
          suggestion: 'Start outdoor activities early morning (6-9 AM)',
          reason: `Temperature reaching ${today.temperatureMax}°C`,
          indoor: false
        });
        alternatives.push({
          activity_type: 'air_conditioned',
          suggestion: 'Prioritize air-conditioned venues during midday',
          reason: 'Avoid heat exhaustion',
          indoor: true
        });
      }

      if (isTooCold) {
        alternatives.push({
          activity_type: 'heated_venues',
          suggestion: 'Focus on heated indoor attractions',
          reason: `Low temperature of ${today.temperatureMin}°C`,
          indoor: true
        });
      }

      // Find best time today
      let bestTime = undefined;
      if (weatherData.hourly && weatherData.hourly.length > 0) {
        const goodHours = weatherData.hourly.filter(hour => {
          const hourTemp = hour.temperature;
          const hourPrecip = hour.precipitationProbability;
          return hourTemp > 10 && hourTemp < 28 && hourPrecip < 30;
        });

        if (goodHours.length > 2) {
          bestTime = {
            start: goodHours[0].time.split('T')[1],
            end: goodHours[goodHours.length - 1].time.split('T')[1],
            reason: 'Optimal temperature and low precipitation probability'
          };
        }
      }

      return {
        reroute_needed: rerouteNeeded,
        severity,
        reason,
        alternatives,
        best_time_today: bestTime
      };

    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        service: 'weather_recommendations',
        city: cityName
      });
      return null;
    }
  }

  /**
   * Get weather description from WMO code
   */
  private static getWeatherDescription(code: number): string {
    const descriptions: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };

    return descriptions[code] || 'Unknown';
  }

  /**
   * Get weather icon from WMO code
   */
  private static getWeatherIcon(code: number, isDay: boolean): string {
    if (code === 0) return isDay ? '☀️' : '🌙';
    if (code <= 3) return isDay ? '⛅' : '☁️';
    if (code <= 48) return '🌫️';
    if (code <= 57) return '🌦️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 82) return '⛈️';
    if (code <= 86) return '❄️';
    if (code >= 95) return '⚡';
    return '🌤️';
  }

  /**
   * Calculate activity suitability based on weather conditions
   */
  private static calculateActivitySuitability(
    weatherCode: number,
    maxTemp: number,
    precipitation: number,
    windSpeed: number
  ): WeatherData['daily'][0]['suitability'] {
    const getScore = (temp: number, precip: number, wind: number): 'excellent' | 'good' | 'fair' | 'poor' => {
      if (precip > 10 || wind > 40 || temp < 0 || temp > 35) return 'poor';
      if (precip > 2 || wind > 25 || temp < 5 || temp > 30) return 'fair';
      if (precip > 0 || wind > 15 || temp < 10 || temp > 25) return 'good';
      return 'excellent';
    };

    const outdoor = getScore(maxTemp, precipitation, windSpeed);
    
    // Sightseeing is slightly more tolerant
    const sightseeing = precipitation > 5 ? 'poor' : outdoor === 'poor' ? 'fair' : outdoor;
    
    // Beach activities need warmer weather and no rain
    const beach = maxTemp < 20 || precipitation > 1 ? 'poor' : 
                  maxTemp < 25 || precipitation > 0 ? 'fair' :
                  maxTemp < 30 && precipitation === 0 && windSpeed < 20 ? 'excellent' : 'good';
    
    // Hiking is affected by rain and extreme temperatures
    const hiking = precipitation > 3 || maxTemp > 32 || maxTemp < 8 ? 'poor' :
                   precipitation > 0 || maxTemp > 28 || maxTemp < 12 ? 'fair' :
                   windSpeed > 20 ? 'good' : 'excellent';

    return {
      outdoor,
      sightseeing,
      beach,
      hiking
    };
  }
}

// Export convenience functions
export const getWeatherData = (city: string, days?: number) => WeatherService.getWeatherData(city, days);
export const getWeatherRecommendations = (city: string, activities: string[]) => WeatherService.getWeatherRecommendations(city, activities);

// Export schemas for validation
export { WeatherDataSchema, WeatherRecommendationSchema };