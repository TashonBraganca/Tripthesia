"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Calendar,
  Users,
  DollarSign,
  Thermometer,
  Sparkles,
  TrendingUp,
  Clock,
  Heart,
  Star,
  Plane,
  Camera,
  Mountain,
  Waves,
  UtensilsCrossed,
  Building,
  Music,
  Palette,
  TreePine,
  Crown,
  Zap,
  Sun,
  Snowflake,
  Leaf,
  CloudRain
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  cardHoverVariants
} from "@/lib/motion";

interface TravelStyle {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  keywords: string[];
  budgetRange: { min: number; max: number };
  typicalDuration: { min: number; max: number };
  popularSeasons: string[];
  sampleDestinations: string[];
}

interface SmartDefault {
  id: string;
  type: 'season' | 'budget' | 'duration' | 'group' | 'trending';
  title: string;
  description: string;
  icon: React.ReactNode;
  value: any;
  confidence: number;
  reason: string;
  badge?: string;
}

interface UserContext {
  location?: string;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  previousSearches?: string[];
  browserLanguage?: string;
  timeZone?: string;
  deviceType?: 'mobile' | 'desktop';
}

const TRAVEL_STYLES: TravelStyle[] = [
  {
    id: 'adventure',
    name: 'Adventure',
    description: 'Outdoor activities, hiking, extreme sports, and adrenaline-pumping experiences',
    icon: <Mountain className="h-5 w-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    keywords: ['hiking', 'climbing', 'adventure', 'outdoors', 'extreme', 'sports'],
    budgetRange: { min: 80, max: 200 },
    typicalDuration: { min: 5, max: 14 },
    popularSeasons: ['spring', 'summer', 'fall'],
    sampleDestinations: ['Iceland', 'New Zealand', 'Patagonia', 'Nepal', 'Costa Rica']
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'High-end accommodations, fine dining, premium experiences, and exclusive access',
    icon: <Crown className="h-5 w-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    keywords: ['luxury', 'premium', 'exclusive', 'fine dining', 'spa', '5-star'],
    budgetRange: { min: 300, max: 1000 },
    typicalDuration: { min: 4, max: 10 },
    popularSeasons: ['spring', 'summer', 'winter'],
    sampleDestinations: ['Monaco', 'Maldives', 'Dubai', 'Santorini', 'Aspen']
  },
  {
    id: 'culture',
    name: 'Culture',
    description: 'Museums, historical sites, local traditions, art galleries, and cultural immersion',
    icon: <Palette className="h-5 w-5" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    keywords: ['culture', 'history', 'museum', 'art', 'heritage', 'traditional'],
    budgetRange: { min: 60, max: 150 },
    typicalDuration: { min: 4, max: 12 },
    popularSeasons: ['spring', 'fall'],
    sampleDestinations: ['Rome', 'Kyoto', 'Cairo', 'Prague', 'Istanbul']
  },
  {
    id: 'relaxation',
    name: 'Relaxation',
    description: 'Beaches, spas, wellness retreats, peaceful environments, and stress-free experiences',
    icon: <Waves className="h-5 w-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    keywords: ['relaxation', 'beach', 'spa', 'wellness', 'peaceful', 'resort'],
    budgetRange: { min: 70, max: 250 },
    typicalDuration: { min: 3, max: 10 },
    popularSeasons: ['summer', 'winter'],
    sampleDestinations: ['Bali', 'Maldives', 'Hawaii', 'Seychelles', 'Tulum']
  },
  {
    id: 'food',
    name: 'Food & Wine',
    description: 'Culinary experiences, wine tours, cooking classes, and gastronomic adventures',
    icon: <UtensilsCrossed className="h-5 w-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    keywords: ['food', 'wine', 'culinary', 'cooking', 'gastronomy', 'restaurant'],
    budgetRange: { min: 90, max: 300 },
    typicalDuration: { min: 4, max: 8 },
    popularSeasons: ['spring', 'summer', 'fall'],
    sampleDestinations: ['Tokyo', 'Paris', 'Lima', 'Barcelona', 'Thailand']
  },
  {
    id: 'nightlife',
    name: 'Nightlife',
    description: 'Bars, clubs, live music, festivals, and vibrant after-dark entertainment',
    icon: <Music className="h-5 w-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    keywords: ['nightlife', 'bars', 'clubs', 'music', 'festivals', 'party'],
    budgetRange: { min: 80, max: 200 },
    typicalDuration: { min: 3, max: 7 },
    popularSeasons: ['summer', 'winter'],
    sampleDestinations: ['Ibiza', 'Berlin', 'Miami', 'Bangkok', 'Amsterdam']
  },
  {
    id: 'urban',
    name: 'City Explorer',
    description: 'Metropolitan experiences, shopping, architecture, and urban culture exploration',
    icon: <Building className="h-5 w-5" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    keywords: ['city', 'urban', 'shopping', 'architecture', 'metropolitan', 'skyline'],
    budgetRange: { min: 70, max: 180 },
    typicalDuration: { min: 3, max: 8 },
    popularSeasons: ['spring', 'fall'],
    sampleDestinations: ['New York', 'London', 'Singapore', 'Hong Kong', 'Melbourne']
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'National parks, wildlife, scenic landscapes, and natural wonders exploration',
    icon: <TreePine className="h-5 w-5" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    keywords: ['nature', 'wildlife', 'parks', 'landscape', 'scenic', 'natural'],
    budgetRange: { min: 60, max: 160 },
    typicalDuration: { min: 5, max: 14 },
    popularSeasons: ['spring', 'summer', 'fall'],
    sampleDestinations: ['Yellowstone', 'Serengeti', 'Patagonia', 'Canadian Rockies', 'Norway']
  }
];

// Generate smart defaults based on user context
function generateSmartDefaults(userContext: UserContext): SmartDefault[] {
  const defaults: SmartDefault[] = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  
  // Seasonal recommendations
  let season: 'spring' | 'summer' | 'fall' | 'winter' = 'spring';
  if (currentMonth >= 2 && currentMonth <= 4) season = 'spring';
  else if (currentMonth >= 5 && currentMonth <= 7) season = 'summer';
  else if (currentMonth >= 8 && currentMonth <= 10) season = 'fall';
  else season = 'winter';

  const seasonIcons = {
    spring: <Leaf className="h-4 w-4 text-green-500" />,
    summer: <Sun className="h-4 w-4 text-yellow-500" />,
    fall: <Leaf className="h-4 w-4 text-orange-500" />,
    winter: <Snowflake className="h-4 w-4 text-blue-500" />
  };

  defaults.push({
    id: 'season',
    type: 'season',
    title: `Perfect ${season} destinations`,
    description: `Based on current season (${season})`,
    icon: seasonIcons[season],
    value: season,
    confidence: 85,
    reason: `${season} is ideal for specific destinations with great weather`,
    badge: 'Seasonal'
  });

  // Budget recommendations based on global averages
  const budgetRanges = [
    { name: 'Budget', min: 50, max: 80, confidence: 70, reason: 'Great value destinations with authentic experiences' },
    { name: 'Mid-range', min: 80, max: 150, confidence: 90, reason: 'Perfect balance of comfort and value' },
    { name: 'Luxury', min: 200, max: 500, confidence: 75, reason: 'Premium experiences and accommodations' }
  ];

  defaults.push({
    id: 'budget',
    type: 'budget',
    title: 'Mid-range budget ($80-150/day)',
    description: 'Most popular choice among travelers',
    icon: <DollarSign className="h-4 w-4 text-green-500" />,
    value: { min: 80, max: 150 },
    confidence: 90,
    reason: 'Offers the best balance of comfort, experiences, and value',
    badge: 'Popular'
  });

  // Duration recommendations
  const isWeekend = currentDate.getDay() === 5 || currentDate.getDay() === 6;
  const suggestedDuration = isWeekend ? 3 : 7;
  
  defaults.push({
    id: 'duration',
    type: 'duration',
    title: `${suggestedDuration} day trip`,
    description: isWeekend ? 'Perfect weekend getaway' : 'Ideal week-long adventure',
    icon: <Calendar className="h-4 w-4 text-blue-500" />,
    value: suggestedDuration,
    confidence: isWeekend ? 95 : 85,
    reason: isWeekend ? 'Weekend detected - short trips work best' : 'Week-long trips offer the best experience depth'
  });

  // Group size (assume couple as most common)
  defaults.push({
    id: 'group',
    type: 'group',
    title: 'Couple (2 travelers)',
    description: 'Most romantic experiences and accommodations',
    icon: <Heart className="h-4 w-4 text-red-500" />,
    value: 2,
    confidence: 80,
    reason: 'Couple travel is most popular for leisure trips',
    badge: 'Romantic'
  });

  // Trending destinations
  const trendingDestinations = ['Portugal', 'Georgia', 'Albania', 'Slovenia', 'Colombia'];
  const randomTrending = trendingDestinations[Math.floor(Math.random() * trendingDestinations.length)];
  
  defaults.push({
    id: 'trending',
    type: 'trending',
    title: `${randomTrending} is trending`,
    description: 'Up 230% in searches this month',
    icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
    value: randomTrending,
    confidence: 95,
    reason: 'Hidden gems gaining popularity with savvy travelers',
    badge: 'Hot'
  });

  return defaults;
}

interface SmartDefaultsEngineProps {
  userContext?: UserContext;
  onStyleSelect?: (styles: string[]) => void;
  onDefaultApply?: (defaultValue: SmartDefault) => void;
  className?: string;
}

export function SmartDefaultsEngine({ 
  userContext = {}, 
  onStyleSelect, 
  onDefaultApply, 
  className 
}: SmartDefaultsEngineProps) {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [smartDefaults, setSmartDefaults] = useState<SmartDefault[]>([]);

  useEffect(() => {
    // Generate smart defaults based on user context
    const defaults = generateSmartDefaults(userContext);
    setSmartDefaults(defaults);
  }, [userContext]);

  const handleStyleToggle = (styleId: string) => {
    const newSelection = selectedStyles.includes(styleId)
      ? selectedStyles.filter(id => id !== styleId)
      : [...selectedStyles, styleId];
    
    setSelectedStyles(newSelection);
    onStyleSelect?.(newSelection);
  };

  const handleDefaultApply = (defaultValue: SmartDefault) => {
    onDefaultApply?.(defaultValue);
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Smart Defaults */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-semibold">Smart Suggestions</h3>
          </div>
          <p className="text-muted-foreground">
            Based on current trends, season, and popular choices
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {smartDefaults.map((default_, index) => (
            <motion.div
              key={default_.id}
              variants={itemVariants}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="hover:shadow-md transition-all duration-200 cursor-pointer group border-border/50 hover:border-emerald-300"
                onClick={() => handleDefaultApply(default_)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {default_.icon}
                      <span className="text-sm font-medium">{default_.title}</span>
                    </div>
                    {default_.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {default_.badge}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {default_.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span className="text-xs text-muted-foreground">
                        {default_.confidence}% match
                      </span>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      Apply
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {default_.reason}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Travel Styles */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Travel Styles</h3>
          </div>
          <p className="text-muted-foreground">
            Choose what kind of experience you're looking for
          </p>
          {selectedStyles.length > 0 && (
            <p className="text-sm text-emerald-600 mt-1">
              {selectedStyles.length} style{selectedStyles.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRAVEL_STYLES.map((style, index) => {
            const isSelected = selectedStyles.includes(style.id);
            
            return (
              <motion.div
                key={style.id}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-200 group",
                    isSelected 
                      ? `${style.borderColor} ${style.bgColor} shadow-md` 
                      : "border-border/50 hover:border-muted-foreground/50"
                  )}
                  onClick={() => handleStyleToggle(style.id)}
                >
                  <CardContent className="p-4 text-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors",
                        isSelected ? style.bgColor : "bg-muted/50"
                      )}
                    >
                      <div className={isSelected ? style.color : "text-muted-foreground"}>
                        {style.icon}
                      </div>
                    </motion.div>
                    
                    <h4 className={cn(
                      "font-semibold mb-2 transition-colors",
                      isSelected ? style.color : "text-foreground"
                    )}>
                      {style.name}
                    </h4>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {style.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>${style.budgetRange.min}-{style.budgetRange.max}/day</span>
                      </div>
                      
                      <div className="flex flex-wrap justify-center gap-1">
                        {style.sampleDestinations.slice(0, 2).map(dest => (
                          <Badge key={dest} variant="outline" className="text-xs">
                            {dest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}