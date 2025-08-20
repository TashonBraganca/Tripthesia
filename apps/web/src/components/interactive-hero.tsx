"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Plane, 
  Play, 
  Users, 
  Calendar,
  Globe,
  Sparkles
} from "lucide-react";
import {
  pageVariants,
  containerVariants,
  itemVariants,
  floatVariants,
  mapPinVariants,
  routeLineVariants,
  buttonVariants
} from "@/lib/motion";

// Popular destinations with coordinates
const DESTINATIONS = [
  { name: "Tokyo", country: "Japan", coords: [35.6762, 139.6503], users: "12.3k" },
  { name: "Paris", country: "France", coords: [48.8566, 2.3522], users: "8.7k" },
  { name: "New York", country: "USA", coords: [40.7128, -74.0060], users: "15.2k" },
  { name: "London", country: "UK", coords: [51.5074, -0.1278], users: "9.8k" },
  { name: "Dubai", country: "UAE", coords: [25.2048, 55.2708], users: "6.4k" },
  { name: "Bali", country: "Indonesia", coords: [-8.3405, 115.0920], users: "4.9k" },
  { name: "Sydney", country: "Australia", coords: [-33.8688, 151.2093], users: "3.2k" },
  { name: "Barcelona", country: "Spain", coords: [41.3851, 2.1734], users: "5.1k" },
];

// Route connections for animated lines
const ROUTES = [
  { from: 0, to: 1 }, // Tokyo to Paris
  { from: 1, to: 2 }, // Paris to New York  
  { from: 2, to: 3 }, // New York to London
  { from: 3, to: 4 }, // London to Dubai
  { from: 4, to: 5 }, // Dubai to Bali
  { from: 5, to: 6 }, // Bali to Sydney
  { from: 6, to: 7 }, // Sydney to Barcelona
];

interface WorldMapProps {
  className?: string;
}

function WorldMap({ className }: WorldMapProps) {
  const [activePin, setActivePin] = useState<number | null>(null);
  const [animateRoutes, setAnimateRoutes] = useState(false);

  useEffect(() => {
    // Start route animations after a delay
    const timer = setTimeout(() => setAnimateRoutes(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Convert coordinates to SVG positions (simplified projection)
  const coordsToSVG = (coords: [number, number]) => {
    const [lat, lng] = coords;
    const x = ((lng + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return [x, y];
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* World map SVG background */}
      <svg
        viewBox="0 0 800 400"
        className="w-full h-full opacity-20"
        fill="none"
      >
        {/* Simplified world map outline */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="800" height="400" fill="url(#grid)" />
        
        {/* Animated route lines */}
        {animateRoutes && ROUTES.map((route, index) => {
          const fromCoords = coordsToSVG(DESTINATIONS[route.from].coords);
          const toCoords = coordsToSVG(DESTINATIONS[route.to].coords);
          
          return (
            <motion.line
              key={`route-${index}`}
              x1={fromCoords[0]}
              y1={fromCoords[1]}
              x2={toCoords[0]}
              y2={toCoords[1]}
              stroke="url(#routeGradient)"
              strokeWidth="2"
              strokeDasharray="4 4"
              variants={routeLineVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.3 }}
            />
          );
        })}
        
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 0.6 }} />
            <stop offset="50%" style={{ stopColor: "#0ea5e9", stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: "#f59e0b", stopOpacity: 0.6 }} />
          </linearGradient>
        </defs>
      </svg>

      {/* Destination pins */}
      {DESTINATIONS.map((destination, index) => {
        const [x, y] = coordsToSVG(destination.coords);
        return (
          <motion.div
            key={destination.name}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: `${(x / 800) * 100}%`, top: `${(y / 400) * 100}%` }}
            variants={mapPinVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.2 }}
            whileHover="bounce"
            onHoverStart={() => setActivePin(index)}
            onHoverEnd={() => setActivePin(null)}
          >
            {/* Pin */}
            <div className="relative">
              <motion.div
                className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                  index % 3 === 0 ? 'bg-primary-500' :
                  index % 3 === 1 ? 'bg-secondary-500' : 'bg-accent-500'
                }`}
                whileHover={{ scale: 1.2 }}
              >
                {/* Pulsing ring */}
                <motion.div
                  className={`absolute inset-0 rounded-full ${
                    index % 3 === 0 ? 'bg-primary-500' :
                    index % 3 === 1 ? 'bg-secondary-500' : 'bg-accent-500'
                  }`}
                  animate={{
                    scale: [1, 2, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3,
                  }}
                />
              </motion.div>

              {/* Hover tooltip */}
              {activePin === index && (
                <motion.div
                  className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-background/95 backdrop-blur-md border border-border rounded-lg px-3 py-2 shadow-lg min-w-max"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className="text-sm font-medium">{destination.name}</div>
                  <div className="text-xs text-muted-foreground">{destination.country}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="w-3 h-3 text-primary" />
                    <span className="text-xs text-primary">{destination.users} travelers</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function InteractiveHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax effects
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5"
    >
      {/* Animated background map */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: backgroundY }}
      >
        <WorldMap className="w-full h-full" />
      </motion.div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-20 h-20 rounded-full blur-xl ${
              i % 3 === 0 ? 'bg-primary/10' :
              i % 3 === 1 ? 'bg-secondary/10' : 'bg-accent/10'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            variants={floatVariants}
            animate="floating"
            transition={{ delay: i * 0.5 }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div 
        className="container px-4 text-center z-10 relative"
        style={{ y: textY }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div className="mb-6" variants={itemVariants}>
          <Badge className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Trip Planning
          </Badge>
        </motion.div>

        {/* Main heading */}
        <motion.h1 
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          variants={itemVariants}
        >
          Plan Perfect Trips with{" "}
          <motion.span 
            className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ["0%", "100%", "0%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Global AI
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto"
          variants={itemVariants}
        >
          Generate complete travel itineraries in seconds with real prices,
          availability, and booking links. Your adventure starts here.
        </motion.p>

        {/* Stats */}
        <motion.div 
          className="flex items-center justify-center gap-8 mb-8 text-sm text-muted-foreground"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <span>200+ Countries</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-secondary" />
            <span>50k+ Travelers</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            <span>1M+ Trips Planned</span>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div 
          className="flex gap-4 justify-center flex-wrap"
          variants={itemVariants}
        >
          <Link href="/new">
            <motion.div
              variants={buttonVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
            >
              <Button size="lg" className="text-lg px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plane className="w-5 h-5 mr-2" />
                Plan Your Trip
              </Button>
            </motion.div>
          </Link>
          
          <motion.div
            variants={buttonVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
          >
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 glass border-primary/20 hover:bg-primary/5"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* Live preview hint */}
        <motion.div 
          className="mt-12 text-sm text-muted-foreground"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live pricing and availability</span>
          </div>
          <p>Watch the map come alive with real traveler data</p>
        </motion.div>
      </motion.div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-5" />
    </section>
  );
}