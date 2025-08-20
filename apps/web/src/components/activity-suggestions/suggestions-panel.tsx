'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, MapPin, Clock, Thermometer, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivitySuggestions, useWeatherAwareSuggestions } from '@/hooks/use-activity-suggestions';
import { useSubscription } from '@/hooks/use-subscription';
import { SuggestionCard } from './suggestion-card';
import { UpgradeBanner } from '@/components/subscription/upgrade-banner';
import { cn } from '@/lib/utils';

interface Location {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

interface CurrentActivity {
  id: string;
  name: string;
  category: string;
  time: string;
}

interface SuggestionsPanelProps {
  location: Location;
  currentItinerary?: CurrentActivity[];
  onAddActivity?: (activity: any) => void;
  className?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export function SuggestionsPanel({
  location,
  currentItinerary = [],
  onAddActivity,
  className,
  timeOfDay,
}: SuggestionsPanelProps) {
  const { isPro } = useSubscription();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  // Determine current time of day if not provided
  const getCurrentTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const currentTimeOfDay = timeOfDay || getCurrentTimeOfDay();

  const {
    getSuggestions,
    weather,
    isGenerating,
    generationError,
  } = useWeatherAwareSuggestions(location, currentTimeOfDay, isPro);

  // Auto-generate suggestions when location changes (Pro only)
  useEffect(() => {
    if (isPro && location.city && getSuggestions) {
      const userPreferences = {
        // Get from user profile or localStorage
        interests: ['culture', 'food', 'outdoor'],
        budget: 'medium' as const,
        mobility: 'walking' as const,
        group_size: 2,
      };

      getSuggestions(
        userPreferences,
        currentItinerary,
        Array.from(rejectedIds)
      );
    }
  }, [location.city, currentTimeOfDay, isPro, getSuggestions]);

  const handleRefresh = () => {
    if (!isPro) return;
    
    const userPreferences = {
      interests: ['culture', 'food', 'outdoor'],
      budget: 'medium' as const,
      mobility: 'walking' as const,
      group_size: 2,
    };

    getSuggestions?.(
      userPreferences,
      currentItinerary,
      Array.from(rejectedIds)
    );
  };

  const handleRejectSuggestion = (suggestion: any) => {
    setRejectedIds(prev => new Set([...prev, suggestion.id]));
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const getTimeIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning': return '🌅';
      case 'afternoon': return '☀️';
      case 'evening': return '🌆';
      case 'night': return '🌙';
      default: return '🕐';
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny': return '☀️';
      case 'partly_cloudy': return '⛅';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      case 'snowy': return '❄️';
      default: return '🌤️';
    }
  };

  if (!isPro) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <CardTitle>Real-time Activity Suggestions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <UpgradeBanner 
            minimal={false}
            showProgress={false}
            className="mb-4"
          />
          <div className="text-center text-muted-foreground">
            <p className="mb-2">Get AI-powered activity suggestions based on:</p>
            <ul className="text-sm space-y-1">
              <li>• Current weather conditions</li>
              <li>• Time of day</li>
              <li>• Your preferences</li>
              <li>• Local events and hours</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Suggestions for {location.city}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>{getTimeIcon(currentTimeOfDay)}</span>
                <span className="capitalize">{currentTimeOfDay}</span>
              </div>
              {weather && (
                <div className="flex items-center gap-1">
                  <span>{getWeatherIcon(weather.condition)}</span>
                  <span>{weather.temperature}°C</span>
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isGenerating}
          >
            <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
            <span className="sr-only">Refresh suggestions</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {generationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            Failed to load suggestions. Please try again.
          </div>
        )}

        {isGenerating ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                position={index}
                location={`${location.city}, ${location.country}`}
                timeOfDay={currentTimeOfDay}
                onAdd={onAddActivity}
                onReject={handleRejectSuggestion}
                compact={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No suggestions available right now.</p>
            <p className="text-sm">Try refreshing or check back later.</p>
          </div>
        )}

        {/* Weather warning */}
        {weather && weather.precipitation && weather.precipitation > 50 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <span>🌧️</span>
              <span>High chance of rain ({weather.precipitation}%). Consider indoor activities.</span>
            </div>
          </div>
        )}

        {/* Current activity context */}
        {currentItinerary.length > 0 && (
          <div className="p-3 bg-gray-50 border rounded-lg text-sm">
            <p className="font-medium mb-1">Current activities:</p>
            <div className="flex flex-wrap gap-1">
              {currentItinerary.slice(0, 3).map((activity) => (
                <Badge key={activity.id} variant="outline" className="text-xs">
                  {activity.name}
                </Badge>
              ))}
              {currentItinerary.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{currentItinerary.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar/drawer
export function SuggestionsDrawer({
  location,
  currentItinerary,
  onAddActivity,
  className,
}: SuggestionsPanelProps) {
  return (
    <div className={cn("w-80 border-l bg-background", className)}>
      <SuggestionsPanel
        location={location}
        currentItinerary={currentItinerary}
        onAddActivity={onAddActivity}
        className="border-none shadow-none"
      />
    </div>
  );
}