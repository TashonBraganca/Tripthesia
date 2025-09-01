/**
 * Enhanced Trip Planning Services
 * Weather, distance calculations, best time to visit, and travel recommendations
 */

import { LocationData } from '@/lib/data/locations';

// Weather data interface
export interface WeatherData {
  location: string;
  temperature: {
    current: number;
    high: number;
    low: number;
    unit: 'C' | 'F';
  };
  condition: {
    main: string;
    description: string;
    icon: string;
  };
  humidity: number;
  windSpeed: number;
  visibility: number;
  uvIndex: number;
  forecast: {
    date: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
    precipitation: number;
  }[];
}

// Distance and travel time interface
export interface TravelInfo {
  distance: {
    value: number;
    unit: 'km' | 'miles';
    text: string;
  };
  duration: {
    driving: {
      value: number; // in minutes
      text: string;
    };
    flight: {
      value: number; // in minutes
      text: string;
    };
    public_transport?: {
      value: number; // in minutes
      text: string;
    };
  };
  route: {
    type: 'domestic' | 'international';
    visa_required: boolean;
    popular_route: boolean;
    timezone_difference: number; // in hours
  };
}

// Best time to visit interface
export interface BestTimeToVisit {
  location: string;
  overall_best: {
    months: string[];
    reason: string;
  };
  seasonal_info: {
    season: 'spring' | 'summer' | 'autumn' | 'winter';
    months: string[];
    temperature_range: string;
    weather_description: string;
    pros: string[];
    cons: string[];
    recommended_activities: string[];
  }[];
  current_period: {
    is_good_time: boolean;
    weather_summary: string;
    travel_tips: string[];
  };
  monthly_breakdown: {
    month: string;
    temperature: { high: number; low: number };
    rainfall: number;
    crowd_level: 'low' | 'medium' | 'high';
    price_level: 'budget' | 'moderate' | 'expensive';
    highlights: string[];
  }[];
}

// Mock weather data (in production, would call OpenWeatherMap API)
const getMockWeatherData = (location: LocationData): WeatherData => {
  const baseTemp = location.countryCode === 'IN' ? 28 : 
                  ['SG', 'TH', 'MY'].includes(location.countryCode) ? 32 :
                  ['GB', 'DE', 'FR'].includes(location.countryCode) ? 15 : 22;
  
  const conditions = [
    { main: 'Clear', description: 'Clear sky', icon: '01d' },
    { main: 'Clouds', description: 'Partly cloudy', icon: '02d' },
    { main: 'Rain', description: 'Light rain', icon: '10d' },
    { main: 'Sunny', description: 'Sunny', icon: '01d' }
  ];
  
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  return {
    location: location.name,
    temperature: {
      current: baseTemp + Math.floor(Math.random() * 8) - 4,
      high: baseTemp + Math.floor(Math.random() * 5),
      low: baseTemp - Math.floor(Math.random() * 8),
      unit: 'C'
    },
    condition,
    humidity: 60 + Math.floor(Math.random() * 30),
    windSpeed: Math.floor(Math.random() * 15) + 5,
    visibility: 8 + Math.floor(Math.random() * 2),
    uvIndex: Math.floor(Math.random() * 8) + 1,
    forecast: Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      return {
        date: date.toISOString().split('T')[0],
        high: baseTemp + Math.floor(Math.random() * 5),
        low: baseTemp - Math.floor(Math.random() * 8),
        condition: conditions[Math.floor(Math.random() * conditions.length)].main,
        icon: conditions[Math.floor(Math.random() * conditions.length)].icon,
        precipitation: Math.floor(Math.random() * 20)
      };
    })
  };
};

// Calculate distance between two locations (Haversine formula)
const calculateDistance = (from: LocationData, to: LocationData): number => {
  const R = 6371; // Earth's radius in kilometers
  const [lon1, lat1] = from.coordinates;
  const [lon2, lat2] = to.coordinates;
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get travel information between two locations
export const getTravelInfo = async (from: LocationData, to: LocationData): Promise<TravelInfo> => {
  const distance = calculateDistance(from, to);
  const isInternational = from.countryCode !== to.countryCode;
  
  // Estimate flight time based on distance
  const flightTimeMinutes = Math.max(60, Math.round(distance / 800 * 60)); // ~800 km/h average
  
  // Estimate driving time (where applicable)
  const drivingTimeMinutes = distance < 50 ? Math.round(distance / 60 * 60) : // City driving ~60 km/h
                            distance < 500 ? Math.round(distance / 80 * 60) : // Highway ~80 km/h  
                            Math.round(distance / 100 * 60); // Long distance ~100 km/h
  
  // Popular routes (simplified)
  const popularRoutes = [
    ['Mumbai', 'Delhi'], ['Mumbai', 'Bangalore'], ['Delhi', 'Dubai'], 
    ['Mumbai', 'London'], ['Bangalore', 'Singapore'], ['Delhi', 'New York']
  ];
  
  const isPopularRoute = popularRoutes.some(route => 
    (from.name.includes(route[0]) && to.name.includes(route[1])) ||
    (from.name.includes(route[1]) && to.name.includes(route[0]))
  );
  
  // Visa requirements (simplified)
  const visaFreeCountries = ['IN', 'NP', 'BT']; // Simplified
  const visaRequired = isInternational && 
    !visaFreeCountries.includes(to.countryCode) &&
    from.countryCode === 'IN';
  
  return {
    distance: {
      value: Math.round(distance),
      unit: 'km',
      text: `${Math.round(distance)} km`
    },
    duration: {
      driving: {
        value: drivingTimeMinutes,
        text: `${Math.floor(drivingTimeMinutes / 60)}h ${drivingTimeMinutes % 60}m`
      },
      flight: {
        value: flightTimeMinutes,
        text: `${Math.floor(flightTimeMinutes / 60)}h ${flightTimeMinutes % 60}m`
      }
    },
    route: {
      type: isInternational ? 'international' : 'domestic',
      visa_required: visaRequired,
      popular_route: isPopularRoute,
      timezone_difference: 0 // Would calculate from timezone data
    }
  };
};

// Get weather information for a location
export const getWeatherInfo = async (location: LocationData): Promise<WeatherData> => {
  try {
    // In production, call OpenWeatherMap or similar API
    // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location.name}&appid=${API_KEY}`);
    // For now, return mock data
    return getMockWeatherData(location);
  } catch (error) {
    console.error('Weather API error:', error);
    return getMockWeatherData(location);
  }
};

// Get best time to visit information
export const getBestTimeToVisit = async (location: LocationData): Promise<BestTimeToVisit> => {
  const bestTimeData: Record<string, Partial<BestTimeToVisit>> = {
    // India
    'Goa': {
      overall_best: {
        months: ['November', 'December', 'January', 'February'],
        reason: 'Pleasant weather with minimal rainfall and comfortable temperatures'
      },
      seasonal_info: [
        {
          season: 'winter',
          months: ['December', 'January', 'February'],
          temperature_range: '20-30°C',
          weather_description: 'Cool and dry, perfect for beach activities',
          pros: ['Ideal weather', 'Clear skies', 'Low humidity'],
          cons: ['Peak season crowds', 'Higher prices'],
          recommended_activities: ['Beach activities', 'Water sports', 'Sightseeing']
        },
        {
          season: 'summer',
          months: ['March', 'April', 'May'],
          temperature_range: '25-35°C',
          weather_description: 'Hot but still pleasant for beach activities',
          pros: ['Fewer crowds', 'Lower prices'],
          cons: ['Getting hot', 'Increased humidity'],
          recommended_activities: ['Early morning/evening beach walks', 'Indoor attractions']
        }
      ]
    },
    
    'Dubai': {
      overall_best: {
        months: ['November', 'December', 'January', 'February', 'March'],
        reason: 'Perfect weather for outdoor activities and sightseeing'
      },
      seasonal_info: [
        {
          season: 'winter',
          months: ['December', 'January', 'February'],
          temperature_range: '18-26°C',
          weather_description: 'Perfect weather for all outdoor activities',
          pros: ['Ideal temperatures', 'No rain', 'Clear skies'],
          cons: ['Peak season pricing', 'Crowded attractions'],
          recommended_activities: ['Desert safari', 'Outdoor dining', 'Beach activities', 'Sightseeing']
        }
      ]
    },
    
    'Singapore': {
      overall_best: {
        months: ['February', 'March', 'April', 'May'],
        reason: 'Lower rainfall and comfortable temperatures'
      }
    },
    
    'Thailand': {
      overall_best: {
        months: ['November', 'December', 'January', 'February'],
        reason: 'Cool and dry season with pleasant weather'
      }
    }
  };
  
  const defaultData: BestTimeToVisit = {
    location: location.name,
    overall_best: {
      months: ['October', 'November', 'December', 'January', 'February', 'March'],
      reason: 'Pleasant weather conditions for travel'
    },
    seasonal_info: [
      {
        season: 'winter',
        months: ['December', 'January', 'February'],
        temperature_range: '15-25°C',
        weather_description: 'Cool and comfortable',
        pros: ['Pleasant temperatures', 'Clear skies'],
        cons: ['Peak season'],
        recommended_activities: ['Sightseeing', 'Outdoor activities']
      }
    ],
    current_period: {
      is_good_time: true,
      weather_summary: 'Generally good weather for travel',
      travel_tips: ['Check local weather before traveling', 'Pack according to season']
    },
    monthly_breakdown: []
  };
  
  // Find matching location data
  const locationKey = Object.keys(bestTimeData).find(key => 
    location.name.toLowerCase().includes(key.toLowerCase()) ||
    location.displayName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (locationKey) {
    return { ...defaultData, ...bestTimeData[locationKey] };
  }
  
  return defaultData;
};

// Get seasonal travel tips
export const getSeasonalTips = (location: LocationData, travelDate: string): string[] => {
  const month = new Date(travelDate).getMonth() + 1;
  const tips: string[] = [];
  
  // India-specific tips
  if (location.countryCode === 'IN') {
    if (month >= 6 && month <= 9) {
      tips.push('🌧️ Monsoon season: Pack rain gear and check for flood warnings');
      tips.push('🏨 Book accommodations in advance as some areas may be less accessible');
    } else if (month >= 12 || month <= 2) {
      tips.push('🧥 Winter season: Pack warm clothes for northern India');
      tips.push('🏖️ Perfect time for beach destinations like Goa');
    } else {
      tips.push('☀️ Summer season: Stay hydrated and use sun protection');
      tips.push('🌡️ Avoid midday activities in very hot regions');
    }
  }
  
  // Southeast Asia tips
  if (['TH', 'SG', 'MY', 'ID'].includes(location.countryCode)) {
    if (month >= 6 && month <= 10) {
      tips.push('🌧️ Rainy season: Pack umbrella and waterproof gear');
      tips.push('🌴 Indoor attractions and covered markets are great options');
    } else {
      tips.push('☀️ Dry season: Perfect for outdoor activities and island hopping');
    }
  }
  
  // Middle East tips
  if (['AE', 'SA', 'QA'].includes(location.countryCode)) {
    if (month >= 6 && month <= 9) {
      tips.push('🌡️ Very hot season: Plan indoor activities during daytime');
      tips.push('🌙 Evening and early morning are best for outdoor activities');
    } else {
      tips.push('🌤️ Perfect weather for outdoor activities and desert excursions');
    }
  }
  
  return tips;
};

// Calculate estimated costs based on location and season
export const getEstimatedCosts = (from: LocationData, to: LocationData, travelers: number, days: number) => {
  const isInternational = from.countryCode !== to.countryCode;
  const isPopularDestination = ['Dubai', 'Singapore', 'London', 'New York', 'Tokyo'].some(dest => 
    to.name.includes(dest)
  );
  
  // Base costs in USD (simplified)
  const baseCosts = {
    flight: isInternational ? (isPopularDestination ? 600 : 400) : 150,
    hotel_per_night: isPopularDestination ? 150 : 80,
    food_per_day: isPopularDestination ? 60 : 30,
    activities_per_day: isPopularDestination ? 40 : 20,
    transport_per_day: isPopularDestination ? 30 : 15
  };
  
  const totalFlight = baseCosts.flight * travelers;
  const totalHotel = baseCosts.hotel_per_night * days;
  const totalFood = baseCosts.food_per_day * days * travelers;
  const totalActivities = baseCosts.activities_per_day * days;
  const totalTransport = baseCosts.transport_per_day * days;
  
  const grandTotal = totalFlight + totalHotel + totalFood + totalActivities + totalTransport;
  
  return {
    breakdown: {
      flights: totalFlight,
      accommodation: totalHotel,
      food: totalFood,
      activities: totalActivities,
      local_transport: totalTransport
    },
    total: grandTotal,
    per_person: Math.round(grandTotal / travelers),
    currency: 'USD',
    savings_tips: [
      `Book flights ${isInternational ? '6-8 weeks' : '2-4 weeks'} in advance for better prices`,
      'Consider staying slightly outside city center for cheaper accommodation',
      'Mix street food and local restaurants with fine dining',
      'Look for combo tickets for multiple attractions'
    ]
  };
};

export default {
  getTravelInfo,
  getWeatherInfo,  
  getBestTimeToVisit,
  getSeasonalTips,
  getEstimatedCosts
};