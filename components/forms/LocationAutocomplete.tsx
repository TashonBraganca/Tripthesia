'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Plane, Train, Map, Search, X } from 'lucide-react';
import { searchLocations, formatLocationDisplay, getCityState, LocationData } from '@/lib/data/locations';
import { AnimatedButton } from '@/components/effects/AnimatedButton';
import { staggerContainer, staggerItem } from '@/lib/animations/variants';

// LocationData interface is imported from lib/data/locations

interface LocationAutocompleteProps {
  placeholder?: string;
  value?: LocationData | null;
  onChange: (location: LocationData | null) => void;
  className?: string;
  variant?: 'destination' | 'departure' | 'waypoint';
  required?: boolean;
  disabled?: boolean;
  maxSuggestions?: number;
}

const typeIcons = {
  city: MapPin,
  state: Map,
  landmark: Navigation,
  airport: Plane,
  station: Train,
  country: Map
};

const variantStyles = {
  destination: {
    accent: 'teal',
    placeholder: 'Where do you want to go?',
    icon: MapPin
  },
  departure: {
    accent: 'sky',
    placeholder: 'Where are you starting from?',
    icon: Navigation
  },
  waypoint: {
    accent: 'navy',
    placeholder: 'Add a waypoint...',
    icon: Map
  }
};

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  placeholder,
  value,
  onChange,
  className = '',
  variant = 'destination',
  required = false,
  disabled = false,
  maxSuggestions = 8
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const config = variantStyles[variant];

  // Search locations with debouncing
  const searchDebounceRef = useRef<NodeJS.Timeout>();
  
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    try {
      const results = await searchLocations(searchQuery, maxSuggestions);
      setSuggestions(results);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [maxSuggestions]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setLoading(true);

    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Debounce search
    searchDebounceRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 200);
  }, [performSearch]);

  const handleSuggestionSelect = useCallback((location: LocationData) => {
    setQuery(formatLocationDisplay(location));
    onChange(location);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  }, [onChange]);

  const handleClear = useCallback(() => {
    setQuery('');
    onChange(null);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, suggestions, selectedIndex, handleSuggestionSelect]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update query when value changes externally
  useEffect(() => {
    if (value) {
      setQuery(formatLocationDisplay(value));
    } else if (!query) {
      setQuery('');
    }
  }, [value, query]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const IconComponent = config.icon;
  const showSuggestions = isOpen && (suggestions.length > 0 || loading);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <IconComponent 
            size={18} 
            className={`text-${config.accent}-400 transition-colors duration-200`}
          />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder || config.placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full pl-10 pr-12 py-3 
            bg-navy-800/50 border border-navy-600 rounded-xl
            text-navy-100 placeholder-navy-400
            focus:border-${config.accent}-400 focus:ring-2 focus:ring-${config.accent}-400/20
            focus:outline-none transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            backdrop-blur-sm
          `}
        />
        
        {(query || value) && !disabled && (
          <AnimatedButton
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 h-auto min-h-0"
            particles={false}
          >
            <X size={14} />
          </AnimatedButton>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <div className="bg-navy-800/95 backdrop-blur-md border border-navy-600 rounded-xl shadow-2xl overflow-hidden">
              {loading ? (
                <div className="px-4 py-3 text-center text-navy-400">
                  <Search className="inline-block animate-spin mr-2" size={16} />
                  Searching locations...
                </div>
              ) : (
                <motion.ul
                  ref={listRef}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="max-h-80 overflow-y-auto"
                >
                  {suggestions.map((location, index) => {
                    const TypeIcon = typeIcons[location.type];
                    const isSelected = index === selectedIndex;
                    
                    return (
                      <motion.li
                        key={location.id}
                        variants={staggerItem}
                        className={`
                          px-4 py-3 cursor-pointer transition-all duration-150
                          flex items-center space-x-3 group
                          ${isSelected 
                            ? `bg-${config.accent}-400/10 border-l-2 border-${config.accent}-400` 
                            : 'hover:bg-navy-700/50 border-l-2 border-transparent'
                          }
                        `}
                        onClick={() => handleSuggestionSelect(location)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className={`
                          p-2 rounded-lg transition-colors duration-200
                          ${isSelected 
                            ? `bg-${config.accent}-400/20 text-${config.accent}-300` 
                            : 'bg-navy-700 text-navy-400 group-hover:text-navy-300'
                          }
                        `}>
                          <TypeIcon size={16} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-navy-100 truncate">
                            {location.name}
                          </div>
                          <div className="text-sm text-navy-400 truncate">
                            {getCityState(location)} • {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                            {location.iataCode && (
                              <span className="ml-2 px-1.5 py-0.5 bg-navy-600 rounded text-xs font-mono">
                                {location.iataCode}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`w-2 h-2 bg-${config.accent}-400 rounded-full`}
                          />
                        )}
                      </motion.li>
                    );
                  })}
                  
                  {suggestions.length === 0 && query.length >= 2 && (
                    <motion.li
                      variants={staggerItem}
                      className="px-4 py-6 text-center text-navy-400"
                    >
                      <Search size={24} className="mx-auto mb-2 opacity-50" />
                      <div>No locations found for &quot;{query}&quot;</div>
                      <div className="text-sm mt-1">Try searching for a city, state, or landmark</div>
                    </motion.li>
                  )}
                </motion.ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationAutocomplete;