'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import './GPSLoader.module.css';

export interface GPSLoaderProps {
  duration?: number;
  showProgress?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GPSLoader: React.FC<GPSLoaderProps> = ({
  duration = 3000,
  showProgress = true,
  message = "Planning your adventures...",
  size = 'md',
  className = ''
}) => {
  const [currentWaypoint, setCurrentWaypoint] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const messages = [
    "Planning your adventures...",
    "Mapping the perfect route...",
    "Finding hidden gems...",
    "Calculating travel times...",
    "Almost ready to explore..."
  ];

  const waypoints = [
    { x: 20, y: 30, name: "Start" },
    { x: 45, y: 15, name: "Explore" },
    { x: 70, y: 35, name: "Discover" },
    { x: 85, y: 20, name: "Adventure" }
  ];

  const sizeClasses = {
    sm: { container: 'w-48 h-32', pin: 'w-4 h-4', text: 'text-sm' },
    md: { container: 'w-72 h-48', pin: 'w-6 h-6', text: 'text-base' },
    lg: { container: 'w-96 h-64', pin: 'w-8 h-8', text: 'text-lg' }
  };

  // Cycle through waypoints
  useEffect(() => {
    if (shouldReduceMotion) return;

    const waypointInterval = setInterval(() => {
      setCurrentWaypoint((prev) => (prev + 1) % waypoints.length);
    }, duration / waypoints.length);

    return () => clearInterval(waypointInterval);
  }, [duration, waypoints.length, shouldReduceMotion]);

  // Cycle through messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(messageInterval);
  }, [messages.length]);

  if (shouldReduceMotion) {
    return (
      <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
        <div className={`relative ${sizeClasses[size].container} bg-navy-800/30 rounded-xl border border-navy-600/50 glass`}>
          <div className="absolute inset-4 bg-navy-900/20 rounded-lg">
            <MapPin className={`${sizeClasses[size].pin} text-teal-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`} />
          </div>
        </div>
        <p className={`${sizeClasses[size].text} text-contrast-medium text-center max-w-xs`}>
          {message || messages[messageIndex]}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-6 ${className}`}>
      {/* Map Container */}
      <div className={`relative ${sizeClasses[size].container} overflow-hidden`}>
        {/* Background Map */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Topographical grid background */}
          <defs>
            <pattern
              id="topo-grid"
              x="0"
              y="0"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="5" cy="5" r="0.5" fill="var(--teal-400)" opacity="0.2" />
            </pattern>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--teal-500)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--teal-400)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--teal-500)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid background */}
          <rect width="100" height="50" fill="url(#topo-grid)" />
          
          {/* Glass morphism overlay */}
          <rect 
            width="100" 
            height="50" 
            fill="var(--glass-bg)" 
            className="backdrop-blur-sm" 
          />

          {/* Elevation contour lines */}
          <motion.path
            d="M 10,25 Q 30,15 50,25 Q 70,35 90,20"
            stroke="var(--sky-400)"
            strokeWidth="0.5"
            strokeOpacity="0.3"
            fill="none"
            strokeDasharray="2 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <motion.path
            d="M 5,35 Q 25,25 45,35 Q 65,45 85,30"
            stroke="var(--teal-300)"
            strokeWidth="0.5"
            strokeOpacity="0.2"
            fill="none"
            strokeDasharray="3 6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Route path */}
          <motion.path
            d={`M ${waypoints[0].x},${waypoints[0].y} L ${waypoints[1].x},${waypoints[1].y} L ${waypoints[2].x},${waypoints[2].y} L ${waypoints[3].x},${waypoints[3].y}`}
            stroke="url(#pathGradient)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="4 8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: currentWaypoint / (waypoints.length - 1) }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />

          {/* Waypoint circles */}
          {waypoints.map((waypoint, index) => (
            <motion.circle
              key={index}
              cx={waypoint.x}
              cy={waypoint.y}
              r="1.5"
              fill={index <= currentWaypoint ? "var(--teal-400)" : "var(--navy-400)"}
              initial={{ scale: 0, opacity: 0 }}
              animate={
                index <= currentWaypoint
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0.5, opacity: 0.3 }
              }
              transition={{ duration: 0.3, delay: index * 0.1 }}
            />
          ))}

          {/* Pulsing circles at visited waypoints */}
          {waypoints.map((waypoint, index) => (
            index <= currentWaypoint && (
              <motion.circle
                key={`pulse-${index}`}
                cx={waypoint.x}
                cy={waypoint.y}
                r="3"
                fill="none"
                stroke="var(--teal-400)"
                strokeWidth="0.5"
                strokeOpacity="0.4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.2
                }}
              />
            )
          ))}

          {/* Animated GPS Pin */}
          <motion.g
            initial={{ x: waypoints[0].x, y: waypoints[0].y }}
            animate={{
              x: waypoints[currentWaypoint].x,
              y: waypoints[currentWaypoint].y
            }}
            transition={{
              duration: 0.8,
              ease: "easeInOut"
            }}
          >
            {/* Pin shadow */}
            <motion.ellipse
              cx="0"
              cy="2"
              rx="1.5"
              ry="0.5"
              fill="var(--navy-900)"
              opacity="0.3"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Pin body */}
            <motion.path
              d="M 0,-2 C -1.5,-2 -2.5,-1 -2.5,0 C -2.5,1 0,3 0,3 C 0,3 2.5,1 2.5,0 C 2.5,-1 1.5,-2 0,-2 Z"
              fill="var(--teal-500)"
              stroke="var(--teal-300)"
              strokeWidth="0.2"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Pin center dot */}
            <motion.circle
              cx="0"
              cy="-0.5"
              r="0.8"
              fill="var(--navy-50)"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.g>
        </svg>

        {/* Corner decorations */}
        <div className="absolute top-2 right-2">
          <Navigation className="w-4 h-4 text-sky-400/60" />
        </div>
      </div>

      {/* Progress indicator */}
      {showProgress && (
        <div className="w-48 bg-navy-800/50 rounded-full h-2 overflow-hidden backdrop-blur-sm">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-sky-400 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentWaypoint + 1) / waypoints.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}

      {/* Typing message */}
      <motion.div
        key={messageIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={`${sizeClasses[size].text} text-contrast-medium text-center max-w-xs`}
      >
        <TypewriterText text={message || messages[messageIndex]} />
      </motion.div>
    </div>
  );
};

// Typewriter effect component
const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayText, setDisplayText] = useState('');
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayText(text);
      return;
    }

    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [text, shouldReduceMotion]);

  return <span>{displayText}</span>;
};

export default GPSLoader;