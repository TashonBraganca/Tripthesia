"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addMinutes } from "date-fns";
import {
  MapPin,
  Star,
  Clock,
  Users,
  Calendar,
  ExternalLink,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Wine,
  Coffee,
  Leaf,
  Award,
  TrendingUp,
  Phone,
  Globe,
  CheckCircle,
  AlertCircle,
  Info,
  Camera,
  MessageCircle,
  CreditCard,
  Parking,
  Accessibility,
  Wifi,
  AirVent,
  Volume2,
  Shield,
  DollarSign,
  Navigation,
  Timer,
  UserCheck
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  containerVariants, 
  itemVariants, 
  cardHoverVariants,
  imageVariants
} from "@/lib/motion";

// Restaurant data interfaces
export interface RestaurantResult {
  id: string;
  name: string;
  cuisine: {
    primary: string;
    secondary: string[];
    dietary_options: string[];
    spice_level: 'mild' | 'medium' | 'hot' | 'very_hot';
  };
  location: {
    address: string;
    city: string;
    neighborhood: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    accessibility: {
      wheelchair_accessible: boolean;
      parking_available: boolean;
      public_transport: string[];
    };
  };
  images: {
    main: string;
    gallery: string[];
    menu_images: string[];
    interior: string[];
    food: string[];
  };
  rating: {
    overall: number;
    reviews_count: number;
    breakdown: {
      food_quality: number;
      service: number;
      ambiance: number;
      value: number;
      location: number;
    };
    recent_trend: 'up' | 'down' | 'stable';
    source_ratings: {
      google: { rating: number; count: number };
      zomato?: { rating: number; count: number };
      tripadvisor?: { rating: number; count: number };
      yelp?: { rating: number; count: number };
    };
  };
  pricing: {
    price_range: '$' | '$$' | '$$$' | '$$$$';
    average_cost_per_person: {
      lunch: number;
      dinner: number;
      currency: string;
    };
    payment_methods: string[];
    service_charge: boolean;
    tips_policy: string;
  };
  hours: {
    current_status: 'open' | 'closed' | 'closing_soon';
    opening_hours: {
      [key: string]: {
        open: string;
        close: string;
        is_closed: boolean;
      };
    };
    special_hours: {
      holidays: string[];
      seasonal_changes: string[];
    };
  };
  reservations: {
    accepts_reservations: boolean;
    online_booking: boolean;
    advance_booking_days: number;
    peak_times: string[];
    wait_time_estimate: number;
    reservation_platforms: {
      name: string;
      url: string;
      instant_booking: boolean;
    }[];
  };
  menu: {
    highlights: string[];
    signature_dishes: {
      name: string;
      description: string;
      price: number;
      dietary_tags: string[];
      popularity_score: number;
    }[];
    beverages: {
      wine_selection: boolean;
      craft_cocktails: boolean;
      local_drinks: string[];
      non_alcoholic_options: string[];
    };
    dietary_accommodations: {
      vegetarian: boolean;
      vegan: boolean;
      gluten_free: boolean;
      halal: boolean;
      kosher: boolean;
      allergies_accommodated: string[];
    };
  };
  atmosphere: {
    setting: 'casual' | 'upscale' | 'fine_dining' | 'fast_casual' | 'street_food';
    noise_level: 'quiet' | 'moderate' | 'lively' | 'loud';
    dress_code: 'no_requirement' | 'smart_casual' | 'business_casual' | 'formal';
    good_for: string[];
    ambiance_tags: string[];
  };
  amenities: {
    wifi: boolean;
    air_conditioning: boolean;
    outdoor_seating: boolean;
    private_dining: boolean;
    live_music: boolean;
    delivery: boolean;
    takeaway: boolean;
    catering: boolean;
  };
  reviews: {
    recent: {
      author: string;
      rating: number;
      comment: string;
      date: string;
      verified: boolean;
      diner_type: string;
      occasion: string;
      photos?: string[];
      helpful_votes: number;
    }[];
    highlights: string[];
    common_complaints: string[];
    food_photos_count: number;
    reviewer_demographics: {
      locals_percentage: number;
      tourists_percentage: number;
      repeat_customers: number;
    };
  };
  awards: {
    michelin_guide: boolean;
    local_awards: string[];
    certifications: string[];
    featured_in: string[];
  };
  sustainability: {
    eco_friendly: boolean;
    local_sourcing: boolean;
    waste_reduction: boolean;
    sustainable_practices: string[];
  };
  contact: {
    phone: string;
    website: string;
    social_media: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
    };
    email?: string;
  };
  real_time_data: {
    current_wait_time: number;
    availability_next_2_hours: boolean;
    busy_status: 'not_busy' | 'somewhat_busy' | 'busy' | 'very_busy';
    last_updated: string;
  };
}

interface EnhancedRestaurantCardsProps {
  restaurants: RestaurantResult[];
  searchParams: {
    destination: string;
    date?: Date;
    time?: string;
    party_size: number;
    cuisine?: string;
    price_range?: string;
  };
  onSelect?: (restaurant: RestaurantResult) => void;
  onReservation?: (restaurant: RestaurantResult, platform: string) => void;
  viewMode?: 'grid' | 'list';
}

export function EnhancedRestaurantCards({
  restaurants,
  searchParams,
  onSelect,
  onReservation,
  viewMode = 'list'
}: EnhancedRestaurantCardsProps) {
  const [selectedImage, setSelectedImage] = useState<{ [key: string]: number }>({});
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Set<string>>(new Set());
  const [expandedRestaurants, setExpandedRestaurants] = useState<Set<string>>(new Set());

  const toggleFavorite = (restaurantId: string) => {
    const newFavorites = new Set(favoriteRestaurants);
    if (newFavorites.has(restaurantId)) {
      newFavorites.delete(restaurantId);
    } else {
      newFavorites.add(restaurantId);
    }
    setFavoriteRestaurants(newFavorites);
  };

  const toggleExpanded = (restaurantId: string) => {
    const newExpanded = new Set(expandedRestaurants);
    if (newExpanded.has(restaurantId)) {
      newExpanded.delete(restaurantId);
    } else {
      newExpanded.add(restaurantId);
    }
    setExpandedRestaurants(newExpanded);
  };

  const nextImage = (restaurantId: string, totalImages: number) => {
    setSelectedImage(prev => ({
      ...prev,
      [restaurantId]: ((prev[restaurantId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (restaurantId: string, totalImages: number) => {
    setSelectedImage(prev => ({
      ...prev,
      [restaurantId]: ((prev[restaurantId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const getPriceRangeColor = (priceRange: string) => {
    switch (priceRange) {
      case '$': return 'text-green-600 bg-green-100';
      case '$$': return 'text-blue-600 bg-blue-100';
      case '$$$': return 'text-amber-600 bg-amber-100';
      case '$$$$': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getBusyStatusColor = (status: string) => {
    switch (status) {
      case 'not_busy': return 'text-green-600 bg-green-100';
      case 'somewhat_busy': return 'text-yellow-600 bg-yellow-100';
      case 'busy': return 'text-orange-600 bg-orange-100';
      case 'very_busy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAvailableReservationTimes = (restaurant: RestaurantResult) => {
    if (!restaurant.reservations.accepts_reservations) return [];
    
    const now = new Date();
    const times = [];
    for (let i = 0; i < 8; i++) {
      const time = addMinutes(now, 60 + i * 30);
      if (time.getHours() >= 18 && time.getHours() <= 22) {
        times.push(format(time, 'HH:mm'));
      }
    }
    return times;
  };

  const RestaurantCard = ({ restaurant, index }: { restaurant: RestaurantResult; index: number }) => {
    const currentImageIndex = selectedImage[restaurant.id] || 0;
    const isExpanded = expandedRestaurants.has(restaurant.id);
    const isFavorite = favoriteRestaurants.has(restaurant.id);
    const availableTimes = getAvailableReservationTimes(restaurant);

    return (
      <motion.div
        variants={itemVariants}
        custom={index}
        className="group"
      >
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-border/50 hover:border-emerald-300">
          <div className={cn(
            "flex flex-col",
            viewMode === 'list' && "md:flex-row"
          )}>
            {/* Image Section */}
            <div className={cn(
              "relative overflow-hidden",
              viewMode === 'list' ? "md:w-80" : "w-full h-64"
            )}>
              <motion.div 
                variants={imageVariants}
                className="relative h-full group"
              >
                <img
                  src={restaurant.images.gallery[currentImageIndex]}
                  alt={restaurant.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Image Navigation */}
                {restaurant.images.gallery.length > 1 && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90"
                      onClick={() => prevImage(restaurant.id, restaurant.images.gallery.length)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90"
                      onClick={() => nextImage(restaurant.id, restaurant.images.gallery.length)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  <Badge className={cn("text-xs", restaurant.hours.current_status === 'open' ? 'bg-green-500 text-white' : 'bg-red-500 text-white')}>
                    {restaurant.hours.current_status === 'open' ? 'Open Now' : 'Closed'}
                  </Badge>
                  
                  {restaurant.reservations.accepts_reservations && (
                    <Badge className="bg-blue-500 text-white text-xs gap-1">
                      <Calendar className="h-3 w-3" />
                      Reservations
                    </Badge>
                  )}

                  {restaurant.awards.michelin_guide && (
                    <Badge className="bg-red-600 text-white text-xs gap-1">
                      <Award className="h-3 w-3" />
                      Michelin
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 rounded-full p-0 bg-white/90"
                    onClick={() => toggleFavorite(restaurant.id)}
                  >
                    <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 rounded-full p-0 bg-white/90"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Busy Status */}
                <div className="absolute bottom-3 right-3">
                  <Badge className={cn("text-xs", getBusyStatusColor(restaurant.real_time_data.busy_status))}>
                    {restaurant.real_time_data.busy_status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Photo Count */}
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  {restaurant.reviews.food_photos_count}
                </div>
              </motion.div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg group-hover:text-emerald-600 transition-colors">
                          {restaurant.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Utensils className="h-3 w-3" />
                          <span>{restaurant.cuisine.primary}</span>
                          {restaurant.cuisine.secondary.length > 0 && (
                            <span>• {restaurant.cuisine.secondary[0]}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{restaurant.location.neighborhood}</span>
                          <Badge className={cn("text-xs ml-2", getPriceRangeColor(restaurant.pricing.price_range))}>
                            {restaurant.pricing.price_range}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-4 w-4",
                              i < restaurant.rating.overall ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{restaurant.rating.overall}</span>
                      {restaurant.rating.recent_trend === 'up' && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {restaurant.rating.reviews_count.toLocaleString()} reviews
                    </div>
                    <div className="text-sm font-medium">
                      ${restaurant.pricing.average_cost_per_person.dinner} per person
                    </div>
                  </div>
                </div>

                {/* Signature Dishes */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Signature Dishes</h4>
                  <div className="flex flex-wrap gap-1">
                    {restaurant.menu.signature_dishes.slice(0, 3).map((dish, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {dish.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Good For & Atmosphere */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    {restaurant.atmosphere.good_for.slice(0, 2).map((purpose, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {purpose}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Volume2 className="h-3 w-3" />
                    <span className="capitalize">{restaurant.atmosphere.noise_level.replace('_', ' ')}</span>
                  </div>

                  {restaurant.amenities.outdoor_seating && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <Leaf className="h-3 w-3" />
                      <span>Outdoor Seating</span>
                    </div>
                  )}
                </div>

                {/* Real-time Availability */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {restaurant.real_time_data.current_wait_time > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Timer className="h-4 w-4 text-orange-500" />
                        <span>{restaurant.real_time_data.current_wait_time} min wait</span>
                      </div>
                    )}

                    {restaurant.real_time_data.availability_next_2_hours && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Available now</span>
                      </div>
                    )}

                    {restaurant.reviews.reviewer_demographics.locals_percentage > 70 && (
                      <Badge variant="secondary" className="text-xs">
                        Local favorite
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpanded(restaurant.id)}
                    >
                      {isExpanded ? 'Less Details' : 'More Details'}
                    </Button>
                    
                    {restaurant.reservations.accepts_reservations ? (
                      <Button
                        size="sm"
                        onClick={() => onReservation?.(restaurant, 'OpenTable')}
                        className="gap-1"
                      >
                        <Calendar className="h-3 w-3" />
                        Reserve
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onSelect?.(restaurant)}
                        className="gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        Call
                      </Button>
                    )}
                  </div>
                </div>

                {/* Quick Reservation Times */}
                {restaurant.reservations.accepts_reservations && availableTimes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Available Today</h4>
                    <div className="flex gap-2 flex-wrap">
                      {availableTimes.slice(0, 4).map((time, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => onReservation?.(restaurant, 'OpenTable')}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t pt-4"
                    >
                      <Tabs defaultValue="menu" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="menu" className="text-xs">Menu</TabsTrigger>
                          <TabsTrigger value="reviews" className="text-xs">Reviews</TabsTrigger>
                          <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                          <TabsTrigger value="book" className="text-xs">Book</TabsTrigger>
                        </TabsList>

                        <TabsContent value="menu" className="space-y-4">
                          {/* Signature Dishes Detail */}
                          <div>
                            <h5 className="font-medium mb-2">Must-Try Dishes</h5>
                            <div className="space-y-2">
                              {restaurant.menu.signature_dishes.slice(0, 4).map((dish, idx) => (
                                <div key={idx} className="flex items-start justify-between p-2 bg-muted/50 rounded">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{dish.name}</div>
                                    <div className="text-xs text-muted-foreground">{dish.description}</div>
                                    <div className="flex items-center gap-1 mt-1">
                                      {dish.dietary_tags.map((tag, tagIdx) => (
                                        <Badge key={tagIdx} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold">${dish.price}</div>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                      <span className="text-xs">{dish.popularity_score}%</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Dietary Options */}
                          <div>
                            <h5 className="font-medium mb-2">Dietary Options</h5>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(restaurant.menu.dietary_accommodations)
                                .filter(([_, available]) => available === true)
                                .map(([option, _], idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {option.replace('_', ' ')}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="reviews" className="space-y-4">
                          {/* Rating Breakdown */}
                          <div>
                            <h5 className="font-medium mb-2">Rating Breakdown</h5>
                            <div className="space-y-2">
                              {Object.entries(restaurant.rating.breakdown).map(([aspect, rating]) => (
                                <div key={aspect} className="flex items-center justify-between">
                                  <span className="text-sm capitalize">{aspect.replace('_', ' ')}</span>
                                  <div className="flex items-center gap-2">
                                    <Progress value={rating * 20} className="w-16 h-2" />
                                    <span className="text-sm font-medium w-8">{rating}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Recent Reviews */}
                          <div>
                            <h5 className="font-medium mb-2">Recent Reviews</h5>
                            <div className="space-y-3">
                              {restaurant.reviews.recent.slice(0, 3).map((review, idx) => (
                                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {review.author.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <div className="font-medium text-sm">{review.author}</div>
                                        <div className="text-xs text-muted-foreground">{review.date}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="flex">
                                          {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                              key={i}
                                              className={cn(
                                                "h-3 w-3",
                                                i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                                              )}
                                            />
                                          ))}
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                          {review.diner_type}
                                        </Badge>
                                        {review.verified && (
                                          <CheckCircle className="h-3 w-3 text-green-500" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground">"{review.comment}"</p>
                                  {review.occasion && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Occasion: {review.occasion}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="details" className="space-y-4">
                          {/* Opening Hours */}
                          <div>
                            <h5 className="font-medium mb-2">Opening Hours</h5>
                            <div className="space-y-1 text-sm">
                              {Object.entries(restaurant.hours.opening_hours).map(([day, hours]) => (
                                <div key={day} className="flex justify-between">
                                  <span className="capitalize">{day}</span>
                                  <span>{hours.is_closed ? 'Closed' : `${hours.open} - ${hours.close}`}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Amenities */}
                          <div>
                            <h5 className="font-medium mb-2">Amenities</h5>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {Object.entries(restaurant.amenities)
                                .filter(([_, available]) => available === true)
                                .map(([amenity, _]) => (
                                  <div key={amenity} className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span className="capitalize">{amenity.replace('_', ' ')}</span>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Contact */}
                          <div>
                            <h5 className="font-medium mb-2">Contact</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{restaurant.contact.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <span>{restaurant.contact.website}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{restaurant.location.address}</span>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="book" className="space-y-4">
                          {restaurant.reservations.accepts_reservations ? (
                            <div>
                              <h5 className="font-medium mb-2">Make a Reservation</h5>
                              <div className="space-y-3">
                                {restaurant.reservations.reservation_platforms.map((platform, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-blue-500" />
                                      <div>
                                        <div className="font-medium text-sm">{platform.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {platform.instant_booking ? 'Instant booking' : 'Confirmation required'}
                                        </div>
                                      </div>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      onClick={() => onReservation?.(restaurant, platform.name)}
                                    >
                                      Book Now
                                    </Button>
                                  </div>
                                ))}
                                
                                <div className="text-xs text-muted-foreground">
                                  <Info className="h-3 w-3 inline mr-1" />
                                  Reservations accepted up to {restaurant.reservations.advance_booking_days} days in advance
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                              <h5 className="font-medium mb-1">No Reservations</h5>
                              <p className="text-sm text-muted-foreground">
                                This restaurant operates on a first-come, first-served basis
                              </p>
                              <div className="mt-4 space-y-2">
                                <Button size="sm" className="w-full gap-1" onClick={() => onSelect?.(restaurant)}>
                                  <Phone className="h-3 w-3" />
                                  Call Restaurant
                                </Button>
                                <Button size="sm" variant="outline" className="w-full gap-1">
                                  <Navigation className="h-3 w-3" />
                                  Get Directions
                                </Button>
                              </div>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Restaurants in {searchParams.destination}</h2>
          <p className="text-muted-foreground">
            {searchParams.date && format(searchParams.date, 'MMM dd, yyyy')}
            {searchParams.time && ` • ${searchParams.time}`}
            • {searchParams.party_size} {searchParams.party_size === 1 ? 'person' : 'people'}
            {searchParams.cuisine && ` • ${searchParams.cuisine}`}
            {searchParams.price_range && ` • ${searchParams.price_range}`}
          </p>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {restaurants.length} restaurants found
        </div>
      </div>

      {/* Restaurant Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {restaurants.map((restaurant, index) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} index={index} />
        ))}
      </motion.div>
    </div>
  );
}