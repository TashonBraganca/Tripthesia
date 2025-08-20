"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Star, 
  Clock, 
  Users,
  Calendar,
  Camera,
  Mountain,
  Utensils,
  Music,
  Palette,
  TreePine,
  Building,
  ShoppingBag,
  Heart,
  Plus,
  CloudSun,
  Thermometer,
  Droplets,
  Eye,
  ExternalLink,
  Filter,
  Search
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  containerVariants, 
  itemVariants, 
  cardHoverVariants
} from "@/lib/motion";

interface Activity {
  id: string;
  name: string;
  description: string;
  category: 'sightseeing' | 'food' | 'nightlife' | 'shopping' | 'nature' | 'culture' | 'adventure' | 'arts';
  location: {
    name: string;
    address: string;
    walkingTime?: string;
  };
  rating: number;
  reviewCount: number;
  price?: {
    amount: number;
    currency: string;
    type: 'per_person' | 'per_group' | 'free';
  };
  duration: {
    min: number;
    max: number;
    unit: 'minutes' | 'hours';
  };
  images: string[];
  openingHours?: {
    open: string;
    close: string;
    isOpen: boolean;
  };
  features: string[];
  weatherDependent: boolean;
  bookingRequired: boolean;
  difficulty?: 'easy' | 'moderate' | 'difficult';
  ageGroup: 'all' | 'adults' | 'families' | 'kids';
  bestTimeToVisit?: string[];
  weatherRecommendation?: {
    currentWeather: string;
    suitable: boolean;
    reason?: string;
  };
}

interface ActivityCardsProps {
  activities: Activity[];
  onSelect?: (activity: Activity) => void;
  onAddToItinerary?: (activityId: string, timeSlot?: string) => void;
  onFavorite?: (activityId: string) => void;
  favorites?: string[];
  selectedDate?: Date;
  weather?: {
    condition: string;
    temperature: number;
    humidity: number;
  };
  className?: string;
}

const CATEGORY_CONFIGS = {
  sightseeing: { label: 'Sightseeing', icon: Camera, color: 'bg-blue-100 text-blue-700' },
  food: { label: 'Food & Dining', icon: Utensils, color: 'bg-orange-100 text-orange-700' },
  nightlife: { label: 'Nightlife', icon: Music, color: 'bg-purple-100 text-purple-700' },
  shopping: { label: 'Shopping', icon: ShoppingBag, color: 'bg-pink-100 text-pink-700' },
  nature: { label: 'Nature', icon: TreePine, color: 'bg-green-100 text-green-700' },
  culture: { label: 'Culture', icon: Building, color: 'bg-indigo-100 text-indigo-700' },
  adventure: { label: 'Adventure', icon: Mountain, color: 'bg-red-100 text-red-700' },
  arts: { label: 'Arts', icon: Palette, color: 'bg-yellow-100 text-yellow-700' },
};

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800', 
  difficult: 'bg-red-100 text-red-800',
};

// Mock activity data
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    name: 'Central Park Walking Tour',
    description: 'Guided walking tour through the iconic Central Park with historical insights and hidden gems',
    category: 'sightseeing',
    location: {
      name: 'Central Park',
      address: '59th St to 110th St, New York, NY',
      walkingTime: '5 min walk'
    },
    rating: 4.7,
    reviewCount: 1284,
    price: { amount: 25, currency: 'USD', type: 'per_person' },
    duration: { min: 90, max: 120, unit: 'minutes' },
    images: ['https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=500&h=300&fit=crop'],
    openingHours: { open: '08:00', close: '18:00', isOpen: true },
    features: ['Professional Guide', 'Small Groups', 'Photo Opportunities'],
    weatherDependent: true,
    bookingRequired: true,
    difficulty: 'easy',
    ageGroup: 'all',
    bestTimeToVisit: ['morning', 'afternoon'],
    weatherRecommendation: {
      currentWeather: 'Sunny',
      suitable: true,
      reason: 'Perfect weather for outdoor walking'
    }
  },
  {
    id: '2',
    name: 'Metropolitan Museum of Art',
    description: 'World-renowned art museum featuring ancient artifacts, European paintings, and American art',
    category: 'culture',
    location: {
      name: 'Upper East Side',
      address: '1000 5th Ave, New York, NY',
      walkingTime: '12 min walk'
    },
    rating: 4.8,
    reviewCount: 3567,
    price: { amount: 30, currency: 'USD', type: 'per_person' },
    duration: { min: 2, max: 4, unit: 'hours' },
    images: [
      'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=500&h=300&fit=crop',
      'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=500&h=300&fit=crop'
    ],
    openingHours: { open: '10:00', close: '17:00', isOpen: true },
    features: ['Audio Guide', 'Special Exhibitions', 'Museum Shop'],
    weatherDependent: false,
    bookingRequired: false,
    ageGroup: 'all',
    bestTimeToVisit: ['morning', 'afternoon'],
    weatherRecommendation: {
      currentWeather: 'Rainy',
      suitable: true,
      reason: 'Indoor activity, perfect for rainy weather'
    }
  },
  {
    id: '3',
    name: 'Broadway Show: The Lion King',
    description: 'Award-winning musical featuring stunning costumes, innovative puppetry, and beloved songs',
    category: 'arts',
    location: {
      name: 'Theater District',
      address: 'Minskoff Theatre, 1515 Broadway',
      walkingTime: '8 min walk'
    },
    rating: 4.9,
    reviewCount: 2145,
    price: { amount: 89, currency: 'USD', type: 'per_person' },
    duration: { min: 150, max: 180, unit: 'minutes' },
    images: ['https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=500&h=300&fit=crop'],
    openingHours: { open: '19:30', close: '22:30', isOpen: false },
    features: ['Premium Seating', 'Intermission', 'Souvenir Program'],
    weatherDependent: false,
    bookingRequired: true,
    ageGroup: 'all',
    bestTimeToVisit: ['evening'],
    weatherRecommendation: {
      currentWeather: 'Any',
      suitable: true,
      reason: 'Indoor entertainment suitable for all weather'
    }
  },
  {
    id: '4',
    name: 'High Line Park',
    description: 'Elevated linear park built on former railway tracks with gardens, art installations, and city views',
    category: 'nature',
    location: {
      name: 'Meatpacking District',
      address: 'Access at Gansevoort St & Washington St',
      walkingTime: '15 min walk'
    },
    rating: 4.6,
    reviewCount: 892,
    price: { amount: 0, currency: 'USD', type: 'free' },
    duration: { min: 45, max: 90, unit: 'minutes' },
    images: [
      'https://images.unsplash.com/photo-1541336032412-2048a678540d?w=500&h=300&fit=crop',
      'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=500&h=300&fit=crop'
    ],
    openingHours: { open: '07:00', close: '19:00', isOpen: true },
    features: ['Art Installations', 'Garden Views', 'Photography Spots'],
    weatherDependent: true,
    bookingRequired: false,
    difficulty: 'easy',
    ageGroup: 'all',
    bestTimeToVisit: ['morning', 'afternoon', 'evening'],
    weatherRecommendation: {
      currentWeather: 'Partly Cloudy',
      suitable: true,
      reason: 'Good weather for outdoor walking'
    }
  },
  {
    id: '5',
    name: 'Food Tour of Little Italy',
    description: 'Culinary walking tour featuring authentic Italian restaurants, bakeries, and specialty food shops',
    category: 'food',
    location: {
      name: 'Little Italy',
      address: 'Mulberry St & Grand St area',
      walkingTime: '20 min walk'
    },
    rating: 4.5,
    reviewCount: 756,
    price: { amount: 65, currency: 'USD', type: 'per_person' },
    duration: { min: 2, max: 3, unit: 'hours' },
    images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=300&fit=crop'],
    openingHours: { open: '11:00', close: '15:00', isOpen: true },
    features: ['Multiple Tastings', 'Local Guide', 'Restaurant Recommendations'],
    weatherDependent: true,
    bookingRequired: true,
    ageGroup: 'adults',
    bestTimeToVisit: ['afternoon'],
    weatherRecommendation: {
      currentWeather: 'Sunny',
      suitable: true,
      reason: 'Great weather for walking between restaurants'
    }
  },
  {
    id: '6',
    name: 'Brooklyn Bridge Walk',
    description: 'Self-guided walk across the iconic Brooklyn Bridge with panoramic views of Manhattan skyline',
    category: 'sightseeing',
    location: {
      name: 'Brooklyn Bridge',
      address: 'Brooklyn Bridge, New York, NY',
      walkingTime: '10 min to entrance'
    },
    rating: 4.4,
    reviewCount: 1876,
    price: { amount: 0, currency: 'USD', type: 'free' },
    duration: { min: 30, max: 60, unit: 'minutes' },
    images: [
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=500&h=300&fit=crop',
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&h=300&fit=crop'
    ],
    features: ['Historic Architecture', 'Skyline Views', 'Photo Opportunities'],
    weatherDependent: true,
    bookingRequired: false,
    difficulty: 'easy',
    ageGroup: 'all',
    bestTimeToVisit: ['morning', 'evening'],
    weatherRecommendation: {
      currentWeather: 'Windy',
      suitable: false,
      reason: 'Strong winds can make bridge crossing uncomfortable'
    }
  }
];

export function ActivityCards({
  activities = MOCK_ACTIVITIES,
  onSelect,
  onAddToItinerary,
  onFavorite,
  favorites = [],
  selectedDate,
  weather,
  className
}: ActivityCardsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(activities.map(a => a.category)));
    return cats.map(cat => ({
      value: cat,
      ...CATEGORY_CONFIGS[cat as keyof typeof CATEGORY_CONFIGS]
    }));
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      if (selectedCategory !== 'all' && activity.category !== selectedCategory) {
        return false;
      }
      if (searchQuery && !activity.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [activities, selectedCategory, searchQuery]);

  const toggleFavorite = (activityId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(activityId);
  };

  const addToItinerary = (activityId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToItinerary?.(activityId);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Things to Do</h2>
            <p className="text-muted-foreground">
              {filteredActivities.length} activities available
              {selectedDate && ` for ${selectedDate.toLocaleDateString()}`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Weather Alert */}
        {weather && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <CloudSun className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Current Weather</span>
              <Badge variant="outline" className="text-xs">
                {weather.condition} • {weather.temperature}°C • {weather.humidity}% humidity
              </Badge>
            </div>
          </motion.div>
        )}
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.value} value={category.value} className="gap-1">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredActivities.map((activity, index) => {
              const categoryConfig = CATEGORY_CONFIGS[activity.category];
              const Icon = categoryConfig.icon;
              const isFavorite = favorites.includes(activity.id);

              return (
                <motion.div
                  key={activity.id}
                  variants={itemVariants}
                  custom={index}
                  className="group"
                >
                  <motion.div
                    variants={cardHoverVariants}
                    initial="rest"
                    whileHover="hover"
                    className="h-full"
                  >
                    <Card 
                      className="h-full overflow-hidden border border-border/50 hover:border-border cursor-pointer transition-colors"
                      onClick={() => onSelect?.(activity)}
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={activity.images[0]}
                          alt={activity.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Overlay badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <div className={cn("px-2 py-1 rounded-md text-xs font-medium", categoryConfig.color)}>
                            <Icon className="inline h-4 w-4 mr-1" aria-hidden="true" />
                            {categoryConfig.label}
                          </div>
                          
                          {activity.price?.type === 'free' && (
                            <Badge className="bg-green-500 text-white text-xs">Free</Badge>
                          )}
                          
                          {activity.difficulty && (
                            <Badge className={cn("text-xs", DIFFICULTY_COLORS[activity.difficulty])}>
                              {activity.difficulty}
                            </Badge>
                          )}
                        </div>

                        {/* Weather indicator */}
                        {activity.weatherRecommendation && (
                          <div className="absolute top-3 right-3">
                            <div 
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs",
                                activity.weatherRecommendation.suitable 
                                  ? "bg-green-500" 
                                  : "bg-orange-500"
                              )}
                              title={activity.weatherRecommendation.reason}
                            >
                              {activity.weatherRecommendation.suitable ? '☀️' : '⚠️'}
                            </div>
                          </div>
                        )}

                        {/* Favorite button */}
                        <button
                          onClick={(e) => toggleFavorite(activity.id, e)}
                          className="absolute bottom-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart 
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isFavorite && "fill-red-500 text-red-500"
                            )} 
                          />
                        </button>
                      </div>

                      <CardContent className="p-4 flex-1 flex flex-col">
                        {/* Header */}
                        <div className="mb-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold leading-tight">{activity.name}</h3>
                            <div className="flex items-center gap-1 shrink-0">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-medium text-sm">{activity.rating}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        </div>

                        {/* Location & Hours */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {activity.location.name}
                              {activity.location.walkingTime && ` • ${activity.location.walkingTime}`}
                            </span>
                          </div>
                          
                          {activity.openingHours && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {activity.openingHours.open} - {activity.openingHours.close}
                              </span>
                              <Badge 
                                variant={activity.openingHours.isOpen ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {activity.openingHours.isOpen ? "Open" : "Closed"}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Duration & Price */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {activity.duration.min === activity.duration.max 
                                ? `${activity.duration.min} ${activity.duration.unit}`
                                : `${activity.duration.min}-${activity.duration.max} ${activity.duration.unit}`
                              }
                            </span>
                          </div>
                          
                          {activity.price && (
                            <div className="text-right">
                              {activity.price.type === 'free' ? (
                                <span className="font-semibold text-green-600">Free</span>
                              ) : (
                                <div>
                                  <span className="font-semibold">${activity.price.amount}</span>
                                  <span className="text-xs text-muted-foreground">
                                    /{activity.price.type.replace('_', ' ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Features */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {activity.features.slice(0, 3).map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {activity.features.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{activity.features.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                            Details
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1 bg-primary hover:bg-primary/90"
                            onClick={(e) => addToItinerary(activity.id, e)}
                          >
                            <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                            Add to Plan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>

          {filteredActivities.length === 0 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-center py-12"
            >
              <div className="text-muted-foreground">
                No activities found for "{searchQuery}" in {selectedCategory === 'all' ? 'any category' : selectedCategory}.
              </div>
            </motion.div>
          )}

          {filteredActivities.length > 0 && (
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-center pt-6"
            >
              <Button variant="outline" size="lg">
                Load More Activities
              </Button>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}