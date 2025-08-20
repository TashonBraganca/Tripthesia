"use client";

import { useState, useEffect, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { TripWizardFormData } from "@/lib/validation";

interface Suggestion {
  name: string;
  displayName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  country: string;
  region?: string;
}

interface DestinationAutocompleteProps {
  className?: string;
}

export function DestinationAutocomplete({ className }: DestinationAutocompleteProps) {
  const { setValue, watch, formState: { errors } } = useFormContext<TripWizardFormData>();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const currentDestination = watch("destination");

  const searchDestinations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(searchQuery)}&type=city`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.results || []);
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

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    
    // Clear destination if user is typing
    if (currentDestination?.name !== value) {
      setValue("destination", {
        name: "",
        coordinates: { lat: 0, lng: 0 },
        placeId: undefined,
      });
    }
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.displayName);
    setValue("destination", {
      name: suggestion.name,
      coordinates: suggestion.coordinates,
      placeId: suggestion.placeId,
    });
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <FormItem className={className}>
      <FormLabel>Destination</FormLabel>
      <FormControl>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Where would you like to go?"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Delay hiding to allow suggestion click
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              className={cn(
                "pl-10",
                errors.destination && "border-red-500 focus-visible:ring-red-500"
              )}
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (query.length >= 2 || suggestions.length > 0) && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="py-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.name}-${index}`}
                      type="button"
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                        index === selectedIndex && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{suggestion.name}</div>
                          {suggestion.region && (
                            <div className="text-xs text-muted-foreground">
                              {suggestion.region}, {suggestion.country}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.length >= 2 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No destinations found
                </div>
              ) : null}
            </div>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}