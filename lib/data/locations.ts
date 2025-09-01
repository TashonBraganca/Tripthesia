/**
 * Advanced Location Intelligence System
 * Enhanced with global database, geolocation, and smart search
 * Supports countries, states, cities, airports, train stations, and landmarks
 */

import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';
import Fuse from 'fuse.js';

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

// Enhanced country flag mapping
const countryFlags: Record<string, string> = {
  IN: '🇮🇳', US: '🇺🇸', GB: '🇬🇧', AE: '🇦🇪', SG: '🇸🇬', TH: '🇹🇭', FR: '🇫🇷', DE: '🇩🇪',
  JP: '🇯🇵', AU: '🇦🇺', CA: '🇨🇦', CN: '🇨🇳', HK: '🇭🇰', MY: '🇲🇾', ID: '🇮🇩', KR: '🇰🇷',
  BR: '🇧🇷', AR: '🇦🇷', MX: '🇲🇽', IT: '🇮🇹', ES: '🇪🇸', NL: '🇳🇱', CH: '🇨🇭', AT: '🇦🇹',
  BE: '🇧🇪', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮', IE: '🇮🇪', PT: '🇵🇹', GR: '🇬🇷',
  TR: '🇹🇷', IL: '🇮🇱', SA: '🇸🇦', EG: '🇪🇬', ZA: '🇿🇦', KE: '🇰🇪', NG: '🇳🇬', MA: '🇲🇦',
  TN: '🇹🇳', JO: '🇯🇴', LB: '🇱🇧', PH: '🇵🇭', VN: '🇻🇳', BD: '🇧🇩', LK: '🇱🇰', NP: '🇳🇵',
  MM: '🇲🇲', KH: '🇰🇭', LA: '🇱🇦', MN: '🇲🇳', KZ: '🇰🇿', UZ: '🇺🇿', IR: '🇮🇷', PK: '🇵🇰',
  AF: '🇦🇫', RU: '🇷🇺', UA: '🇺🇦', PL: '🇵🇱', CZ: '🇨🇿', SK: '🇸🇰', HU: '🇭🇺', RO: '🇷🇴',
  BG: '🇧🇬', HR: '🇭🇷', SI: '🇸🇮', BA: '🇧🇦', RS: '🇷🇸', ME: '🇲🇪', MK: '🇲🇰', AL: '🇦🇱',
  XK: '🇽🇰', MD: '🇲🇩', BY: '🇧🇾', LT: '🇱🇹', LV: '🇱🇻', EE: '🇪🇪', IS: '🇮🇸', MT: '🇲🇹',
  CY: '🇨🇾', LU: '🇱🇺', LI: '🇱🇮', AD: '🇦🇩', MC: '🇲🇨', SM: '🇸🇲', VA: '🇻🇦', NZ: '🇳🇿',
  FJ: '🇫🇯', PG: '🇵🇬', NC: '🇳🇨', PF: '🇵🇫', CK: '🇨🇰', TO: '🇹🇴', WS: '🇼🇸', VU: '🇻🇺',
  SB: '🇸🇧', TV: '🇹🇻', NR: '🇳🇷', KI: '🇰🇮', PW: '🇵🇼', MH: '🇲🇭', FM: '🇫🇲', GU: '🇬🇺',
  MP: '🇲🇵', AS: '🇦🇸', CL: '🇨🇱', PE: '🇵🇪', EC: '🇪🇨', CO: '🇨🇴', VE: '🇻🇪', GY: '🇬🇾',
  SR: '🇸🇷', UY: '🇺🇾', PY: '🇵🇾', BO: '🇧🇴', CR: '🇨🇷', PA: '🇵🇦', NI: '🇳🇮', HN: '🇭🇳',
  GT: '🇬🇹', BZ: '🇧🇿', SV: '🇸🇻', CU: '🇨🇺', JM: '🇯🇲', HT: '🇭🇹', DO: '🇩🇴', BS: '🇧🇸',
  BB: '🇧🇧', AG: '🇦🇬', DM: '🇩🇲', KN: '🇰🇳', LC: '🇱🇨', VC: '🇻🇨', GD: '🇬🇩', TT: '🇹🇹'
};

// Get country flag emoji
const getCountryFlag = (countryCode: string): string => {
  return countryFlags[countryCode.toUpperCase()] || '🌍';
};

// Enhanced fuzzy search using Fuse.js
let fuseInstance: Fuse<LocationData> | null = null;

const getFuseInstance = (): Fuse<LocationData> => {
  if (!fuseInstance) {
    const locations = getAllLocations();
    fuseInstance = new Fuse(locations, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'displayName', weight: 0.3 },
        { name: 'searchTerms', weight: 0.2 },
        { name: 'iataCode', weight: 0.05 },
        { name: 'railwayCode', weight: 0.03 },
        { name: 'country', weight: 0.02 }
      ],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      shouldSort: true
    });
  }
  return fuseInstance;
};

// Advanced fuzzy search with multiple strategies
export const fuzzySearch = (query: string, locations: LocationData[], limit: number = 10): LocationData[] => {
  if (!query || query.length < 2) return [];
  
  const fuse = getFuseInstance();
  const fuseResults = fuse.search(query, { limit: limit * 2 });
  
  // Convert Fuse results and apply additional scoring
  const scoredResults = fuseResults.map(result => {
    let bonusScore = 0;
    const location = result.item;
    const queryLower = query.toLowerCase();
    
    // Popularity bonus
    if (location.popularity) {
      bonusScore += location.popularity * 0.001;
    }
    
    // Type priority bonus (cities > states > countries)
    switch (location.type) {
      case 'city': bonusScore += 0.1; break;
      case 'airport': bonusScore += 0.08; break;
      case 'state': bonusScore += 0.05; break;
      case 'country': bonusScore += 0.02; break;
    }
    
    // Exact match bonus
    if (location.name.toLowerCase() === queryLower) {
      bonusScore += 0.2;
    }
    
    // IATA code exact match
    if (location.iataCode?.toLowerCase() === queryLower) {
      bonusScore += 0.15;
    }
    
    return {
      location,
      score: (result.score || 1) - bonusScore // Lower score is better in Fuse.js
    };
  });
  
  return scoredResults
    .sort((a, b) => a.score - b.score)
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

// Build comprehensive location database
let globalLocationCache: LocationData[] | null = null;

export const buildGlobalLocationDatabase = (): LocationData[] => {
  if (globalLocationCache) return globalLocationCache;
  
  const locations: LocationData[] = [];
  
  // Add countries
  Country.getAllCountries().forEach((country: ICountry, index) => {
    locations.push({
      id: `country-${country.isoCode}`,
      name: country.name,
      displayName: `${country.name} ${getCountryFlag(country.isoCode)}`,
      type: 'country',
      country: country.name,
      countryCode: country.isoCode,
      coordinates: [parseFloat(country.longitude || '0'), parseFloat(country.latitude || '0')],
      timezone: country.timezones?.[0]?.zoneName || 'UTC',
      flagEmoji: getCountryFlag(country.isoCode),
      searchTerms: [country.name.toLowerCase(), country.isoCode.toLowerCase()],
      popularity: country.name === 'India' ? 100 : country.name === 'United States' ? 95 : 50
    });
  });
  
  // Add states for major countries
  const majorCountries = ['IN', 'US', 'CA', 'AU', 'BR', 'DE', 'FR', 'IT', 'ES', 'GB'];
  majorCountries.forEach(countryCode => {
    const states = State.getStatesOfCountry(countryCode);
    states.forEach((state: IState) => {
      const country = Country.getCountryByCode(countryCode);
      if (country) {
        locations.push({
          id: `state-${countryCode}-${state.isoCode}`,
          name: state.name,
          displayName: `${state.name}, ${country.name} ${getCountryFlag(countryCode)}`,
          type: 'state',
          country: country.name,
          countryCode: countryCode,
          state: state.name,
          stateCode: state.isoCode,
          coordinates: [parseFloat(state.longitude || '0'), parseFloat(state.latitude || '0')],
          timezone: 'UTC',
          flagEmoji: getCountryFlag(countryCode),
          searchTerms: [state.name.toLowerCase(), state.isoCode?.toLowerCase()].filter(Boolean),
          popularity: countryCode === 'IN' ? 80 : 40
        });
      }
    });
  });
  
  // Add major cities (population > 500k)
  const majorCities = [
    // Indian cities
    { name: 'Mumbai', state: 'Maharashtra', country: 'IN', iata: 'BOM', pop: 20411274 },
    { name: 'Delhi', state: 'Delhi', country: 'IN', iata: 'DEL', pop: 28514000 },
    { name: 'Bangalore', state: 'Karnataka', country: 'IN', iata: 'BLR', pop: 8443675 },
    { name: 'Chennai', state: 'Tamil Nadu', country: 'IN', iata: 'MAA', pop: 7088000 },
    { name: 'Kolkata', state: 'West Bengal', country: 'IN', iata: 'CCU', pop: 4631392 },
    { name: 'Hyderabad', state: 'Telangana', country: 'IN', iata: 'HYD', pop: 6993262 },
    { name: 'Pune', state: 'Maharashtra', country: 'IN', iata: 'PNQ', pop: 3124458 },
    { name: 'Ahmedabad', state: 'Gujarat', country: 'IN', iata: 'AMD', pop: 5570585 },
    { name: 'Jaipur', state: 'Rajasthan', country: 'IN', iata: 'JAI', pop: 3046163 },
    { name: 'Lucknow', state: 'Uttar Pradesh', country: 'IN', iata: 'LKO', pop: 2817105 },
    { name: 'Kanpur', state: 'Uttar Pradesh', country: 'IN', pop: 2767031 },
    { name: 'Nagpur', state: 'Maharashtra', country: 'IN', iata: 'NAG', pop: 2405421 },
    { name: 'Indore', state: 'Madhya Pradesh', country: 'IN', iata: 'IDR', pop: 1994397 },
    { name: 'Bhopal', state: 'Madhya Pradesh', country: 'IN', iata: 'BHO', pop: 1798218 },
    { name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'IN', iata: 'VTZ', pop: 1730320 },
    { name: 'Kochi', state: 'Kerala', country: 'IN', iata: 'COK', pop: 677381 },
    { name: 'Coimbatore', state: 'Tamil Nadu', country: 'IN', iata: 'CJB', pop: 1061447 },
    { name: 'Goa', state: 'Goa', country: 'IN', iata: 'GOI', pop: 1458545 },
    
    // International cities
    { name: 'New York', state: 'New York', country: 'US', iata: 'JFK', pop: 8336817 },
    { name: 'London', state: 'England', country: 'GB', iata: 'LHR', pop: 8982000 },
    { name: 'Dubai', state: 'Dubai', country: 'AE', iata: 'DXB', pop: 3331420 },
    { name: 'Singapore', state: '', country: 'SG', iata: 'SIN', pop: 5850342 },
    { name: 'Bangkok', state: '', country: 'TH', iata: 'BKK', pop: 8305218 },
    { name: 'Tokyo', state: 'Tokyo', country: 'JP', iata: 'NRT', pop: 13929286 },
    { name: 'Paris', state: 'Île-de-France', country: 'FR', iata: 'CDG', pop: 2161000 },
    { name: 'Hong Kong', state: '', country: 'HK', iata: 'HKG', pop: 7496981 },
    { name: 'Los Angeles', state: 'California', country: 'US', iata: 'LAX', pop: 3898747 },
    { name: 'Sydney', state: 'New South Wales', country: 'AU', iata: 'SYD', pop: 5312163 },
    { name: 'Toronto', state: 'Ontario', country: 'CA', iata: 'YYZ', pop: 2731571 }
  ];
  
  majorCities.forEach((city, index) => {
    const country = Country.getCountryByCode(city.country);
    if (country) {
      const searchTerms = [city.name.toLowerCase()];
      if (city.iata) searchTerms.push(city.iata.toLowerCase());
      
      locations.push({
        id: `city-${city.country}-${city.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: city.name,
        displayName: `${city.name}${city.state ? `, ${city.state}` : ''}, ${country.name} ${getCountryFlag(city.country)}`,
        type: 'city',
        country: country.name,
        countryCode: city.country,
        state: city.state || undefined,
        coordinates: [0, 0], // Would be populated from actual data
        timezone: 'UTC',
        population: city.pop,
        iataCode: city.iata,
        flagEmoji: getCountryFlag(city.country),
        searchTerms,
        popularity: Math.min(100, Math.floor(city.pop / 100000))
      });
    }
  });
  
  // Add popular destinations from existing data
  popularDestinations.forEach((dest, index) => {
    if (!locations.some(l => l.name.toLowerCase() === dest.name?.toLowerCase())) {
      locations.push({
        id: `popular-${index}`,
        displayName: dest.displayName || dest.name || '',
        coordinates: [0, 0],
        timezone: 'UTC',
        countryCode: dest.country === 'India' ? 'IN' : 'US',
        searchTerms: dest.searchTerms || [],
        ...dest
      } as LocationData);
    }
  });
  
  // Add airports and railway stations
  [...majorAirports, ...railwayStations].forEach((transport, index) => {
    locations.push({
      id: `transport-${index}`,
      displayName: transport.displayName || transport.name || '',
      coordinates: [0, 0],
      timezone: 'UTC',
      countryCode: transport.country === 'India' ? 'IN' : transport.country === 'UAE' ? 'AE' : 'US',
      searchTerms: transport.searchTerms || [],
      ...transport
    } as LocationData);
  });
  
  globalLocationCache = locations;
  return locations;
};

// Get all locations (cached)
export const getAllLocations = (): LocationData[] => {
  return buildGlobalLocationDatabase();
};

// Enhanced search with geolocation and smart suggestions
export const searchLocations = async (query: string, maxResults: number = 8, userLocation?: GeolocationPosition): Promise<LocationData[]> => {
  const allLocations = getAllLocations();
  
  // If query is empty, return popular destinations or nearby locations
  if (!query || query.length < 2) {
    if (userLocation) {
      return getNearbyLocations(userLocation, maxResults);
    }
    return allLocations
      .filter(l => l.popularity && l.popularity > 70)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, maxResults);
  }
  
  const results = fuzzySearch(query, allLocations, maxResults);
  
  // Add "Current Location" option if geolocation is available
  if (userLocation && query.toLowerCase().includes('current')) {
    const currentLocationOption: LocationData = {
      id: 'current-location',
      name: 'Current Location',
      displayName: 'Use Current Location 📍',
      type: 'city',
      country: 'Unknown',
      countryCode: 'XX',
      coordinates: [userLocation.coords.longitude, userLocation.coords.latitude],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      flagEmoji: '📍',
      searchTerms: ['current', 'location', 'here', 'my location'],
      popularity: 100
    };
    results.unshift(currentLocationOption);
  }
  
  return results;
};

// Get nearby locations based on user's current position
export const getNearbyLocations = (userLocation: GeolocationPosition, maxResults: number = 8): LocationData[] => {
  const allLocations = getAllLocations();
  const userLat = userLocation.coords.latitude;
  const userLon = userLocation.coords.longitude;
  
  // Calculate distance and sort by proximity
  const locationsWithDistance = allLocations
    .map(location => {
      const [lon, lat] = location.coordinates;
      const distance = calculateDistance(userLat, userLon, lat, lon);
      return { location, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults)
    .map(item => item.location);
  
  return locationsWithDistance;
};

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Geolocation utilities
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

// Get location suggestions based on IP (fallback for geolocation)
export const getLocationFromIP = async (): Promise<LocationData | null> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.city && data.country_code) {
      return {
        id: 'ip-location',
        name: data.city,
        displayName: `${data.city}, ${data.region}, ${data.country_name} ${getCountryFlag(data.country_code)}`,
        type: 'city',
        country: data.country_name,
        countryCode: data.country_code,
        state: data.region,
        coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
        timezone: data.timezone,
        flagEmoji: getCountryFlag(data.country_code),
        searchTerms: [data.city.toLowerCase(), data.region?.toLowerCase()].filter(Boolean),
        popularity: 50
      };
    }
  } catch (error) {
    console.warn('Could not get location from IP:', error);
  }
  return null;
};

// Format location for display
export const formatLocationDisplay = (location: LocationData): string => {
  return location.displayName || `${location.name}${location.state ? `, ${location.state}` : ''}, ${location.country}`;
};

// Get city and state info
export const getCityState = (location: LocationData): string => {
  return `${location.state ? `${location.state}, ` : ''}${location.country}`;
};

const locationUtils = {
  getAllLocations,
  buildGlobalLocationDatabase,
  fuzzySearch,
  groupLocationResults,
  searchLocations,
  getNearbyLocations,
  getCurrentLocation,
  getLocationFromIP,
  formatLocationDisplay,
  getCityState,
  calculateDistance: calculateDistance,
  indianStates,
  popularDestinations,
  majorAirports,
  railwayStations
};

export default locationUtils;