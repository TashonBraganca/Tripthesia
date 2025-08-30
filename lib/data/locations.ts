/**
 * Comprehensive Location Data System
 * Supports countries, states, cities, airports, and train stations
 */

export interface LocationData {
  id: string;
  name: string;
  displayName: string;
  type: 'country' | 'state' | 'city' | 'airport' | 'station' | 'landmark';
  country: string;
  countryCode: string;
  state?: string;
  stateCode?: string;
  coordinates: [number, number]; // [longitude, latitude]
  timezone: string;
  population?: number;
  iataCode?: string;
  railwayCode?: string;
  flagEmoji: string;
  searchTerms: string[]; // For fuzzy matching
  popularity?: number; // For ranking
}

// Indian States and Union Territories
export const indianStates: Partial<LocationData>[] = [
  { name: 'Andhra Pradesh', stateCode: 'AP', searchTerms: ['andhra pradesh', 'ap'] },
  { name: 'Arunachal Pradesh', stateCode: 'AR', searchTerms: ['arunachal pradesh', 'ar'] },
  { name: 'Assam', stateCode: 'AS', searchTerms: ['assam', 'as'] },
  { name: 'Bihar', stateCode: 'BR', searchTerms: ['bihar', 'br'] },
  { name: 'Chhattisgarh', stateCode: 'CG', searchTerms: ['chhattisgarh', 'chattisgarh', 'cg'] },
  { name: 'Goa', stateCode: 'GA', searchTerms: ['goa', 'ga'] },
  { name: 'Gujarat', stateCode: 'GJ', searchTerms: ['gujarat', 'gj'] },
  { name: 'Haryana', stateCode: 'HR', searchTerms: ['haryana', 'hr'] },
  { name: 'Himachal Pradesh', stateCode: 'HP', searchTerms: ['himachal pradesh', 'hp'] },
  { name: 'Jharkhand', stateCode: 'JH', searchTerms: ['jharkhand', 'jh'] },
  { name: 'Karnataka', stateCode: 'KA', searchTerms: ['karnataka', 'ka'] },
  { name: 'Kerala', stateCode: 'KL', searchTerms: ['kerala', 'kl'] },
  { name: 'Madhya Pradesh', stateCode: 'MP', searchTerms: ['madhya pradesh', 'mp'] },
  { name: 'Maharashtra', stateCode: 'MH', searchTerms: ['maharashtra', 'mh'] },
  { name: 'Manipur', stateCode: 'MN', searchTerms: ['manipur', 'mn'] },
  { name: 'Meghalaya', stateCode: 'ML', searchTerms: ['meghalaya', 'ml'] },
  { name: 'Mizoram', stateCode: 'MZ', searchTerms: ['mizoram', 'mz'] },
  { name: 'Nagaland', stateCode: 'NL', searchTerms: ['nagaland', 'nl'] },
  { name: 'Odisha', stateCode: 'OD', searchTerms: ['odisha', 'orissa', 'od'] },
  { name: 'Punjab', stateCode: 'PB', searchTerms: ['punjab', 'pb'] },
  { name: 'Rajasthan', stateCode: 'RJ', searchTerms: ['rajasthan', 'rj'] },
  { name: 'Sikkim', stateCode: 'SK', searchTerms: ['sikkim', 'sk'] },
  { name: 'Tamil Nadu', stateCode: 'TN', searchTerms: ['tamil nadu', 'tamilnadu', 'tn'] },
  { name: 'Telangana', stateCode: 'TG', searchTerms: ['telangana', 'tg'] },
  { name: 'Tripura', stateCode: 'TR', searchTerms: ['tripura', 'tr'] },
  { name: 'Uttar Pradesh', stateCode: 'UP', searchTerms: ['uttar pradesh', 'up'] },
  { name: 'Uttarakhand', stateCode: 'UK', searchTerms: ['uttarakhand', 'uttaranchal', 'uk'] },
  { name: 'West Bengal', stateCode: 'WB', searchTerms: ['west bengal', 'wb'] },
  // Union Territories
  { name: 'Andaman and Nicobar Islands', stateCode: 'AN', searchTerms: ['andaman', 'nicobar', 'an'] },
  { name: 'Chandigarh', stateCode: 'CH', searchTerms: ['chandigarh', 'ch'] },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', stateCode: 'DH', searchTerms: ['dadra', 'nagar haveli', 'daman', 'diu', 'dh'] },
  { name: 'Delhi', stateCode: 'DL', searchTerms: ['delhi', 'new delhi', 'dl'] },
  { name: 'Jammu and Kashmir', stateCode: 'JK', searchTerms: ['jammu', 'kashmir', 'jk'] },
  { name: 'Ladakh', stateCode: 'LA', searchTerms: ['ladakh', 'la'] },
  { name: 'Lakshadweep', stateCode: 'LD', searchTerms: ['lakshadweep', 'ld'] },
  { name: 'Puducherry', stateCode: 'PY', searchTerms: ['puducherry', 'pondicherry', 'py'] }
];

// Popular global destinations
export const popularDestinations: Partial<LocationData>[] = [
  // Major Indian Cities
  { name: 'Mumbai', displayName: 'Mumbai, Maharashtra, India', type: 'city', country: 'India', state: 'Maharashtra', flagEmoji: '🇮🇳', iataCode: 'BOM', popularity: 100, searchTerms: ['mumbai', 'bombay', 'bom'] },
  { name: 'Delhi', displayName: 'Delhi, India', type: 'city', country: 'India', state: 'Delhi', flagEmoji: '🇮🇳', iataCode: 'DEL', popularity: 95, searchTerms: ['delhi', 'new delhi', 'del'] },
  { name: 'Bangalore', displayName: 'Bangalore, Karnataka, India', type: 'city', country: 'India', state: 'Karnataka', flagEmoji: '🇮🇳', iataCode: 'BLR', popularity: 90, searchTerms: ['bangalore', 'bengaluru', 'blr'] },
  { name: 'Chennai', displayName: 'Chennai, Tamil Nadu, India', type: 'city', country: 'India', state: 'Tamil Nadu', flagEmoji: '🇮🇳', iataCode: 'MAA', popularity: 85, searchTerms: ['chennai', 'madras', 'maa'] },
  { name: 'Kolkata', displayName: 'Kolkata, West Bengal, India', type: 'city', country: 'India', state: 'West Bengal', flagEmoji: '🇮🇳', iataCode: 'CCU', popularity: 80, searchTerms: ['kolkata', 'calcutta', 'ccu'] },
  { name: 'Hyderabad', displayName: 'Hyderabad, Telangana, India', type: 'city', country: 'India', state: 'Telangana', flagEmoji: '🇮🇳', iataCode: 'HYD', popularity: 75, searchTerms: ['hyderabad', 'hyd'] },
  { name: 'Pune', displayName: 'Pune, Maharashtra, India', type: 'city', country: 'India', state: 'Maharashtra', flagEmoji: '🇮🇳', iataCode: 'PNQ', popularity: 70, searchTerms: ['pune', 'pnq'] },
  { name: 'Ahmedabad', displayName: 'Ahmedabad, Gujarat, India', type: 'city', country: 'India', state: 'Gujarat', flagEmoji: '🇮🇳', iataCode: 'AMD', popularity: 65, searchTerms: ['ahmedabad', 'amdavad', 'amd'] },
  { name: 'Jaipur', displayName: 'Jaipur, Rajasthan, India', type: 'city', country: 'India', state: 'Rajasthan', flagEmoji: '🇮🇳', iataCode: 'JAI', popularity: 60, searchTerms: ['jaipur', 'jai'] },
  { name: 'Goa', displayName: 'Goa, India', type: 'state', country: 'India', state: 'Goa', flagEmoji: '🇮🇳', iataCode: 'GOI', popularity: 85, searchTerms: ['goa', 'panaji', 'goi'] },
  
  // International Popular Destinations
  { name: 'Dubai', displayName: 'Dubai, UAE', type: 'city', country: 'United Arab Emirates', flagEmoji: '🇦🇪', iataCode: 'DXB', popularity: 95, searchTerms: ['dubai', 'dxb'] },
  { name: 'Singapore', displayName: 'Singapore', type: 'city', country: 'Singapore', flagEmoji: '🇸🇬', iataCode: 'SIN', popularity: 90, searchTerms: ['singapore', 'sin'] },
  { name: 'Bangkok', displayName: 'Bangkok, Thailand', type: 'city', country: 'Thailand', flagEmoji: '🇹🇭', iataCode: 'BKK', popularity: 85, searchTerms: ['bangkok', 'bkk'] },
  { name: 'London', displayName: 'London, United Kingdom', type: 'city', country: 'United Kingdom', flagEmoji: '🇬🇧', iataCode: 'LHR', popularity: 90, searchTerms: ['london', 'lhr', 'lgw'] },
  { name: 'New York', displayName: 'New York, USA', type: 'city', country: 'United States', flagEmoji: '🇺🇸', iataCode: 'JFK', popularity: 95, searchTerms: ['new york', 'nyc', 'jfk', 'lga'] },
  { name: 'Paris', displayName: 'Paris, France', type: 'city', country: 'France', flagEmoji: '🇫🇷', iataCode: 'CDG', popularity: 90, searchTerms: ['paris', 'cdg'] },
  { name: 'Tokyo', displayName: 'Tokyo, Japan', type: 'city', country: 'Japan', flagEmoji: '🇯🇵', iataCode: 'NRT', popularity: 85, searchTerms: ['tokyo', 'nrt', 'hnd'] },
  { name: 'Hong Kong', displayName: 'Hong Kong', type: 'city', country: 'Hong Kong', flagEmoji: '🇭🇰', iataCode: 'HKG', popularity: 80, searchTerms: ['hong kong', 'hkg'] }
];

// Major airports for search
export const majorAirports: Partial<LocationData>[] = [
  { name: 'Chhatrapati Shivaji International Airport', displayName: 'Mumbai Airport (BOM)', type: 'airport', iataCode: 'BOM', state: 'Maharashtra', country: 'India', flagEmoji: '🇮🇳' },
  { name: 'Indira Gandhi International Airport', displayName: 'Delhi Airport (DEL)', type: 'airport', iataCode: 'DEL', state: 'Delhi', country: 'India', flagEmoji: '🇮🇳' },
  { name: 'Kempegowda International Airport', displayName: 'Bangalore Airport (BLR)', type: 'airport', iataCode: 'BLR', state: 'Karnataka', country: 'India', flagEmoji: '🇮🇳' },
  { name: 'Dubai International Airport', displayName: 'Dubai Airport (DXB)', type: 'airport', iataCode: 'DXB', country: 'UAE', flagEmoji: '🇦🇪' },
  { name: 'Singapore Changi Airport', displayName: 'Singapore Airport (SIN)', type: 'airport', iataCode: 'SIN', country: 'Singapore', flagEmoji: '🇸🇬' }
];

// Railway stations (major Indian ones)
export const railwayStations: Partial<LocationData>[] = [
  { name: 'Chhatrapati Shivaji Terminus', displayName: 'Mumbai CST Railway Station', type: 'station', railwayCode: 'CSTM', state: 'Maharashtra', country: 'India', flagEmoji: '🇮🇳' },
  { name: 'New Delhi Railway Station', displayName: 'New Delhi Railway Station', type: 'station', railwayCode: 'NDLS', state: 'Delhi', country: 'India', flagEmoji: '🇮🇳' },
  { name: 'Howrah Junction', displayName: 'Howrah Railway Station', type: 'station', railwayCode: 'HWH', state: 'West Bengal', country: 'India', flagEmoji: '🇮🇳' },
  { name: 'Chennai Central', displayName: 'Chennai Central Railway Station', type: 'station', railwayCode: 'MAS', state: 'Tamil Nadu', country: 'India', flagEmoji: '🇮🇳' }
];

// Country data with flags
export const countries = [
  { name: 'India', code: 'IN', flagEmoji: '🇮🇳', searchTerms: ['india', 'in', 'bharat'] },
  { name: 'United States', code: 'US', flagEmoji: '🇺🇸', searchTerms: ['united states', 'usa', 'us', 'america'] },
  { name: 'United Kingdom', code: 'GB', flagEmoji: '🇬🇧', searchTerms: ['united kingdom', 'uk', 'gb', 'britain', 'england'] },
  { name: 'United Arab Emirates', code: 'AE', flagEmoji: '🇦🇪', searchTerms: ['uae', 'emirates', 'ae'] },
  { name: 'Singapore', code: 'SG', flagEmoji: '🇸🇬', searchTerms: ['singapore', 'sg'] },
  { name: 'Thailand', code: 'TH', flagEmoji: '🇹🇭', searchTerms: ['thailand', 'th'] },
  { name: 'France', code: 'FR', flagEmoji: '🇫🇷', searchTerms: ['france', 'fr'] },
  { name: 'Germany', code: 'DE', flagEmoji: '🇩🇪', searchTerms: ['germany', 'de', 'deutschland'] },
  { name: 'Japan', code: 'JP', flagEmoji: '🇯🇵', searchTerms: ['japan', 'jp', 'nippon'] },
  { name: 'Australia', code: 'AU', flagEmoji: '🇦🇺', searchTerms: ['australia', 'au'] },
  { name: 'Canada', code: 'CA', flagEmoji: '🇨🇦', searchTerms: ['canada', 'ca'] },
  { name: 'China', code: 'CN', flagEmoji: '🇨🇳', searchTerms: ['china', 'cn'] },
  { name: 'Hong Kong', code: 'HK', flagEmoji: '🇭🇰', searchTerms: ['hong kong', 'hk'] },
  { name: 'Malaysia', code: 'MY', flagEmoji: '🇲🇾', searchTerms: ['malaysia', 'my'] },
  { name: 'Indonesia', code: 'ID', flagEmoji: '🇮🇩', searchTerms: ['indonesia', 'id'] },
  { name: 'South Korea', code: 'KR', flagEmoji: '🇰🇷', searchTerms: ['south korea', 'korea', 'kr'] }
];

// Fuzzy search function
export const fuzzySearch = (query: string, locations: LocationData[], limit: number = 10): LocationData[] => {
  if (!query || query.length < 2) return [];
  
  const queryLower = query.toLowerCase();
  const scores: Array<{ location: LocationData; score: number }> = [];
  
  locations.forEach(location => {
    let score = 0;
    
    // Exact name match (highest priority)
    if (location.name.toLowerCase() === queryLower) {
      score += 100;
    }
    // Name starts with query
    else if (location.name.toLowerCase().startsWith(queryLower)) {
      score += 80;
    }
    // Name contains query
    else if (location.name.toLowerCase().includes(queryLower)) {
      score += 60;
    }
    
    // Search terms match
    location.searchTerms.forEach(term => {
      if (term === queryLower) score += 90;
      else if (term.startsWith(queryLower)) score += 70;
      else if (term.includes(queryLower)) score += 50;
    });
    
    // IATA code match
    if (location.iataCode && location.iataCode.toLowerCase() === queryLower) {
      score += 95;
    }
    
    // Apply popularity boost
    if (location.popularity) {
      score += location.popularity * 0.1;
    }
    
    if (score > 0) {
      scores.push({ location, score });
    }
  });
  
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.location);
};

// Group results by type
export const groupLocationResults = (locations: LocationData[]) => {
  return {
    countries: locations.filter(l => l.type === 'country'),
    states: locations.filter(l => l.type === 'state'),
    cities: locations.filter(l => l.type === 'city'),
    airports: locations.filter(l => l.type === 'airport'),
    stations: locations.filter(l => l.type === 'station'),
    landmarks: locations.filter(l => l.type === 'landmark')
  };
};

// Combine all location data
export const getAllLocations = (): LocationData[] => {
  // This would typically be loaded from a database or API
  // For now, return the popular destinations as a starting point
  return popularDestinations.map((dest, index) => ({
    id: `location-${index}`,
    displayName: dest.displayName || dest.name || '',
    coordinates: [0, 0], // Default coordinates
    timezone: 'UTC',
    countryCode: dest.country === 'India' ? 'IN' : 'US',
    searchTerms: dest.searchTerms || [],
    ...dest
  } as LocationData));
};

// Search function using fuzzy search
export const searchLocations = async (query: string, maxResults: number = 8): Promise<LocationData[]> => {
  const allLocations = getAllLocations();
  return fuzzySearch(query, allLocations, maxResults);
};

// Format location for display
export const formatLocationDisplay = (location: LocationData): string => {
  return location.displayName || `${location.name}${location.state ? `, ${location.state}` : ''}, ${location.country}`;
};

// Get city and state info
export const getCityState = (location: LocationData): string => {
  return `${location.state ? `${location.state}, ` : ''}${location.country}`;
};

export default {
  getAllLocations,
  fuzzySearch,
  groupLocationResults,
  searchLocations,
  formatLocationDisplay,
  getCityState,
  indianStates,
  popularDestinations,
  majorAirports,
  railwayStations,
  countries
};