"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  Quote, 
  MapPin, 
  Calendar,
  Users,
  Shield,
  Award,
  CheckCircle,
  Globe,
  Plane,
  ChevronLeft,
  ChevronRight,
  Twitter,
  Instagram,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  cardHoverVariants,
  slideVariants
} from "@/lib/motion";

interface Testimonial {
  id: string;
  name: string;
  username: string;
  avatar: string;
  location: string;
  trip: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  platform: "tripthesia" | "twitter" | "instagram";
  images?: string[];
  likes?: number;
}

interface Partner {
  id: string;
  name: string;
  logo: string;
  category: "booking" | "transport" | "activity" | "payment" | "security";
  description: string;
  verified: boolean;
}

interface TrustIndicator {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Chen",
    username: "@sarahwanders",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b9c31d67?w=150&h=150&fit=crop&crop=face",
    location: "San Francisco, CA",
    trip: "Tokyo & Kyoto, Japan",
    rating: 5,
    text: "Tripthesia planned our perfect 10-day Japan adventure! The AI suggestions were spot-on and saved us weeks of research. Every restaurant and activity was exactly what we were looking for.",
    date: "March 2024",
    verified: true,
    platform: "tripthesia",
    images: ["https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300&h=200&fit=crop"],
    likes: 247
  },
  {
    id: "2", 
    name: "Marcus Johnson",
    username: "@marcusexplores",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    location: "London, UK",
    trip: "Bali & Singapore",
    rating: 5,
    text: "As a frequent business traveler, I was skeptical about AI trip planning. Tripthesia blew me away - it found hidden gems I never would have discovered and optimized everything perfectly.",
    date: "February 2024",
    verified: true,
    platform: "twitter",
    likes: 189
  },
  {
    id: "3",
    name: "Emma Rodriguez",
    username: "@emmaeats",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    location: "Barcelona, Spain", 
    trip: "Thailand Adventure",
    rating: 5,
    text: "The real-time updates during our trip were game-changing! When it rained in Bangkok, Tripthesia instantly suggested indoor activities and rerouted our whole day seamlessly.",
    date: "January 2024",
    verified: true,
    platform: "instagram",
    images: ["https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=300&h=200&fit=crop"],
    likes: 321
  },
  {
    id: "4",
    name: "David Kim", 
    username: "@davidkadventures",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    location: "Seoul, South Korea",
    trip: "European Grand Tour",
    rating: 5,
    text: "Planned our month-long European adventure through 8 countries. The budget optimization saved us over $3000 while hitting every must-see spot. Absolutely incredible!",
    date: "December 2023",
    verified: true,
    platform: "tripthesia",
    likes: 156
  },
  {
    id: "5",
    name: "Lisa Thompson",
    username: "@lisaloves2travel",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
    location: "Sydney, Australia",
    trip: "Morocco Explorer",
    rating: 4,
    text: "The collaborative planning feature was perfect for our group of 6. Everyone could add preferences and Tripthesia balanced everything beautifully. Our Morocco trip was unforgettable!",
    date: "November 2023",
    verified: true,
    platform: "twitter",
    likes: 203
  }
];

const PARTNERS: Partner[] = [
  {
    id: "booking",
    name: "Booking.com",
    logo: "🏨",
    category: "booking",
    description: "500M+ accommodation listings worldwide",
    verified: true
  },
  {
    id: "skyscanner",
    name: "Skyscanner", 
    logo: "✈️",
    category: "transport",
    description: "Compare flights from 1000+ airlines",
    verified: true
  },
  {
    id: "viator",
    name: "Viator",
    logo: "🎟️", 
    category: "activity",
    description: "300,000+ activities and experiences",
    verified: true
  },
  {
    id: "stripe",
    name: "Stripe",
    logo: "💳",
    category: "payment", 
    description: "Secure payments processing",
    verified: true
  },
  {
    id: "agoda",
    name: "Agoda",
    logo: "🏩",
    category: "booking",
    description: "2M+ properties in Asia Pacific",
    verified: true
  },
  {
    id: "getyourguide",
    name: "GetYourGuide",
    logo: "🎭",
    category: "activity",
    description: "Curated experiences in 170+ countries", 
    verified: true
  }
];

const TRUST_INDICATORS: TrustIndicator[] = [
  {
    id: "security",
    icon: <Shield className="h-5 w-5 text-green-500" />,
    title: "Bank-Level Security",
    description: "256-bit SSL encryption & SOC 2 compliance"
  },
  {
    id: "privacy",
    icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
    title: "GDPR Compliant",
    description: "Your data privacy is our top priority"
  },
  {
    id: "support",
    icon: <Users className="h-5 w-5 text-purple-500" />,
    title: "24/7 Support",
    description: "Human support team available anytime",
    badge: "99.9% uptime"
  },
  {
    id: "award",
    icon: <Award className="h-5 w-5 text-amber-500" />,
    title: "Award Winning", 
    description: "Best Travel Tech Innovation 2024",
    badge: "TechCrunch"
  }
];

export function EnhancedSocialProof() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentTestimonial(prev => (prev + 1) % TESTIMONIALS.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  const nextTestimonial = () => {
    setDirection(1);
    setCurrentTestimonial(prev => (prev + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentTestimonial(prev => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const getPlatformIcon = (platform: Testimonial['platform']) => {
    switch (platform) {
      case 'twitter': return <Twitter className="h-3 w-3 text-sky-500" />;
      case 'instagram': return <Instagram className="h-3 w-3 text-pink-500" />;
      default: return <Globe className="h-3 w-3 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-12">
      {/* Featured Testimonials Carousel */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2">Loved by Travelers Worldwide</h3>
          <p className="text-muted-foreground">
            Join thousands of happy travelers who trust Tripthesia
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial Display */}
          <div className="relative h-[400px] overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentTestimonial}
                custom={direction}
                variants={slideVariants.fromRight}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <TestimonialCard testimonial={TESTIMONIALS[currentTestimonial]} featured />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prevTestimonial}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentTestimonial 
                      ? "bg-emerald-500 w-6" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
            
            <button
              onClick={nextTestimonial}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Trust Indicators */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h3 className="text-xl font-semibold mb-2">Trusted & Secure</h3>
          <p className="text-muted-foreground">
            Your travel data is protected with enterprise-grade security
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_INDICATORS.map((indicator, index) => (
            <motion.div
              key={indicator.id}
              variants={itemVariants}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden h-full hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-4 text-center">
                  <div className="mb-3 flex justify-center">
                    <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                      {indicator.icon}
                    </div>
                  </div>
                  <h4 className="font-semibold mb-1">{indicator.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {indicator.description}
                  </p>
                  {indicator.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {indicator.badge}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Partner Logos */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h3 className="text-xl font-semibold mb-2">Powered by Leading Partners</h3>
          <p className="text-muted-foreground">
            Connected to the world's best booking platforms and services
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PARTNERS.map((partner, index) => (
            <motion.div
              key={partner.id}
              variants={itemVariants}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="group"
            >
              <Card className="relative overflow-hidden hover:shadow-md transition-all duration-300 border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{partner.logo}</div>
                  <div className="text-sm font-medium mb-1">{partner.name}</div>
                  {partner.verified && (
                    <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Verified</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {partner.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Additional Testimonials Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h3 className="text-xl font-semibold mb-2">More Happy Travelers</h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.slice(1, 4).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              variants={itemVariants}
              transition={{ delay: index * 0.1 }}
            >
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  featured?: boolean;
}

function TestimonialCard({ testimonial, featured = false }: TestimonialCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg group",
      featured && "border-2 border-emerald-200 shadow-lg"
    )}>
      <CardContent className={cn("p-6", featured && "p-8")}>
        {/* Quote Icon */}
        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Quote className={cn("text-emerald-500", featured ? "h-8 w-8" : "h-6 w-6")} />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
          ))}
          <span className="text-sm text-muted-foreground ml-2">
            {testimonial.rating}/5
          </span>
        </div>

        {/* Testimonial Text */}
        <blockquote className={cn(
          "text-foreground mb-6 leading-relaxed",
          featured ? "text-lg" : "text-base"
        )}>
          "{testimonial.text}"
        </blockquote>

        {/* Trip Info */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{testimonial.trip}</span>
          <span>•</span>
          <Calendar className="h-3 w-3" />
          <span>{testimonial.date}</span>
        </div>

        {/* Author */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className={featured ? "h-12 w-12" : "h-10 w-10"}>
              <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
              <AvatarFallback>
                {testimonial.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn("font-medium", featured && "text-lg")}>
                  {testimonial.name}
                </span>
                {testimonial.verified && (
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{testimonial.location}</span>
                <div className="flex items-center gap-1">
                  {getPlatformIcon(testimonial.platform)}
                  <span>{testimonial.username}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Stats */}
          {testimonial.likes && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Heart className="h-3 w-3" />
              <span>{testimonial.likes}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}