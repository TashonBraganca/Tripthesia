"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  MapPin,
  Star,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Waves,
  Dumbbell,
  Users,
  Calendar,
  ExternalLink,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Bed,
  Bath,
  Shield,
  Award,
  TrendingUp,
  Clock,
  Zap,
  Phone,
  Globe,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  containerVariants, 
  itemVariants, 
  cardHoverVariants,
  imageVariants
} from "@/lib/motion";

// Hotel data interfaces
export interface HotelResult {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    district: string;
    landmarks: {
      name: string;
      distance: string;
      walkTime?: string;
    }[];
  };
  images: {
    main: string;
    gallery: string[];
    virtual_tour?: string;
  };
  rating: {
    overall: number;
    reviews_count: number;
    breakdown: {
      cleanliness: number;
      comfort: number;
      location: number;
      service: number;
      value: number;
    };
    recent_trend: 'up' | 'down' | 'stable';
  };
  pricing: {
    current_rate: number;
    original_rate?: number;
    currency: string;
    period: 'night' | 'total';
    taxes_included: boolean;
    free_cancellation: boolean;
    last_booked: string;
    availability: {
      rooms_left: number;
      high_demand: boolean;
      price_trend: 'rising' | 'falling' | 'stable';
    };
  };
  amenities: {
    highlighted: string[];
    all: {
      category: string;
      items: string[];
    }[];
  };
  room_types: {
    id: string;
    name: string;
    size: string;
    beds: string;
    max_guests: number;
    price: number;
    amenities: string[];
    images: string[];
    availability: number;
  }[];
  sustainability: {
    certified: boolean;
    score: number;
    practices: string[];
  };
  policies: {
    check_in: string;
    check_out: string;
    pets_allowed: boolean;
    smoking_allowed: boolean;
  };
  contact: {
    phone: string;
    website: string;
    booking_platforms: {
      name: string;
      url: string;
      price: number;
      benefits?: string[];
    }[];
  };
  reviews: {
    recent: {
      author: string;
      rating: number;
      comment: string;
      date: string;
      verified: boolean;
      helpful_votes: number;
    }[];
    highlights: string[];
    complaints: string[];
  };
}

interface EnhancedHotelCardsProps {
  hotels: HotelResult[];
  searchParams: {
    destination: string;
    checkin: Date;
    checkout: Date;
    guests: number;
    rooms: number;
  };
  onSelect?: (hotel: HotelResult) => void;
  onBooking?: (hotel: HotelResult, platform: string) => void;
  viewMode?: 'grid' | 'list';
}

export function EnhancedHotelCards({ 
  hotels, 
  searchParams, 
  onSelect, 
  onBooking,
  viewMode = 'list'
}: EnhancedHotelCardsProps) {
  const [selectedImage, setSelectedImage] = useState<{ [key: string]: number }>({});
  const [wishlistedHotels, setWishlistedHotels] = useState<Set<string>>(new Set());
  const [expandedHotels, setExpandedHotels] = useState<Set<string>>(new Set());

  const toggleWishlist = (hotelId: string) => {
    const newWishlisted = new Set(wishlistedHotels);
    if (newWishlisted.has(hotelId)) {
      newWishlisted.delete(hotelId);
    } else {
      newWishlisted.add(hotelId);
    }
    setWishlistedHotels(newWishlisted);
  };

  const toggleExpanded = (hotelId: string) => {
    const newExpanded = new Set(expandedHotels);
    if (newExpanded.has(hotelId)) {
      newExpanded.delete(hotelId);
    } else {
      newExpanded.add(hotelId);
    }
    setExpandedHotels(newExpanded);
  };

  const nextImage = (hotelId: string, totalImages: number) => {
    setSelectedImage(prev => ({
      ...prev,
      [hotelId]: ((prev[hotelId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (hotelId: string, totalImages: number) => {
    setSelectedImage(prev => ({
      ...prev,
      [hotelId]: ((prev[hotelId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const getStayDuration = () => {
    const nights = Math.ceil(
      (searchParams.checkout.getTime() - searchParams.checkin.getTime()) / (1000 * 60 * 60 * 24)
    );
    return nights;
  };

  const renderAmenityIcon = (amenity: string) => {
    const icons: { [key: string]: any } = {
      'Free WiFi': Wifi,
      'Parking': Car,
      'Breakfast': Coffee,
      'Restaurant': Utensils,
      'Pool': Waves,
      'Fitness': Dumbbell,
      '24h Reception': Clock,
      'Room Service': Zap,
      'Air Conditioning': Shield
    };

    const Icon = icons[amenity] || CheckCircle;
    return <Icon className="h-3 w-3" />;
  };

  const HotelCard = ({ hotel, index }: { hotel: HotelResult; index: number }) => {
    const currentImageIndex = selectedImage[hotel.id] || 0;
    const isExpanded = expandedHotels.has(hotel.id);
    const isWishlisted = wishlistedHotels.has(hotel.id);
    const nights = getStayDuration();
    const totalPrice = hotel.pricing.current_rate * nights;

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
                  src={hotel.images.gallery[currentImageIndex]}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Image Navigation */}
                {hotel.images.gallery.length > 1 && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => prevImage(hotel.id, hotel.images.gallery.length)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => nextImage(hotel.id, hotel.images.gallery.length)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Image Indicators */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {hotel.images.gallery.map((_, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-colors",
                            idx === currentImageIndex ? "bg-white" : "bg-white/50"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Top badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {hotel.pricing.availability.high_demand && (
                    <Badge className="bg-red-500 text-white text-xs">
                      High Demand
                    </Badge>
                  )}
                  {hotel.pricing.free_cancellation && (
                    <Badge className="bg-green-500 text-white text-xs">
                      Free Cancellation
                    </Badge>
                  )}
                  {hotel.sustainability.certified && (
                    <Badge className="bg-emerald-500 text-white text-xs gap-1">
                      <Award className="h-3 w-3" />
                      Eco
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => toggleWishlist(hotel.id)}
                  >
                    <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500 text-red-500")} />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 rounded-full p-0"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Price trend indicator */}
                <div className="absolute bottom-3 right-3">
                  {hotel.pricing.availability.price_trend === 'rising' && (
                    <Badge className="bg-amber-500 text-white text-xs gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Rising
                    </Badge>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg group-hover:text-emerald-600 transition-colors">
                          {hotel.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{hotel.location.district}, {hotel.location.city}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < hotel.rating.overall ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{hotel.rating.overall}</span>
                          {hotel.rating.recent_trend === 'up' && (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {hotel.rating.reviews_count.toLocaleString()} reviews
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    {/* Key amenities */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {hotel.amenities.highlighted.slice(0, 4).map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                          {renderAmenityIcon(amenity)}
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Landmarks */}
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground">
                        {hotel.location.landmarks.slice(0, 2).map((landmark, idx) => (
                          <span key={idx}>
                            {landmark.name} ({landmark.distance})
                            {idx < hotel.location.landmarks.slice(0, 2).length - 1 && ' • '}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {hotel.pricing.original_rate && (
                      <div className="text-sm text-muted-foreground line-through">
                        ${hotel.pricing.original_rate}
                      </div>
                    )}
                    <div className="text-2xl font-bold">
                      ${hotel.pricing.current_rate}
                    </div>
                    <div className="text-xs text-muted-foreground">per night</div>
                    <div className="text-sm font-medium">
                      ${totalPrice} total
                    </div>
                  </div>
                </div>

                {/* Availability status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hotel.pricing.availability.rooms_left <= 3 && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Only {hotel.pricing.availability.rooms_left} left
                      </Badge>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Last booked: {hotel.pricing.last_booked}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpanded(hotel.id)}
                    >
                      {isExpanded ? 'Less Details' : 'More Details'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onSelect?.(hotel)}
                      className="gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Deal
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t pt-4 space-y-4"
                    >
                      {/* Room Types */}
                      <div>
                        <h4 className="font-medium mb-2">Available Rooms</h4>
                        <div className="grid gap-2">
                          {hotel.room_types.slice(0, 2).map((room) => (
                            <div key={room.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <div className="font-medium text-sm">{room.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <Bed className="h-3 w-3" />
                                  {room.beds} • {room.size} • {room.max_guests} guests
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">${room.price}</div>
                                <div className="text-xs text-muted-foreground">
                                  {room.availability} left
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Reviews */}
                      <div>
                        <h4 className="font-medium mb-2">Recent Reviews</h4>
                        <div className="space-y-2">
                          {hotel.reviews.recent.slice(0, 2).map((review, idx) => (
                            <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {review.author.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{review.author}</div>
                                  <div className="flex items-center gap-1">
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
                                    <span className="text-xs text-muted-foreground">{review.date}</span>
                                    {review.verified && (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                "{review.comment}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Booking Platforms */}
                      <div>
                        <h4 className="font-medium mb-2">Compare Prices</h4>
                        <div className="grid gap-2">
                          {hotel.contact.booking_platforms.map((platform, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{platform.name}</span>
                                {platform.benefits && (
                                  <Badge variant="secondary" className="text-xs">
                                    {platform.benefits[0]}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold">${platform.price}</div>
                                <Button size="sm" variant="outline" onClick={() => onBooking?.(hotel, platform.name)}>
                                  Book
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
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
          <h2 className="text-2xl font-bold">Hotels in {searchParams.destination}</h2>
          <p className="text-muted-foreground">
            {format(searchParams.checkin, 'MMM dd')} - {format(searchParams.checkout, 'MMM dd')} • {searchParams.guests} guests • {searchParams.rooms} room{searchParams.rooms > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {hotels.length} hotels found
        </div>
      </div>

      {/* Hotel Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {hotels.map((hotel, index) => (
          <HotelCard key={hotel.id} hotel={hotel} index={index} />
        ))}
      </motion.div>
    </div>
  );
}