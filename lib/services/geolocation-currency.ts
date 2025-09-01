/**
 * Geolocation-based Currency Detection Service
 * Automatically detects user's currency based on their geographic location
 */

import { CurrencyCode, getCurrenciesByCountry } from '@/lib/currency/currency-converter';

export interface LocationData {
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  timezone?: string;
  currency?: CurrencyCode;
}

export interface GeolocationCurrencyResult {
  success: boolean;
  currency: CurrencyCode;
  location: LocationData | null;
  method: 'geolocation' | 'ip-fallback' | 'browser-locale' | 'default';
  error?: string;
}

// Country code to currency mapping for common cases
const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'AU': 'AUD', 'NZ': 'NZD',
  'JP': 'JPY', 'CN': 'CNY', 'IN': 'INR', 'SG': 'SGD', 'HK': 'HKD',
  'KR': 'KRW', 'TH': 'THB', 'MY': 'MYR', 'ID': 'IDR', 'PH': 'PHP',
  'VN': 'VND', 'TW': 'TWD', 'PK': 'PKR', 'BD': 'BDT', 'LK': 'LKR',
  'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
  'BE': 'EUR', 'AT': 'EUR', 'PT': 'EUR', 'FI': 'EUR', 'IE': 'EUR',
  'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK', 'PL': 'PLN', 'CZ': 'CZK',
  'HU': 'HUF', 'RO': 'RON', 'BG': 'BGN', 'HR': 'HRK', 'IS': 'ISK',
  'CH': 'CHF', 'RU': 'RUB', 'UA': 'UAH', 'BY': 'BYN', 'KZ': 'KZT',
  'AE': 'AED', 'SA': 'SAR', 'QA': 'QAR', 'KW': 'KWD', 'BH': 'BHD',
  'OM': 'OMR', 'JO': 'JOD', 'IL': 'ILS', 'TR': 'TRY', 'EG': 'EGP',
  'ZA': 'ZAR', 'MA': 'MAD', 'TN': 'TND', 'BR': 'BRL', 'MX': 'MXN',
  'AR': 'ARS', 'CL': 'CLP', 'CO': 'COP', 'PE': 'PEN'
};

/**
 * Get user's current location using Geolocation API
 */
export async function getCurrentLocation(timeout: number = 10000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error('Geolocation timeout'));
    }, timeout);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve(position);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: false, // Faster response
        timeout: timeout - 1000,
        maximumAge: 5 * 60 * 1000 // Accept cached location up to 5 minutes
      }
    );
  });
}

/**
 * Get location info from coordinates using reverse geocoding
 */
export async function getLocationFromCoords(
  latitude: number, 
  longitude: number
): Promise<LocationData> {
  try {
    // Try multiple reverse geocoding services
    const services = [
      () => reverseGeocodeWithOpenStreetMap(latitude, longitude),
      () => reverseGeocodeWithBigDataCloud(latitude, longitude),
    ];

    for (const service of services) {
      try {
        return await service();
      } catch (error) {
        console.warn('Reverse geocoding service failed:', error);
        continue;
      }
    }

    throw new Error('All reverse geocoding services failed');
  } catch (error) {
    // Fallback: return basic location data
    return {
      latitude,
      longitude,
      country: 'Unknown',
      countryCode: 'XX',
      currency: 'USD'
    };
  }
}

/**
 * Reverse geocoding using OpenStreetMap Nominatim (free)
 */
async function reverseGeocodeWithOpenStreetMap(
  latitude: number, 
  longitude: number
): Promise<LocationData> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Tripthesia/1.0 (travel-planning-app)'
    }
  });

  if (!response.ok) {
    throw new Error(`OpenStreetMap API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data || !data.address) {
    throw new Error('Invalid response from OpenStreetMap');
  }

  const countryCode = data.address.country_code?.toUpperCase() || 'XX';
  const currency = COUNTRY_CURRENCY_MAP[countryCode] || 'USD';

  return {
    latitude,
    longitude,
    country: data.address.country || 'Unknown',
    countryCode,
    region: data.address.state || data.address.region,
    city: data.address.city || data.address.town || data.address.village,
    currency
  };
}

/**
 * Reverse geocoding using BigDataCloud (free tier available)
 */
async function reverseGeocodeWithBigDataCloud(
  latitude: number, 
  longitude: number
): Promise<LocationData> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
  
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`BigDataCloud API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data) {
    throw new Error('Invalid response from BigDataCloud');
  }

  const countryCode = data.countryCode?.toUpperCase() || 'XX';
  const currency = COUNTRY_CURRENCY_MAP[countryCode] || 'USD';

  return {
    latitude,
    longitude,
    country: data.countryName || 'Unknown',
    countryCode,
    region: data.principalSubdivision,
    city: data.city || data.locality,
    currency
  };
}

/**
 * Get location and currency from IP address (fallback)
 */
export async function getLocationFromIP(): Promise<LocationData> {
  try {
    // Try multiple IP geolocation services
    const services = [
      () => getLocationFromIPAPI(),
      () => getLocationFromIPGeolocation(),
    ];

    for (const service of services) {
      try {
        return await service();
      } catch (error) {
        console.warn('IP geolocation service failed:', error);
        continue;
      }
    }

    throw new Error('All IP geolocation services failed');
  } catch (error) {
    // Ultimate fallback
    return {
      latitude: 0,
      longitude: 0,
      country: 'Unknown',
      countryCode: 'XX',
      currency: 'USD'
    };
  }
}

/**
 * IP geolocation using ipapi.co (free tier)
 */
async function getLocationFromIPAPI(): Promise<LocationData> {
  const response = await fetch('https://ipapi.co/json/', {
    headers: {
      'User-Agent': 'Tripthesia/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`IP API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`IP API error: ${data.reason}`);
  }

  const countryCode = data.country_code?.toUpperCase() || 'XX';
  const currency = COUNTRY_CURRENCY_MAP[countryCode] || 'USD';

  return {
    latitude: data.latitude || 0,
    longitude: data.longitude || 0,
    country: data.country_name || 'Unknown',
    countryCode,
    region: data.region,
    city: data.city,
    timezone: data.timezone,
    currency
  };
}

/**
 * IP geolocation using ipgeolocation.io (free tier)
 */
async function getLocationFromIPGeolocation(): Promise<LocationData> {
  const response = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=free');

  if (!response.ok) {
    throw new Error(`IP Geolocation error: ${response.status}`);
  }

  const data = await response.json();

  const countryCode = data.country_code2?.toUpperCase() || 'XX';
  const currency = COUNTRY_CURRENCY_MAP[countryCode] || 'USD';

  return {
    latitude: parseFloat(data.latitude) || 0,
    longitude: parseFloat(data.longitude) || 0,
    country: data.country_name || 'Unknown',
    countryCode,
    region: data.state_prov,
    city: data.city,
    timezone: data.time_zone?.name,
    currency
  };
}

/**
 * Get currency from browser locale (fallback)
 */
function getCurrencyFromBrowserLocale(): CurrencyCode {
  try {
    const locale = navigator.language || navigator.languages?.[0] || 'en-US';
    const region = locale.split('-')[1]?.toUpperCase();
    
    if (region && COUNTRY_CURRENCY_MAP[region]) {
      return COUNTRY_CURRENCY_MAP[region];
    }

    // Map common language codes to currencies
    const languageMap: Record<string, CurrencyCode> = {
      'en': 'USD', 'es': 'EUR', 'fr': 'EUR', 'de': 'EUR',
      'ja': 'JPY', 'ko': 'KRW', 'zh': 'CNY', 'hi': 'INR',
      'pt': 'BRL', 'ru': 'RUB', 'ar': 'AED'
    };

    const language = locale.split('-')[0];
    return languageMap[language] || 'USD';
  } catch (error) {
    return 'USD';
  }
}

/**
 * Main function: Detect currency based on user location
 */
export async function detectCurrencyFromLocation(): Promise<GeolocationCurrencyResult> {
  try {
    // Try GPS first
    try {
      const position = await getCurrentLocation();
      const location = await getLocationFromCoords(
        position.coords.latitude,
        position.coords.longitude
      );

      return {
        success: true,
        currency: location.currency || 'USD',
        location,
        method: 'geolocation'
      };
    } catch (geoError) {
      console.log('Geolocation failed, trying IP fallback:', geoError);
    }

    // Fallback to IP geolocation
    try {
      const location = await getLocationFromIP();
      
      return {
        success: true,
        currency: location.currency || 'USD',
        location,
        method: 'ip-fallback'
      };
    } catch (ipError) {
      console.log('IP geolocation failed, using browser locale:', ipError);
    }

    // Final fallback to browser locale
    const currency = getCurrencyFromBrowserLocale();
    
    return {
      success: true,
      currency,
      location: null,
      method: 'browser-locale'
    };

  } catch (error) {
    console.error('Currency detection failed completely:', error);
    
    return {
      success: false,
      currency: 'USD',
      location: null,
      method: 'default',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Storage utilities for currency preferences
 */
export const currencyPreferences = {
  // Save user's currency preference
  save(currency: CurrencyCode, method?: string): void {
    try {
      localStorage.setItem('preferred_currency', currency);
      if (method) {
        localStorage.setItem('currency_detection_method', method);
      }
      localStorage.setItem('currency_last_updated', Date.now().toString());
    } catch (error) {
      console.warn('Failed to save currency preference:', error);
    }
  },

  // Load saved currency preference
  load(): { currency: CurrencyCode | null; method: string | null; lastUpdated: number | null } {
    try {
      const currency = localStorage.getItem('preferred_currency') as CurrencyCode | null;
      const method = localStorage.getItem('currency_detection_method');
      const lastUpdated = localStorage.getItem('currency_last_updated');
      
      return {
        currency,
        method,
        lastUpdated: lastUpdated ? parseInt(lastUpdated) : null
      };
    } catch (error) {
      console.warn('Failed to load currency preference:', error);
      return { currency: null, method: null, lastUpdated: null };
    }
  },

  // Clear saved preferences
  clear(): void {
    try {
      localStorage.removeItem('preferred_currency');
      localStorage.removeItem('currency_detection_method');
      localStorage.removeItem('currency_last_updated');
    } catch (error) {
      console.warn('Failed to clear currency preference:', error);
    }
  },

  // Check if preferences should be refreshed (older than 24 hours)
  shouldRefresh(): boolean {
    const { lastUpdated } = this.load();
    if (!lastUpdated) return true;
    
    const oneDayMs = 24 * 60 * 60 * 1000;
    return Date.now() - lastUpdated > oneDayMs;
  }
};

/**
 * Get user's preferred currency with caching and fallbacks
 */
export async function getUserPreferredCurrency(forceRefresh: boolean = false): Promise<GeolocationCurrencyResult> {
  // Check cached preference first
  if (!forceRefresh) {
    const saved = currencyPreferences.load();
    if (saved.currency && !currencyPreferences.shouldRefresh()) {
      return {
        success: true,
        currency: saved.currency,
        location: null,
        method: (saved.method as any) || 'cached'
      };
    }
  }

  // Detect new currency
  const result = await detectCurrencyFromLocation();
  
  // Save the result if successful
  if (result.success) {
    currencyPreferences.save(result.currency, result.method);
  }

  return result;
}