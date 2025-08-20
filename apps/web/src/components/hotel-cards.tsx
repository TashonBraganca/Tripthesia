"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Star, 
  Users, 
  Calendar,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  UtensilsCrossed,
  Shield,
  Heart,
  Share2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  ArrowUpDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  containerVariants, 
  itemVariants, 
  cardHoverVariants
} from "@/lib/motion";

interface Hotel {
  id: string;
  name: string;
  description: string;
  location: {
    name: string;
    district: string;
    walkingTime: string;
  };
  rating: number;
  reviewCount: number;
  price: {
    amount: number;
    currency: string;
    per: string;
  };
  originalPrice?: number;
  images: string[];
  amenities: string[];
  features: {
    freeWifi?: boolean;
    parking?: boolean;
    breakfast?: boolean;
    gym?: boolean;
    pool?: boolean;
    restaurant?: boolean;
    roomService?: boolean;
    airConditioning?: boolean;
  };
  roomTypes: string[];
  cancellation: {
    free: boolean;
    deadline?: string;
  };
  bookingUrl: string;
  isSponsored?: boolean;
  sustainabilityScore?: number;
}

interface HotelCardsProps {
  hotels: Hotel[];
  onSelect?: (hotel: Hotel) => void;
  onFavorite?: (hotelId: string) => void;
  favorites?: string[];
  className?: string;
}

const AMENITY_ICONS = {
  'Free WiFi': Wifi,
  'Parking': Car, 
  'Breakfast': Coffee,
  'Gym': Dumbbell,
  'Pool': Waves,
  'Restaurant': UtensilsCrossed,
  'Room Service': Shield,
};

// Mock hotel data
const MOCK_HOTELS: Hotel[] = [
  {
    id: '1',
    name: 'Grand Plaza Hotel',
    description: 'Luxury hotel in the heart of downtown with panoramic city views',
    location: {
      name: 'Downtown',
      district: 'Financial District',
      walkingTime: '5 min to attractions'
    },
    rating: 4.8,
    reviewCount: 2341,
    price: { amount: 299, currency: 'USD', per: 'night' },
    originalPrice: 399,
    images: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=500&h=300&fit=crop',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=500&h=300&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&h=300&fit=crop'
    ],
    amenities: ['Free WiFi', 'Pool', 'Gym', 'Restaurant', 'Room Service'],
    features: {
      freeWifi: true,
      pool: true,
      gym: true,
      restaurant: true,
      roomService: true,
      airConditioning: true
    },
    roomTypes: ['Standard Room', 'Deluxe Suite', 'Executive Floor'],
    cancellation: { free: true, deadline: '24 hours' },
    bookingUrl: '#',
    isSponsored: true,
    sustainabilityScore: 85
  },
  {
    id: '2', 
    name: 'Boutique Garden Inn',
    description: 'Charming boutique hotel with garden courtyard and personalized service',
    location: {
      name: 'Arts Quarter',
      district: 'Creative District',
      walkingTime: '10 min to museums'
    },
    rating: 4.6,
    reviewCount: 892,
    price: { amount: 189, currency: 'USD', per: 'night' },
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&h=300&fit=crop',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&h=300&fit=crop'
    ],
    amenities: ['Free WiFi', 'Breakfast', 'Parking', 'Restaurant'],
    features: {
      freeWifi: true,
      parking: true,
      breakfast: true,
      restaurant: true,
      airConditioning: true
    },
    roomTypes: ['Garden Room', 'Courtyard Suite'],
    cancellation: { free: true, deadline: '48 hours' },
    bookingUrl: '#',
    sustainabilityScore: 92
  },
  {
    id: '3',
    name: 'Modern City Suites',
    description: 'Contemporary all-suite hotel with kitchenettes and business center',
    location: {
      name: 'Business District',
      district: 'CBD',
      walkingTime: '2 min to metro'
    },
    rating: 4.4,
    reviewCount: 1567,
    price: { amount: 159, currency: 'USD', per: 'night' },
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500&h=300&fit=crop',
      'https://images.unsplash.com/photo-1590490360146-643285c0b49d?w=500&h=300&fit=crop'
    ],
    amenities: ['Free WiFi', 'Gym', 'Parking', 'Business Center'],
    features: {
      freeWifi: true,
      parking: true,
      gym: true,
      airConditioning: true
    },
    roomTypes: ['Studio Suite', 'One Bedroom Suite'],
    cancellation: { free: false },
    bookingUrl: '#',
    sustainabilityScore: 78
  }
];

export function HotelCards({ 
  hotels = MOCK_HOTELS, 
  onSelect, 
  onFavorite, 
  favorites = [], 
  className 
}: HotelCardsProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<{[key: string]: number}>({});

  const nextImage = (hotelId: string, imageCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex(prev => ({
      ...prev,
      [hotelId]: ((prev[hotelId] || 0) + 1) % imageCount
    }));
  };

  const prevImage = (hotelId: string, imageCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex(prev => ({
      ...prev,
      [hotelId]: ((prev[hotelId] || 0) - 1 + imageCount) % imageCount
    }));
  };

  const toggleFavorite = (hotelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(hotelId);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hotels & Accommodations</h2>
          <p className="text-muted-foreground">{hotels.length} properties available</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Sort
          </Button>
        </div>
      </div>

      {/* Hotel Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {hotels.map((hotel, index) => {
          const currentImageIndex = selectedImageIndex[hotel.id] || 0;
          const isFavorite = favorites.includes(hotel.id);

          return (
            <motion.div
              key={hotel.id}
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
                  onClick={() => onSelect?.(hotel)}
                >
                  {/* Image Gallery */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={`${hotel.id}-${currentImageIndex}`}
                        src={hotel.images[currentImageIndex]}
                        alt={hotel.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </AnimatePresence>

                    {/* Image Navigation */}
                    {hotel.images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => prevImage(hotel.id, hotel.images.length, e)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => nextImage(hotel.id, hotel.images.length, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        {/* Image Indicators */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {hotel.images.map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full transition-colors",
                                i === currentImageIndex ? "bg-white" : "bg-white/50"
                              )}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Overlay badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {hotel.isSponsored && (
                        <Badge className="bg-blue-500 text-white text-xs">Sponsored</Badge>
                      )}
                      {hotel.sustainabilityScore && hotel.sustainabilityScore > 80 && (
                        <Badge className="bg-green-500 text-white text-xs">Eco-Friendly</Badge>
                      )}
                      {hotel.originalPrice && (
                        <Badge className="bg-red-500 text-white text-xs">
                          -{Math.round((1 - hotel.price.amount / hotel.originalPrice) * 100)}%
                        </Badge>
                      )}
                    </div>

                    {/* Favorite button */}
                    <button
                      onClick={(e) => toggleFavorite(hotel.id, e)}
                      className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart 
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isFavorite && "fill-red-500 text-red-500"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <CardContent className="p-4 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg leading-tight">{hotel.name}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-medium text-sm">{hotel.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({hotel.reviewCount})
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {hotel.description}
                      </p>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 mb-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {hotel.location.name} • {hotel.location.walkingTime}
                      </span>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {hotel.amenities.slice(0, 4).map((amenity) => {
                        const IconComponent = AMENITY_ICONS[amenity as keyof typeof AMENITY_ICONS];
                        return (
                          <div
                            key={amenity}
                            className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md"
                            title={amenity}
                          >
                            {IconComponent && <IconComponent className="h-3 w-3" />}
                            <span className="text-xs">{amenity}</span>
                          </div>
                        );
                      })}
                      {hotel.amenities.length > 4 && (
                        <div className="flex items-center px-2 py-1 bg-muted/50 rounded-md">
                          <span className="text-xs">+{hotel.amenities.length - 4} more</span>
                        </div>
                      )}
                    </div>

                    {/* Cancellation */}
                    <div className="mb-4">
                      {hotel.cancellation.free ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Shield className="h-3 w-3" />
                          <span className="text-xs">
                            Free cancellation {hotel.cancellation.deadline && `until ${hotel.cancellation.deadline}`}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Non-refundable</div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mt-auto flex items-end justify-between">
                      <div>
                        {hotel.originalPrice && (
                          <div className="text-xs text-muted-foreground line-through">
                            ${hotel.originalPrice}
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">${hotel.price.amount}</span>
                          <span className="text-sm text-muted-foreground">/{hotel.price.per}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Load More */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="text-center pt-4"
      >
        <Button variant="outline" size="lg">
          Load More Hotels
        </Button>
      </motion.div>
    </div>
  );
}