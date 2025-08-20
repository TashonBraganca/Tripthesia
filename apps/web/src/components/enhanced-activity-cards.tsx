"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
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
  Shield,
  Award,
  TrendingUp,
  Camera,
  Headphones,
  Car,
  Utensils,
  Ticket,
  AlertCircle,
  CheckCircle,
  Info,
  Globe,
  Phone,
  MessageCircle,
  Zap,
  Sun,
  CloudRain
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

// Activity data interfaces
export interface ActivityResult {
  id: string;
  title: string;
  provider: string;
  category: {
    main: string;
    subcategory: string;
    tags: string[];
  };
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    meeting_point?: string;
    transportation: string[];
  };
  images: {
    main: string;
    gallery: string[];
    video_preview?: string;
  };
  pricing: {
    from_price: number;
    currency: string;
    discounts: {
      type: string;
      percentage: number;
      original_price: number;
    }[];
    group_discounts: boolean;
    free_cancellation: {
      available: boolean;
      deadline: string;
    };
  };
  duration: {
    total_duration: string;
    activity_duration: string;
    includes_transport: boolean;
    flexible_timing: boolean;
  };
  schedule: {
    available_times: string[];
    seasonal: boolean;
    weather_dependent: boolean;
    advance_booking: string;
  };
  rating: {
    overall: number;
    count: number;
    breakdown: {
      experience: number;
      guide_quality: number;
      value_for_money: number;
      organization: number;
      safety: number;
    };
    recent_trend: 'up' | 'down' | 'stable';
    source_ratings: {
      platform: string;
      rating: number;
      count: number;
    }[];
  };
  highlights: string[];
  includes: {
    category: string;
    items: string[];
  }[];
  requirements: {
    age_limit: {
      min?: number;
      max?: number;
    };
    fitness_level: 'low' | 'moderate' | 'high';
    special_requirements: string[];
    what_to_bring: string[];
    not_suitable_for: string[];
  };
  availability: {
    instant_booking: boolean;
    spots_left: number;
    popular_times: string[];
    last_booking: string;
    booking_trend: 'high' | 'normal' | 'low';
  };
  reviews: {
    recent: {
      author: string;
      rating: number;
      comment: string;
      date: string;
      verified: boolean;
      traveler_type: string;
      images?: string[];
      helpful_votes: number;
    }[];
    highlights: string[];
    common_complaints: string[];
    photo_count: number;
  };
  booking: {
    platforms: {
      name: string;
      url: string;
      price: number;
      instant_confirmation: boolean;
      mobile_ticket: boolean;
      benefits?: string[];
    }[];
    contact: {
      phone?: string;
      email?: string;
      whatsapp?: string;
    };
  };
  safety: {
    covid_measures: string[];
    insurance_included: boolean;
    safety_equipment: string[];
    guide_certified: boolean;
  };
  sustainability: {
    eco_friendly: boolean;
    local_community_support: boolean;
    carbon_offset: boolean;
    practices: string[];
  };
}

interface EnhancedActivityCardsProps {
  activities: ActivityResult[];
  searchParams: {
    destination: string;
    date: Date;
    travelers: number;
  };
  onSelect?: (activity: ActivityResult) => void;
  onBooking?: (activity: ActivityResult, platform: string) => void;
  viewMode?: 'grid' | 'list';
}

export function EnhancedActivityCards({
  activities,
  searchParams,
  onSelect,
  onBooking,
  viewMode = 'list'
}: EnhancedActivityCardsProps) {
  const [selectedImage, setSelectedImage] = useState<{ [key: string]: number }>({});
  const [wishlistedActivities, setWishlistedActivities] = useState<Set<string>>(new Set());
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<{ [key: string]: Date }>({});

  const toggleWishlist = (activityId: string) => {
    const newWishlisted = new Set(wishlistedActivities);
    if (newWishlisted.has(activityId)) {
      newWishlisted.delete(activityId);
    } else {
      newWishlisted.add(activityId);
    }
    setWishlistedActivities(newWishlisted);
  };

  const toggleExpanded = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const nextImage = (activityId: string, totalImages: number) => {
    setSelectedImage(prev => ({
      ...prev,
      [activityId]: ((prev[activityId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (activityId: string, totalImages: number) => {
    setSelectedImage(prev => ({
      ...prev,
      [activityId]: ((prev[activityId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      'Tours': Camera,
      'Audio Guides': Headphones,
      'Transportation': Car,
      'Food & Drink': Utensils,
      'Attractions': Ticket,
      'Outdoor': Sun,
      'Entertainment': Star
    };
    return icons[category] || Camera;
  };

  const getFitnessLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-amber-600 bg-amber-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const ActivityCard = ({ activity, index }: { activity: ActivityResult; index: number }) => {
    const currentImageIndex = selectedImage[activity.id] || 0;
    const isExpanded = expandedActivities.has(activity.id);
    const isWishlisted = wishlistedActivities.has(activity.id);
    const CategoryIcon = getCategoryIcon(activity.category.main);

    const selectedActivityDate = selectedDate[activity.id] || searchParams.date;
    const discountedPrice = activity.pricing.discounts.length > 0 
      ? activity.pricing.discounts[0].original_price 
      : activity.pricing.from_price;
    const discount = activity.pricing.discounts[0];

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
                  src={activity.images.gallery[currentImageIndex]}
                  alt={activity.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Image Navigation */}
                {activity.images.gallery.length > 1 && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => prevImage(activity.id, activity.images.gallery.length)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => nextImage(activity.id, activity.images.gallery.length)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Image Counter */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {currentImageIndex + 1}/{activity.images.gallery.length}
                    </div>
                  </>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-black/70 text-white text-xs gap-1">
                    <CategoryIcon className="h-3 w-3" />
                    {activity.category.main}
                  </Badge>
                </div>

                {/* Top badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-1">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 rounded-full p-0 bg-white/90"
                      onClick={() => toggleWishlist(activity.id)}
                    >
                      <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500 text-red-500")} />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 rounded-full p-0 bg-white/90"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {activity.availability.instant_booking && (
                    <Badge className="bg-green-500 text-white text-xs gap-1">
                      <Zap className="h-3 w-3" />
                      Instant
                    </Badge>
                  )}
                  {activity.schedule.weather_dependent && (
                    <Badge className="bg-blue-500 text-white text-xs gap-1">
                      <CloudRain className="h-3 w-3" />
                      Weather
                    </Badge>
                  )}
                </div>

                {/* Discount Badge */}
                {discount && (
                  <div className="absolute bottom-3 left-3">
                    <Badge className="bg-red-500 text-white text-xs">
                      {discount.percentage}% OFF
                    </Badge>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-lg group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {activity.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{activity.location.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{activity.duration.total_duration}</span>
                      {activity.duration.includes_transport && (
                        <Badge variant="secondary" className="text-xs">+ Transport</Badge>
                      )}
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
                              i < activity.rating.overall ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{activity.rating.overall}</span>
                      {activity.rating.recent_trend === 'up' && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.rating.count.toLocaleString()} reviews
                    </div>
                    {activity.reviews.photo_count > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {activity.reviews.photo_count} photos
                      </div>
                    )}
                  </div>
                </div>

                {/* Highlights */}
                <div className="flex flex-wrap gap-1">
                  {activity.highlights.slice(0, 3).map((highlight, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {highlight}
                    </Badge>
                  ))}
                  {activity.highlights.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{activity.highlights.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Requirements */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1 text-xs">
                    <Users className="h-3 w-3" />
                    {activity.requirements.age_limit.min && (
                      <span>Age {activity.requirements.age_limit.min}+</span>
                    )}
                    {!activity.requirements.age_limit.min && <span>All ages</span>}
                  </div>
                  <Badge className={cn("text-xs", getFitnessLevelColor(activity.requirements.fitness_level))}>
                    {activity.requirements.fitness_level} fitness
                  </Badge>
                  {activity.safety.guide_certified && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Shield className="h-3 w-3" />
                      Certified Guide
                    </div>
                  )}
                </div>

                {/* Availability Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {activity.availability.spots_left <= 5 && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {activity.availability.spots_left} spots left
                      </Badge>
                    )}
                    {activity.availability.booking_trend === 'high' && (
                      <Badge className="bg-orange-500 text-white text-xs">
                        High demand
                      </Badge>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Last booked: {activity.availability.last_booking}
                    </div>
                  </div>

                  <div className="text-right">
                    {discount && (
                      <div className="text-sm text-muted-foreground line-through">
                        ${discount.original_price}
                      </div>
                    )}
                    <div className="text-2xl font-bold">
                      from ${activity.pricing.from_price}
                    </div>
                    <div className="text-xs text-muted-foreground">per person</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(activity.id)}
                  >
                    {isExpanded ? 'Less Details' : 'More Details'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSelect?.(activity)}
                    className="gap-1 flex-1"
                  >
                    <Calendar className="h-3 w-3" />
                    Check Availability
                  </Button>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t pt-4"
                    >
                      <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                          <TabsTrigger value="reviews" className="text-xs">Reviews</TabsTrigger>
                          <TabsTrigger value="booking" className="text-xs">Booking</TabsTrigger>
                          <TabsTrigger value="schedule" className="text-xs">Schedule</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-4">
                          {/* What's Included */}
                          <div>
                            <h5 className="font-medium mb-2">What's Included</h5>
                            <div className="space-y-2">
                              {activity.includes.map((category, idx) => (
                                <div key={idx}>
                                  <div className="text-sm font-medium">{category.category}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {category.items.join(', ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Requirements */}
                          <div>
                            <h5 className="font-medium mb-2">Requirements</h5>
                            <div className="space-y-2 text-sm">
                              {activity.requirements.what_to_bring.length > 0 && (
                                <div>
                                  <span className="font-medium">Bring: </span>
                                  {activity.requirements.what_to_bring.join(', ')}
                                </div>
                              )}
                              {activity.requirements.not_suitable_for.length > 0 && (
                                <div>
                                  <span className="font-medium text-red-600">Not suitable for: </span>
                                  {activity.requirements.not_suitable_for.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Safety & Sustainability */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium mb-2 flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                Safety
                              </h5>
                              <div className="space-y-1 text-xs">
                                {activity.safety.covid_measures.map((measure, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    {measure}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {activity.sustainability.eco_friendly && (
                              <div>
                                <h5 className="font-medium mb-2 flex items-center gap-1">
                                  <Award className="h-4 w-4 text-green-600" />
                                  Sustainability
                                </h5>
                                <div className="space-y-1 text-xs">
                                  {activity.sustainability.practices.map((practice, idx) => (
                                    <div key={idx} className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                      {practice}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="reviews" className="space-y-4">
                          {/* Rating Breakdown */}
                          <div>
                            <h5 className="font-medium mb-2">Rating Breakdown</h5>
                            <div className="space-y-2">
                              {Object.entries(activity.rating.breakdown).map(([aspect, rating]) => (
                                <div key={aspect} className="flex items-center justify-between">
                                  <span className="text-sm capitalize">{aspect.replace('_', ' ')}</span>
                                  <div className="flex items-center gap-2">
                                    <Progress value={rating * 20} className="w-20 h-2" />
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
                              {activity.reviews.recent.slice(0, 3).map((review, idx) => (
                                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Avatar className="h-8 w-8">
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
                                          {review.traveler_type}
                                        </Badge>
                                        {review.verified && (
                                          <CheckCircle className="h-3 w-3 text-green-500" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">"{review.comment}"</p>
                                  {review.helpful_votes > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {review.helpful_votes} people found this helpful
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="booking" className="space-y-4">
                          {/* Booking Platforms */}
                          <div>
                            <h5 className="font-medium mb-2">Book Through</h5>
                            <div className="space-y-2">
                              {activity.booking.platforms.map((platform, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded">
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium text-sm">{platform.name}</div>
                                      <div className="flex items-center gap-2">
                                        {platform.instant_confirmation && (
                                          <Badge className="bg-green-100 text-green-700 text-xs">
                                            Instant confirm
                                          </Badge>
                                        )}
                                        {platform.mobile_ticket && (
                                          <Badge variant="secondary" className="text-xs">
                                            Mobile ticket
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      <div className="font-bold">${platform.price}</div>
                                      {platform.benefits && (
                                        <div className="text-xs text-green-600">
                                          {platform.benefits[0]}
                                        </div>
                                      )}
                                    </div>
                                    <Button 
                                      size="sm" 
                                      onClick={() => onBooking?.(activity, platform.name)}
                                    >
                                      Book
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Contact Options */}
                          {(activity.booking.contact.phone || activity.booking.contact.whatsapp) && (
                            <div>
                              <h5 className="font-medium mb-2">Contact Directly</h5>
                              <div className="flex gap-2">
                                {activity.booking.contact.phone && (
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Phone className="h-3 w-3" />
                                    Call
                                  </Button>
                                )}
                                {activity.booking.contact.whatsapp && (
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <MessageCircle className="h-3 w-3" />
                                    WhatsApp
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="schedule" className="space-y-4">
                          {/* Available Times */}
                          <div>
                            <h5 className="font-medium mb-2">Available Times</h5>
                            <div className="grid grid-cols-3 gap-2">
                              {activity.schedule.available_times.map((time, idx) => (
                                <Button key={idx} variant="outline" size="sm" className="text-xs">
                                  {time}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Booking Requirements */}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-blue-500" />
                              <span>Book {activity.schedule.advance_booking} in advance</span>
                            </div>
                            {activity.schedule.weather_dependent && (
                              <div className="flex items-center gap-2">
                                <CloudRain className="h-4 w-4 text-blue-500" />
                                <span>Activity depends on weather conditions</span>
                              </div>
                            )}
                            {activity.pricing.free_cancellation.available && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Free cancellation until {activity.pricing.free_cancellation.deadline}</span>
                              </div>
                            )}
                          </div>
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
          <h2 className="text-2xl font-bold">Activities in {searchParams.destination}</h2>
          <p className="text-muted-foreground">
            {format(searchParams.date, 'MMM dd, yyyy')} • {searchParams.travelers} traveler{searchParams.travelers > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {activities.length} activities found
        </div>
      </div>

      {/* Activity Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {activities.map((activity, index) => (
          <ActivityCard key={activity.id} activity={activity} index={index} />
        ))}
      </motion.div>
    </div>
  );
}