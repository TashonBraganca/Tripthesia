"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, MapPin, Navigation, Smartphone, Clock, DollarSign, Users, Star } from 'lucide-react';

interface LocalTransportProps {
  destination: string;
  onSelectOption?: (option: LocalTransportOption) => void;
}

interface LocalTransportOption {
  id: string;
  type: 'rental' | 'rideshare' | 'taxi' | 'public' | 'bike' | 'walk';
  name: string;
  provider: string;
  price: number;
  currency: string;
  duration?: string;
  description: string;
  availability: 'available' | 'limited' | 'unavailable';
  rating?: number;
  bookingUrl?: string;
  features: string[];
  icon: string;
}

export default function LocalTransportOptions({ destination, onSelectOption }: LocalTransportProps) {
  const [localOptions, setLocalOptions] = useState<LocalTransportOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Options', icon: '🚗' },
    { id: 'rental', name: 'Car Rental', icon: '🚗' },
    { id: 'rideshare', name: 'Ride Share', icon: '📱' },
    { id: 'public', name: 'Public Transit', icon: '🚌' },
    { id: 'active', name: 'Active Travel', icon: '🚶‍♂️' },
  ];

  useEffect(() => {
    loadLocalTransportOptions();
  }, [destination]);

  const loadLocalTransportOptions = async () => {
    setLoading(true);
    
    // Simulate API call - replace with real local transport API
    await new Promise(resolve => setTimeout(resolve, 1000));

    const options: LocalTransportOption[] = [
      // Car Rental Options
      {
        id: 'rental-1',
        type: 'rental',
        name: 'Economy Car',
        provider: 'Hertz',
        price: 35,
        currency: 'USD',
        duration: 'per day',
        description: 'Compact car perfect for city driving',
        availability: 'available',
        rating: 4.2,
        bookingUrl: 'https://hertz.com',
        features: ['GPS Navigation', 'Air Conditioning', 'Automatic'],
        icon: '🚗'
      },
      {
        id: 'rental-2',
        type: 'rental',
        name: 'SUV',
        provider: 'Enterprise',
        price: 65,
        currency: 'USD',
        duration: 'per day',
        description: 'Spacious SUV for families or groups',
        availability: 'available',
        rating: 4.5,
        bookingUrl: 'https://enterprise.com',
        features: ['GPS Navigation', '7 Seats', 'All-Wheel Drive', 'Luggage Space'],
        icon: '🚙'
      },
      
      // Rideshare Options
      {
        id: 'rideshare-1',
        type: 'rideshare',
        name: 'Uber Standard',
        provider: 'Uber',
        price: 12,
        currency: 'USD',
        duration: '15 min wait',
        description: 'Standard ride for up to 4 people',
        availability: 'available',
        rating: 4.3,
        bookingUrl: 'https://uber.com',
        features: ['4 Seats', 'Real-time Tracking', 'Cashless Payment'],
        icon: '🚗'
      },
      {
        id: 'rideshare-2',
        type: 'rideshare',
        name: 'Lyft Premium',
        provider: 'Lyft',
        price: 18,
        currency: 'USD',
        duration: '8 min wait',
        description: 'Premium rides with top-rated drivers',
        availability: 'available',
        rating: 4.6,
        bookingUrl: 'https://lyft.com',
        features: ['Luxury Vehicle', 'Professional Driver', 'WiFi'],
        icon: '🚙'
      },
      
      // Public Transport
      {
        id: 'public-1',
        type: 'public',
        name: 'Metro/Subway',
        provider: 'City Transit',
        price: 2.5,
        currency: 'USD',
        duration: 'per trip',
        description: 'Fast underground rail system',
        availability: 'available',
        rating: 4.0,
        features: ['Fast', 'Frequent', 'City-wide Coverage'],
        icon: '🚇'
      },
      {
        id: 'public-2',
        type: 'public',
        name: 'City Bus',
        provider: 'City Transit',
        price: 1.5,
        currency: 'USD',
        duration: 'per trip',
        description: 'Comprehensive bus network',
        availability: 'available',
        rating: 3.8,
        features: ['Affordable', 'Extensive Routes', 'Regular Schedule'],
        icon: '🚌'
      },
      
      // Active Travel
      {
        id: 'bike-1',
        type: 'bike',
        name: 'City Bike Share',
        provider: 'CitiBike',
        price: 12,
        currency: 'USD',
        duration: 'per day',
        description: 'Bike sharing stations throughout the city',
        availability: 'available',
        rating: 4.1,
        bookingUrl: 'https://citibikenyc.com',
        features: ['Electric Bikes', 'Multiple Stations', 'Healthy Option'],
        icon: '🚴‍♂️'
      },
      {
        id: 'walk-1',
        type: 'walk',
        name: 'Walking',
        provider: 'Free',
        price: 0,
        currency: 'USD',
        duration: 'varies',
        description: 'Explore the city on foot',
        availability: 'available',
        rating: 5.0,
        features: ['Free', 'Healthy', 'Eco-friendly', 'Flexible'],
        icon: '🚶‍♂️'
      },
    ];

    setLocalOptions(options);
    setLoading(false);
  };

  const filteredOptions = selectedCategory === 'all' 
    ? localOptions 
    : localOptions.filter(option => {
        switch (selectedCategory) {
          case 'rental':
            return option.type === 'rental';
          case 'rideshare':
            return option.type === 'rideshare' || option.type === 'taxi';
          case 'public':
            return option.type === 'public';
          case 'active':
            return option.type === 'bike' || option.type === 'walk';
          default:
            return true;
        }
      });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'rental': return 'blue';
      case 'rideshare': return 'green';
      case 'taxi': return 'yellow';
      case 'public': return 'purple';
      case 'bike': return 'orange';
      case 'walk': return 'gray';
      default: return 'blue';
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="flex items-center justify-center py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <motion.div
            className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-gray-600 mt-3 text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Finding local transport options in {destination}...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Local Transportation in {destination}
        </h3>
        <p className="text-gray-600">
          Get around your destination with these transport options
        </p>
      </motion.div>

      {/* Category Filter */}
      <motion.div 
        className="flex flex-wrap gap-2 justify-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {categories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedCategory === category.id
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center space-x-2">
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Transport Options */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AnimatePresence>
          {filteredOptions.map((option, index) => (
            <LocalTransportCard
              key={option.id}
              option={option}
              index={index}
              onSelect={() => onSelectOption?.(option)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredOptions.length === 0 && (
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No options found
          </h3>
          <p className="text-gray-600">
            Try selecting a different category to see more transport options.
          </p>
        </motion.div>
      )}
    </div>
  );
}

function LocalTransportCard({ 
  option, 
  index, 
  onSelect 
}: {
  option: LocalTransportOption;
  index: number;
  onSelect: () => void;
}) {
  const color = option.type === 'rental' ? 'blue' : 
               option.type === 'rideshare' ? 'green' :
               option.type === 'public' ? 'purple' :
               option.type === 'bike' ? 'orange' : 'gray';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={onSelect}
      className={`border-2 border-gray-200 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-${color}-300 bg-white`}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <motion.div 
            className={`text-2xl bg-${color}-100 rounded-lg p-2 flex items-center justify-center`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            {option.icon}
          </motion.div>
          <div>
            <h4 className="font-semibold text-gray-900">{option.name}</h4>
            <p className="text-sm text-gray-600">{option.provider}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            {option.price === 0 ? 'Free' : `$${option.price}`}
          </p>
          <p className="text-xs text-gray-500">{option.duration}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">{option.description}</p>

      {/* Features */}
      <div className="flex flex-wrap gap-1 mb-3">
        {option.features.map((feature, i) => (
          <span 
            key={i} 
            className={`text-xs bg-${color}-100 text-${color}-700 px-2 py-1 rounded`}
          >
            {feature}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {option.rating && (
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
              <span className="text-xs text-gray-600">{option.rating}</span>
            </div>
          )}
          
          <span className={`text-xs px-2 py-1 rounded-full ${
            option.availability === 'available' ? 'bg-green-100 text-green-700' :
            option.availability === 'limited' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {option.availability}
          </span>
        </div>
        
        <motion.button
          className={`px-3 py-1 bg-${color}-600 text-white text-xs rounded-lg hover:bg-${color}-700 transition-colors duration-200`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            if (option.bookingUrl) {
              window.open(option.bookingUrl, '_blank');
            } else {
              onSelect();
            }
          }}
        >
          {option.bookingUrl ? 'Book' : 'Select'}
        </motion.button>
      </div>
    </motion.div>
  );
}