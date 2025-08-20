"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Search, 
  Plane, 
  Building2, 
  Globe, 
  Clock, 
  TrendingUp,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { itemVariants, containerVariants } from "@/lib/motion";

interface Destination {
  name: string;
  displayName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  country: string;
  region?: string;
  type: 'city' | 'country' | 'airport' | 'landmark';
  popularity?: number;
  searchScore?: number;
}

interface DestinationGroup {
  type: 'popular' | 'cities' | 'countries' | 'airports' | 'landmarks';
  label: string;
  icon: React.ComponentType<any>;
  destinations: Destination[];
}

interface SmartDestinationAutocompleteProps {
  value?: {
    name: string;
    coordinates: { lat: number; lng: number };
    placeId?: string;
  };
  onChange?: (destination: {
    name: string;
    coordinates: { lat: number; lng: number };
    placeId?: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

// Popular destinations for initial display
const POPULAR_DESTINATIONS: Destination[] = [
  { 
    name: "Paris", 
    displayName: "Paris, France", 
    coordinates: { lat: 48.8566, lng: 2.3522 }, 
    country: "France", 
    type: "city",
    popularity: 95 
  },
  { 
    name: "Tokyo", 
    displayName: "Tokyo, Japan", 
    coordinates: { lat: 35.6762, lng: 139.6503 }, 
    country: "Japan", 
    type: "city",
    popularity: 92 
  },
  { 
    name: "New York", 
    displayName: "New York, USA", 
    coordinates: { lat: 40.7128, lng: -74.0060 }, 
    country: "USA", 
    type: "city",
    popularity: 90 
  },
  { 
    name: "London", 
    displayName: "London, UK", 
    coordinates: { lat: 51.5074, lng: -0.1278 }, 
    country: "UK", 
    type: "city",
    popularity: 88 
  },
  { 
    name: "Dubai", 
    displayName: "Dubai, UAE", 
    coordinates: { lat: 25.2048, lng: 55.2708 }, 
    country: "UAE", 
    type: "city",
    popularity: 85 
  },
  { 
    name: "Barcelona", 
    displayName: "Barcelona, Spain", 
    coordinates: { lat: 41.3851, lng: 2.1734 }, 
    country: "Spain", 
    type: "city",
    popularity: 82 
  },
];

const GROUP_CONFIGS = {
  popular: { label: "Popular Destinations", icon: TrendingUp },
  cities: { label: "Cities", icon: Building2 },
  countries: { label: "Countries", icon: Globe },
  airports: { label: "Airports", icon: Plane },
  landmarks: { label: "Landmarks", icon: MapPin },
};

export function SmartDestinationAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Search destinations, cities, countries...",
  className 
}: SmartDestinationAutocompleteProps) {
  const [query, setQuery] = useState(value?.name || "");
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<Destination[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('tripthesia-recent-destinations');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 3));
      } catch (e) {
        console.error('Failed to parse recent destinations:', e);
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (destination: Destination) => {
    const updated = [
      destination,
      ...recentSearches.filter(d => d.name !== destination.name)
    ].slice(0, 5);
    
    setRecentSearches(updated);
    localStorage.setItem('tripthesia-recent-destinations', JSON.stringify(updated));
  };

  // Group destinations by type
  const groupDestinations = (destinations: Destination[]): DestinationGroup[] => {
    const groups: DestinationGroup[] = [];
    
    // Add popular destinations if query is short
    if (query.length < 2 && destinations.length === 0) {
      groups.push({
        type: 'popular',
        ...GROUP_CONFIGS.popular,
        destinations: POPULAR_DESTINATIONS
      });
    }

    // Group destinations by type
    const typeGroups = destinations.reduce((acc, dest) => {
      if (!acc[dest.type]) acc[dest.type] = [];
      acc[dest.type].push(dest);
      return acc;
    }, {} as Record<string, Destination[]>);

    // Add groups in order of preference
    const typeOrder: Array<keyof typeof GROUP_CONFIGS> = ['cities', 'countries', 'airports', 'landmarks'];
    
    typeOrder.forEach(type => {
      if (typeGroups[type]?.length > 0) {
        groups.push({
          type,
          ...GROUP_CONFIGS[type],
          destinations: typeGroups[type].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        });
      }
    });

    return groups;
  };

  const searchDestinations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/places/search?q=${encodeURIComponent(searchQuery)}&limit=20&types=city,country,airport,landmark`
      );
      
      if (response.ok) {
        const data = await response.json();
        const results = (data.results || []).map((result: any, index: number) => ({
          ...result,
          searchScore: 100 - index // Higher score for earlier results
        }));
        setSuggestions(results);
      }
    } catch (error) {
      console.error("Failed to search destinations:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchDestinations(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchDestinations]);

  const handleInputChange = (newValue: string) => {
    setQuery(newValue);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleSuggestionSelect = (destination: Destination) => {
    setQuery(destination.displayName);
    onChange?.({
      name: destination.name,
      coordinates: destination.coordinates,
      placeId: destination.placeId,
    });
    
    saveRecentSearch(destination);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const clearSelection = () => {
    setQuery("");
    onChange?.(undefined as any);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allDestinations = groupDestinations(suggestions).flatMap(g => g.destinations);
    
    if (!showSuggestions || allDestinations.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allDestinations.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(allDestinations[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const groups = groupDestinations(suggestions);
  const hasValue = value?.name && query;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding to allow suggestion click
            setTimeout(() => setShowSuggestions(false), 150);
          }}
          className="pl-10 pr-10 text-base"
        />

        {hasValue && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-hidden rounded-lg border bg-popover/95 backdrop-blur-sm shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full"
                />
                <span className="ml-3 text-sm text-muted-foreground">Searching destinations...</span>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {/* Recent searches */}
                {query.length < 2 && recentSearches.length > 0 && (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="p-3 border-b border-border/50"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Recent Searches
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((dest, index) => (
                        <motion.div
                          key={dest.name}
                          variants={itemVariants}
                          custom={index}
                        >
                          <Badge
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors"
                            onClick={() => handleSuggestionSelect(dest)}
                          >
                            {dest.name}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Grouped suggestions */}
                {groups.map((group, groupIndex) => (
                  <motion.div
                    key={group.type}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="py-2"
                  >
                    {/* Group header */}
                    <div className="px-3 py-2 flex items-center gap-2 bg-muted/30">
                      <group.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {group.label}
                      </span>
                    </div>

                    {/* Group items */}
                    {group.destinations.map((destination, index) => {
                      const globalIndex = groups
                        .slice(0, groupIndex)
                        .reduce((acc, g) => acc + g.destinations.length, 0) + index;
                      
                      return (
                        <motion.button
                          key={`${destination.name}-${destination.type}-${index}`}
                          variants={itemVariants}
                          custom={index}
                          type="button"
                          className={cn(
                            "w-full px-3 py-3 text-left hover:bg-accent/50 transition-colors border-l-2 border-transparent",
                            globalIndex === selectedIndex && "bg-accent text-accent-foreground border-l-primary"
                          )}
                          onClick={() => handleSuggestionSelect(destination)}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "mt-0.5 p-1.5 rounded-md",
                              destination.type === 'city' && "bg-blue-100 text-blue-600",
                              destination.type === 'country' && "bg-green-100 text-green-600",
                              destination.type === 'airport' && "bg-purple-100 text-purple-600",
                              destination.type === 'landmark' && "bg-orange-100 text-orange-600"
                            )}>
                              {destination.type === 'city' && <Building2 className="h-3 w-3" />}
                              {destination.type === 'country' && <Globe className="h-3 w-3" />}
                              {destination.type === 'airport' && <Plane className="h-3 w-3" />}
                              {destination.type === 'landmark' && <MapPin className="h-3 w-3" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {destination.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {destination.displayName}
                              </div>
                              
                              {destination.popularity && destination.popularity > 80 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <TrendingUp className="h-3 w-3 text-primary" />
                                  <span className="text-xs text-primary font-medium">Popular</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                ))}

                {/* No results */}
                {query.length >= 2 && groups.length === 0 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    <MapPin className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No destinations found for "{query}"</p>
                    <p className="text-xs mt-1">Try searching for cities, countries, or landmarks</p>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}