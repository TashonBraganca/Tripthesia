'use client';

import { useState } from 'react';
import { Clock, MapPin, DollarSign, Star, ExternalLink, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSuggestionTracking } from '@/hooks/use-activity-suggestions';
import { cn } from '@/lib/utils';

interface ActivitySuggestion {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  rating: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  openingHours?: {
    opens: string;
    closes: string;
    isOpen: boolean;
  };
  tags: string[];
  weatherSuitable: boolean;
  bookingRequired: boolean;
  website?: string;
  confidence: number;
}

interface SuggestionCardProps {
  suggestion: ActivitySuggestion;
  position: number;
  location: string;
  timeOfDay: string;
  onAdd?: (suggestion: ActivitySuggestion) => void;
  onReject?: (suggestion: ActivitySuggestion) => void;
  onViewDetails?: (suggestion: ActivitySuggestion) => void;
  className?: string;
  compact?: boolean;
}

export function SuggestionCard({
  suggestion,
  position,
  location,
  timeOfDay,
  onAdd,
  onReject,
  onViewDetails,
  className,
  compact = false,
}: SuggestionCardProps) {
  const [isRejected, setIsRejected] = useState(false);
  const { trackSuggestionClick, trackSuggestionRejection } = useSuggestionTracking();

  const handleClick = () => {
    trackSuggestionClick(suggestion, { location, timeOfDay, position });
    onViewDetails?.(suggestion);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd?.(suggestion);
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRejected(true);
    trackSuggestionRejection(suggestion, 'user_dismissed');
    onReject?.(suggestion);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatPriceRange = (priceRange: ActivitySuggestion['priceRange']) => {
    const { min, max, currency } = priceRange;
    if (min === 0 && max === 0) return 'Free';
    if (min === max) return `${currency === 'USD' ? '$' : currency}${min}`;
    return `${currency === 'USD' ? '$' : currency}${min}-${max}`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      attraction: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      restaurant: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      entertainment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      outdoor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      cultural: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      shopping: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      nightlife: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    };
    return colors[category as keyof typeof colors] || colors.attraction;
  };

  if (isRejected) {
    return null;
  }

  if (compact) {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md border-l-4",
          suggestion.weatherSuitable ? "border-l-green-500" : "border-l-yellow-500",
          className
        )}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{suggestion.name}</h3>
                <Badge variant="secondary" className={cn("text-xs", getCategoryColor(suggestion.category))}>
                  {suggestion.category}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(suggestion.estimatedDuration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>{formatPriceRange(suggestion.priceRange)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                  <span>{suggestion.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-1">
              {onAdd && (
                <Button size="sm" variant="outline" onClick={handleAdd} className="h-6 w-6 p-0">
                  <Plus className="h-3 w-3" />
                  <span className="sr-only">Add activity</span>
                </Button>
              )}
              {onReject && (
                <Button size="sm" variant="ghost" onClick={handleReject} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                  <span className="sr-only">Reject activity</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg border-l-4",
        suggestion.weatherSuitable ? "border-l-green-500" : "border-l-yellow-500",
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{suggestion.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getCategoryColor(suggestion.category)}>
                {suggestion.category}
              </Badge>
              {suggestion.openingHours && (
                <Badge variant={suggestion.openingHours.isOpen ? "default" : "secondary"}>
                  {suggestion.openingHours.isOpen ? "Open" : "Closed"}
                </Badge>
              )}
              {suggestion.bookingRequired && (
                <Badge variant="outline">Booking Required</Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-1">
            {onReject && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={handleReject}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Reject suggestion</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Not interested</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {suggestion.description}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatDuration(suggestion.estimatedDuration)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{formatPriceRange(suggestion.priceRange)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            <span>{suggestion.rating.toFixed(1)} rating</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{suggestion.location.address}</span>
          </div>
        </div>

        {suggestion.openingHours && (
          <div className="text-xs text-muted-foreground">
            Hours: {suggestion.openingHours.opens} - {suggestion.openingHours.closes}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {suggestion.tags.slice(0, 4).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {suggestion.tags.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{suggestion.tags.length - 4} more
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {onAdd && (
            <Button onClick={handleAdd} size="sm" className="flex-1">
              <Plus className="mr-1 h-3 w-3" />
              Add to Trip
            </Button>
          )}
          
          {suggestion.website && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(suggestion.website, '_blank');
              }}
            >
              <ExternalLink className="h-3 w-3" />
              <span className="sr-only">Visit website</span>
            </Button>
          )}
        </div>

        {/* Confidence indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 bg-gray-200 rounded-full h-1">
            <div 
              className="bg-primary h-1 rounded-full transition-all"
              style={{ width: `${suggestion.confidence * 100}%` }}
            />
          </div>
          <span>{Math.round(suggestion.confidence * 100)}% match</span>
        </div>
      </CardContent>
    </Card>
  );
}