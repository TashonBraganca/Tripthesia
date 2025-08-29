"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Train, Car, Clock, MapPin, Star, ArrowRight, Filter, SlidersHorizontal, ExternalLink } from 'lucide-react';

interface TransportOption {
  id: string;
  type: 'flight' | 'train' | 'bus';
  provider: string;
  airline?: string;
  flightNumber?: string;
  trainNumber?: string;
  price: number;
  currency: string;
  duration: string;
  departure: {
    time: string;
    airport: string;
    city: string;
  };
  arrival: {
    time: string;
    airport: string;
    city: string;
  };
  stops?: number;
  rating?: number;
  bookingLink?: string;
  baggage?: {
    carry: boolean;
    checked: boolean;
  };
  amenities?: string[];
  score: number;
  co2Emissions?: number;
  comfort?: string;
}

interface TransportSearchResultsProps {
  searchParams: {
    from: string;
    to: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    currency: string;
  };
  onSelectTransport: (option: TransportOption) => void;
  selectedTransport?: TransportOption | null;
}

export default function TransportSearchResults({
  searchParams,
  onSelectTransport,
  selectedTransport
}: TransportSearchResultsProps) {
  const [loading, setLoading] = useState(false);
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([]);
  const [filters, setFilters] = useState({
    transportTypes: ['flight', 'train', 'bus'],
    maxPrice: 2000,
    maxDuration: 24,
    stops: 'any', // 'direct', 'any'
    departure: 'any', // 'morning', 'afternoon', 'evening', 'any'
  });
  const [sortBy, setSortBy] = useState('price'); // 'price', 'duration', 'departure', 'rating'
  const [showFilters, setShowFilters] = useState(false);

  // Search for all transport options
  const searchAllTransport = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        searchFlights(),
        searchTrains(),
        searchBuses(),
      ]);

      const allOptions: TransportOption[] = [];
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          allOptions.push(...result.value);
        }
      });

      // Sort by score initially (best overall options)
      allOptions.sort((a, b) => b.score - a.score);
      setTransportOptions(allOptions);
    } catch (error) {
      console.error('Transport search error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Flight search using existing API
  const searchFlights = async (): Promise<TransportOption[]> => {
    try {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        throw new Error('Flight search failed');
      }

      const data = await response.json();
      return data.flights || [];
    } catch (error) {
      console.error('Flight search error:', error);
      return [];
    }
  };

  // Mock train search (can be replaced with real API)
  const searchTrains = async (): Promise<TransportOption[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock train data for European/Asian routes primarily
    const isLongDistance = calculateDistance(searchParams.from, searchParams.to) > 500;
    
    if (!isLongDistance) {
      return []; // No trains for very long distances
    }

    const trainOptions: TransportOption[] = [
      {
        id: 'train-1',
        type: 'train',
        provider: 'Eurail Express',
        trainNumber: 'ER-2847',
        price: Math.floor(Math.random() * 150) + 80,
        currency: searchParams.currency,
        duration: `${Math.floor(Math.random() * 6) + 4}h ${Math.floor(Math.random() * 60)}m`,
        departure: {
          time: '08:30 AM',
          airport: 'Central Station',
          city: searchParams.from,
        },
        arrival: {
          time: '14:15 PM',
          airport: 'Central Station',
          city: searchParams.to,
        },
        stops: Math.floor(Math.random() * 3),
        rating: 4.2 + Math.random() * 0.8,
        bookingLink: 'https://eurail.com',
        amenities: ['WiFi', 'Power Outlet', 'Cafe Car'],
        score: 7 + Math.random() * 2,
        co2Emissions: 25,
        comfort: 'Standard'
      },
      {
        id: 'train-2',
        type: 'train',
        provider: 'High Speed Rail',
        trainNumber: 'HSR-1205',
        price: Math.floor(Math.random() * 200) + 120,
        currency: searchParams.currency,
        duration: `${Math.floor(Math.random() * 4) + 2}h ${Math.floor(Math.random() * 60)}m`,
        departure: {
          time: '12:45 PM',
          airport: 'Main Station',
          city: searchParams.from,
        },
        arrival: {
          time: '16:30 PM',
          airport: 'Main Station',
          city: searchParams.to,
        },
        stops: 1,
        rating: 4.6 + Math.random() * 0.4,
        bookingLink: 'https://raileurope.com',
        amenities: ['WiFi', 'Power Outlet', 'Restaurant', 'First Class'],
        score: 8 + Math.random() * 1.5,
        co2Emissions: 18,
        comfort: 'Premium'
      }
    ];

    return trainOptions;
  };

  // Mock bus search
  const searchBuses = async (): Promise<TransportOption[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const busOptions: TransportOption[] = [
      {
        id: 'bus-1',
        type: 'bus',
        provider: 'FlixBus',
        price: Math.floor(Math.random() * 60) + 25,
        currency: searchParams.currency,
        duration: `${Math.floor(Math.random() * 8) + 6}h ${Math.floor(Math.random() * 60)}m`,
        departure: {
          time: '07:00 AM',
          airport: 'Bus Terminal',
          city: searchParams.from,
        },
        arrival: {
          time: '15:30 PM',
          airport: 'Bus Terminal',
          city: searchParams.to,
        },
        stops: Math.floor(Math.random() * 4) + 1,
        rating: 3.8 + Math.random() * 1.2,
        bookingLink: 'https://flixbus.com',
        amenities: ['WiFi', 'Power Outlet', 'Air Conditioning'],
        score: 6 + Math.random() * 2,
        co2Emissions: 35,
        comfort: 'Standard'
      },
      {
        id: 'bus-2',
        type: 'bus',
        provider: 'MegaBus Premium',
        price: Math.floor(Math.random() * 80) + 45,
        currency: searchParams.currency,
        duration: `${Math.floor(Math.random() * 7) + 5}h ${Math.floor(Math.random() * 60)}m`,
        departure: {
          time: '14:15 PM',
          airport: 'Central Bus Station',
          city: searchParams.from,
        },
        arrival: {
          time: '21:45 PM',
          airport: 'Central Bus Station',
          city: searchParams.to,
        },
        stops: 2,
        rating: 4.1 + Math.random() * 0.9,
        bookingLink: 'https://megabus.com',
        amenities: ['WiFi', 'Power Outlet', 'Reclining Seats', 'Snacks'],
        score: 7 + Math.random() * 1.5,
        co2Emissions: 28,
        comfort: 'Premium'
      }
    ];

    return busOptions;
  };

  // Helper function to calculate approximate distance
  const calculateDistance = (from: string, to: string): number => {
    // Mock distance calculation - in real app, use geocoding
    return Math.random() * 3000 + 200;
  };

  // Filter and sort transport options
  const filteredOptions = transportOptions
    .filter(option => {
      // Filter by transport type
      if (!filters.transportTypes.includes(option.type)) return false;
      
      // Filter by price
      if (option.price > filters.maxPrice) return false;
      
      // Filter by stops
      if (filters.stops === 'direct' && option.stops && option.stops > 0) return false;
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'duration':
          const getDurationMinutes = (duration: string) => {
            const match = duration.match(/(\d+)h (\d+)m/);
            if (match) {
              return parseInt(match[1]) * 60 + parseInt(match[2]);
            }
            return 0;
          };
          return getDurationMinutes(a.duration) - getDurationMinutes(b.duration);
        case 'departure':
          return a.departure.time.localeCompare(b.departure.time);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return b.score - a.score;
      }
    });

  // Initialize search on mount
  useEffect(() => {
    if (searchParams.from && searchParams.to) {
      searchAllTransport();
    }
  }, [searchParams, searchAllTransport]);

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane className="h-5 w-5" />;
      case 'train':
        return <Train className="h-5 w-5" />;
      case 'bus':
        return <Car className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  const getTransportColor = (type: string) => {
    switch (type) {
      case 'flight':
        return 'blue';
      case 'train':
        return 'green';
      case 'bus':
        return 'purple';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="flex items-center justify-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <motion.div
            className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-gray-600 mt-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Searching flights, trains, and buses...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <motion.div 
        className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {searchParams.from} → {searchParams.to}
            </h3>
            <p className="text-sm text-gray-600">
              {new Date(searchParams.departureDate).toLocaleDateString()} • {searchParams.adults} traveler(s)
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600">{filteredOptions.length}</p>
            <p className="text-sm text-gray-600">options found</p>
          </div>
        </div>
      </motion.div>

      {/* Filters and Sort */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
          </motion.button>
          
          {/* Transport type quick filters */}
          <div className="flex space-x-2">
            {['flight', 'train', 'bus'].map(type => (
              <motion.button
                key={type}
                onClick={() => {
                  const newTypes = filters.transportTypes.includes(type)
                    ? filters.transportTypes.filter(t => t !== type)
                    : [...filters.transportTypes, type];
                  setFilters({ ...filters, transportTypes: newTypes });
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filters.transportTypes.includes(type)
                    ? `bg-${getTransportColor(type)}-100 text-${getTransportColor(type)}-700 border border-${getTransportColor(type)}-300`
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center space-x-1">
                  {getTransportIcon(type)}
                  <span className="capitalize">{type}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="price">Price</option>
            <option value="duration">Duration</option>
            <option value="departure">Departure Time</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </motion.div>

      {/* Extended Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="bg-white rounded-xl border border-gray-200 p-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price: ${filters.maxPrice}
                </label>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stops</label>
                <select
                  value={filters.stops}
                  onChange={(e) => setFilters({ ...filters, stops: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="any">Any number of stops</option>
                  <option value="direct">Direct only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
                <select
                  value={filters.departure}
                  onChange={(e) => setFilters({ ...filters, departure: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="any">Any time</option>
                  <option value="morning">Morning (6AM-12PM)</option>
                  <option value="afternoon">Afternoon (12PM-6PM)</option>
                  <option value="evening">Evening (6PM-12AM)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transport Options */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AnimatePresence>
          {filteredOptions.map((option, index) => (
            <TransportOptionCard
              key={option.id}
              option={option}
              index={index}
              isSelected={selectedTransport?.id === option.id}
              onSelect={() => onSelectTransport(option)}
            />
          ))}
        </AnimatePresence>
        
        {filteredOptions.length === 0 && !loading && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transport options found</h3>
            <p className="text-gray-600">Try adjusting your filters or search parameters</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// Individual transport option card component
function TransportOptionCard({ 
  option, 
  index, 
  isSelected, 
  onSelect 
}: {
  option: TransportOption;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const color = option.type === 'flight' ? 'blue' : option.type === 'train' ? 'green' : 'purple';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={onSelect}
      className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg group ${
        isSelected
          ? `border-${color}-500 bg-gradient-to-r from-${color}-50 to-${color}-50 shadow-md`
          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
      }`}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className={`absolute top-4 right-4 w-6 h-6 bg-${color}-500 rounded-full flex items-center justify-center`}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
        >
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Transport Icon */}
          <motion.div 
            className={`p-3 rounded-xl bg-${color}-100 text-${color}-600`}
            whileHover={{ scale: 1.1, rotate: option.type === 'flight' ? [0, -5, 5, 0] : 0 }}
            transition={{ duration: 0.3 }}
          >
            {option.type === 'flight' ? (
              <Plane className="h-6 w-6" />
            ) : option.type === 'train' ? (
              <Train className="h-6 w-6" />
            ) : (
              <Car className="h-6 w-6" />
            )}
          </motion.div>
          
          {/* Transport Details */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900 text-lg">
                {option.provider}
              </h4>
              {option.flightNumber && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {option.flightNumber}
                </span>
              )}
              {option.trainNumber && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {option.trainNumber}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{option.departure.time}</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{option.arrival.time}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{option.duration}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{option.departure.airport} → {option.arrival.airport}</span>
              
              {option.stops !== undefined && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  option.stops === 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {option.stops === 0 ? 'Direct' : `${option.stops} stop(s)`}
                </span>
              )}
              
              {option.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span>{option.rating.toFixed(1)}</span>
                </div>
              )}
              
              {option.co2Emissions && (
                <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs">
                  {option.co2Emissions}kg CO₂
                </span>
              )}
            </div>
            
            {/* Amenities */}
            {option.amenities && option.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {option.amenities.map((amenity, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {amenity}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Price and Booking */}
        <div className="text-right ml-4">
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">
              ${option.price}
            </p>
            <p className="text-sm text-gray-500">per person</p>
          </div>
          
          <motion.button
            className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 flex items-center space-x-1 ${
              isSelected
                ? `bg-${color}-600 text-white shadow-md`
                : `bg-gray-100 text-gray-700 hover:bg-${color}-100 hover:text-${color}-700`
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              if (option.bookingLink) {
                window.open(option.bookingLink, '_blank');
              }
            }}
          >
            <span>{isSelected ? 'Selected' : 'Select'}</span>
            {option.bookingLink && <ExternalLink className="h-3 w-3" />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}