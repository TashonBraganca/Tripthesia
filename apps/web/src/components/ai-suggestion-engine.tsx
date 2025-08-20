"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  MapPin, 
  Calendar,
  DollarSign,
  Thermometer,
  Users,
  Star,
  TrendingUp,
  Clock,
  Plane,
  Camera,
  Mountain,
  Waves,
  UtensilsCrossed,
  Building,
  TreePine,
  Palette,
  Music,
  Heart,
  ChevronRight,
  RefreshCw,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  cardHoverVariants,
  pulseVariants,
  textRevealVariants
} from "@/lib/motion";

interface AIDestinationSuggestion {
  id: string;
  name: string;
  country: string;
  flag: string;
  image: string;
  description: string;
  bestTime: string;
  averageBudget: {
    budget: number;
    luxury: number;
    currency: string;
  };
  highlights: string[];
  travelStyle: ('adventure' | 'culture' | 'relaxation' | 'luxury' | 'food' | 'nightlife')[];
  weather: {
    temp: string;
    condition: string;
    icon: string;
  };
  popularity: number;
  aiScore: number;
  reasonsToGo: string[];
  similarTo?: string[];
}

interface TravelProfile {
  budget?: number;
  duration?: number;
  travelStyle?: string[];
  interests?: string[];
  previousTrips?: string[];
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  groupType?: 'solo' | 'couple' | 'family' | 'friends' | 'business';
}

interface AISuggestionEngineProps {
  profile: TravelProfile;
  onSuggestionSelect: (suggestion: AIDestinationSuggestion) => void;
  className?: string;
}

// Mock AI suggestion data - in production this would call AI APIs
const DESTINATION_POOL: AIDestinationSuggestion[] = [
  {
    id: 'tokyo-japan',
    name: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop',
    description: 'Ultra-modern metropolis blending ancient traditions with cutting-edge technology',
    bestTime: 'March-May, September-November',
    averageBudget: { budget: 120, luxury: 300, currency: 'USD' },
    highlights: ['Shibuya Crossing', 'Senso-ji Temple', 'Tsukiji Market', 'Mount Fuji day trips'],
    travelStyle: ['culture', 'food', 'adventure'],
    weather: { temp: '18°C', condition: 'Perfect spring weather', icon: '🌸' },
    popularity: 95,
    aiScore: 92,
    reasonsToGo: [
      'Perfect for first-time Asia visitors',
      'Incredible food scene and street culture',
      'Cherry blossoms in spring are magical',
      'Excellent public transportation system'
    ],
    similarTo: ['Seoul', 'Singapore', 'Hong Kong']
  },
  {
    id: 'santorini-greece',
    name: 'Santorini',
    country: 'Greece',
    flag: '🇬🇷',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop',
    description: 'Iconic Greek island with stunning sunsets, white-washed villages, and volcanic beaches',
    bestTime: 'April-October',
    averageBudget: { budget: 90, luxury: 250, currency: 'USD' },
    highlights: ['Oia sunset', 'Red Beach', 'Wine tours', 'Volcanic hot springs'],
    travelStyle: ['relaxation', 'luxury', 'culture'],
    weather: { temp: '24°C', condition: 'Sunny and warm', icon: '☀️' },
    popularity: 88,
    aiScore: 89,
    reasonsToGo: [
      'Most photogenic destination in Europe',
      'Perfect for romantic getaways',
      'World-class sunsets every evening',
      'Amazing local wines and cuisine'
    ],
    similarTo: ['Mykonos', 'Ibiza', 'Amalfi Coast']
  },
  {
    id: 'reykjavik-iceland',
    name: 'Reykjavik',
    country: 'Iceland',
    flag: '🇮🇸',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
    description: 'Gateway to dramatic landscapes, Northern Lights, and geothermal wonders',
    bestTime: 'June-August (summer), October-March (Northern Lights)',
    averageBudget: { budget: 150, luxury: 400, currency: 'USD' },
    highlights: ['Blue Lagoon', 'Northern Lights', 'Golden Circle', 'Glacier hiking'],
    travelStyle: ['adventure', 'nature', 'luxury'],
    weather: { temp: '12°C', condition: 'Cool and crisp', icon: '❄️' },
    popularity: 82,
    aiScore: 95,
    reasonsToGo: [
      'Bucket list Northern Lights experience',
      'Otherworldly landscapes and natural wonders',
      'Perfect for adventure photographers',
      'Incredibly safe and English-friendly'
    ],
    similarTo: ['Norway', 'Faroe Islands', 'New Zealand']
  },
  {
    id: 'bali-indonesia',
    name: 'Bali',
    country: 'Indonesia',
    flag: '🇮🇩',
    image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=250&fit=crop',
    description: 'Tropical paradise with ancient temples, rice terraces, and spiritual wellness culture',
    bestTime: 'April-October (dry season)',
    averageBudget: { budget: 40, luxury: 150, currency: 'USD' },
    highlights: ['Ubud rice terraces', 'Temple tours', 'Beach clubs', 'Yoga retreats'],
    travelStyle: ['relaxation', 'culture', 'adventure', 'luxury'],
    weather: { temp: '28°C', condition: 'Tropical perfection', icon: '🌺' },
    popularity: 93,
    aiScore: 87,
    reasonsToGo: [
      'Incredible value for luxury experiences',
      'Perfect blend of culture and relaxation',
      'World-renowned wellness and spa scene',
      'Stunning natural beauty everywhere'
    ],
    similarTo: ['Thailand', 'Costa Rica', 'Philippines']
  },
  {
    id: 'marrakech-morocco',
    name: 'Marrakech',
    country: 'Morocco',
    flag: '🇲🇦',
    image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&h=250&fit=crop',
    description: 'Vibrant imperial city with bustling souks, palaces, and desert gateway',
    bestTime: 'October-April',
    averageBudget: { budget: 60, luxury: 180, currency: 'USD' },
    highlights: ['Jemaa el-Fnaa square', 'Majorelle Garden', 'Atlas Mountains', 'Desert tours'],
    travelStyle: ['culture', 'adventure', 'food'],
    weather: { temp: '22°C', condition: 'Perfect exploring weather', icon: '🌵' },
    popularity: 79,
    aiScore: 84,
    reasonsToGo: [
      'Immersive cultural experience like nowhere else',
      'Gateway to Sahara Desert adventures',
      'Incredible architecture and craftsmanship',
      'Fantastic food and hospitality'
    ],
    similarTo: ['Fez', 'Istanbul', 'Cairo']
  }
];

// AI recommendation engine - simulates intelligent matching
function generateAISuggestions(profile: TravelProfile): AIDestinationSuggestion[] {
  let scoredDestinations = DESTINATION_POOL.map(dest => {
    let score = dest.aiScore;
    
    // Budget matching
    if (profile.budget) {
      const budgetDiff = Math.abs(dest.averageBudget.budget - profile.budget);
      score += budgetDiff < 30 ? 10 : budgetDiff < 60 ? 5 : -5;
    }
    
    // Travel style matching
    if (profile.travelStyle) {
      const styleMatch = profile.travelStyle.filter(style => 
        dest.travelStyle.includes(style as any)
      ).length;
      score += styleMatch * 8;
    }
    
    // Season matching
    if (profile.season) {
      const seasonScore = {
        spring: dest.name.includes('Tokyo') ? 15 : 5,
        summer: dest.name.includes('Santorini') ? 15 : dest.name.includes('Reykjavik') ? 10 : 5,
        fall: dest.name.includes('Tokyo') || dest.name.includes('Marrakech') ? 12 : 5,
        winter: dest.name.includes('Reykjavik') ? 15 : dest.name.includes('Bali') ? 10 : 0
      };
      score += seasonScore[profile.season] || 0;
    }
    
    // Group type matching
    if (profile.groupType) {
      const groupScore = {
        couple: dest.name.includes('Santorini') || dest.name.includes('Bali') ? 12 : 5,
        solo: dest.name.includes('Tokyo') || dest.name.includes('Reykjavik') ? 10 : 5,
        family: dest.name.includes('Tokyo') ? 8 : 5,
        friends: dest.name.includes('Bali') || dest.name.includes('Marrakech') ? 10 : 5
      };
      score += groupScore[profile.groupType] || 0;
    }
    
    return { ...dest, aiScore: Math.min(100, score) };
  });
  
  // Sort by AI score and return top 3
  return scoredDestinations
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 3);
}

export function AISuggestionEngine({ profile, onSuggestionSelect, className }: AISuggestionEngineProps) {
  const [suggestions, setSuggestions] = useState<AIDestinationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const generateSuggestions = async () => {
    setIsLoading(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const aiSuggestions = generateAISuggestions(profile);
    setSuggestions(aiSuggestions);
    setIsLoading(false);
  };

  const regenerateSuggestions = async () => {
    setIsRegenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Shuffle and re-score for "new" suggestions
    const reshuffled = [...DESTINATION_POOL]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(dest => ({ ...dest, aiScore: Math.floor(Math.random() * 20) + 80 }));
    
    setSuggestions(reshuffled);
    setIsRegenerating(false);
  };

  useEffect(() => {
    generateSuggestions();
  }, [profile]);

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div
            variants={pulseVariants}
            animate="pulse"
            className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center"
          >
            <Sparkles className="h-8 w-8 text-emerald-600" />
          </motion.div>
          <motion.h3 variants={textRevealVariants} className="text-xl font-semibold mb-2">
            AI is analyzing your preferences...
          </motion.h3>
          <motion.p variants={textRevealVariants} className="text-muted-foreground">
            Finding the perfect destinations just for you
          </motion.p>
        </motion.div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-32 bg-muted animate-pulse" />
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Zap className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold">AI-Powered Suggestions</h3>
        </motion.div>
        
        <motion.p variants={itemVariants} className="text-muted-foreground mb-4">
          Based on your preferences, here are destinations we think you'll love
        </motion.p>
        
        <motion.div variants={itemVariants}>
          <Button
            variant="outline"
            size="sm"
            onClick={regenerateSuggestions}
            disabled={isRegenerating}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRegenerating && "animate-spin")} />
            {isRegenerating ? "Generating..." : "Get New Suggestions"}
          </Button>
        </motion.div>
      </motion.div>

      {/* Suggestions Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={suggestions.map(s => s.id).join(',')}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              index={index}
              onSelect={onSuggestionSelect}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: AIDestinationSuggestion;
  index: number;
  onSelect: (suggestion: AIDestinationSuggestion) => void;
}

function SuggestionCard({ suggestion, index, onSelect }: SuggestionCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      transition={{ delay: index * 0.2 }}
    >
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border-border/50 hover:border-emerald-300"
        onClick={() => onSelect(suggestion)}
      >
        {/* Image */}
        <div className="relative h-32 overflow-hidden">
          <img 
            src={suggestion.image} 
            alt={suggestion.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* AI Score Badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white border-0">
              <Star className="h-3 w-3 mr-1" />
              {suggestion.aiScore}% match
            </Badge>
          </div>
          
          {/* Weather */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="text-2xl">{suggestion.weather.icon}</span>
            <span className="text-white text-sm font-medium">
              {suggestion.weather.temp}
            </span>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{suggestion.name}</h4>
                <span className="text-lg">{suggestion.flag}</span>
              </div>
              <p className="text-sm text-muted-foreground">{suggestion.country}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                ${suggestion.averageBudget.budget}/day
              </div>
              <div className="text-xs text-muted-foreground">budget</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {suggestion.description}
          </p>

          {/* Travel Styles */}
          <div className="flex flex-wrap gap-1 mb-3">
            {suggestion.travelStyle.slice(0, 3).map(style => (
              <Badge key={style} variant="secondary" className="text-xs capitalize">
                {style}
              </Badge>
            ))}
          </div>

          {/* Top Reason */}
          <div className="mb-4">
            <div className="flex items-start gap-2 text-sm">
              <Heart className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground line-clamp-2">
                {suggestion.reasonsToGo[0]}
              </span>
            </div>
          </div>

          {/* CTA */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full group-hover:bg-emerald-50 group-hover:border-emerald-300 group-hover:text-emerald-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(suggestion);
            }}
          >
            Choose {suggestion.name}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}