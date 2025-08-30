'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './TopographicalGrid.module.css';

export interface TopographicalGridProps {
  density?: 'light' | 'normal' | 'dense';
  animation?: boolean;
  parallax?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export const TopographicalGrid: React.FC<TopographicalGridProps> = ({
  density = 'normal',
  animation = true,
  parallax = true,
  theme = 'dark',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  
  // Grid configuration based on density
  const gridConfig = useMemo(() => {
    switch (density) {
      case 'light':
        return { spacing: 40, dotSize: 1, opacity: [0.2, 0.4] };
      case 'dense':
        return { spacing: 20, dotSize: 1.2, opacity: [0.4, 0.7] };
      default:
        return { spacing: 30, dotSize: 1, opacity: [0.3, 0.6] };
    }
  }, [density]);

  // Generate grid dots
  const gridDots = useMemo(() => {
    const dots = [];
    const cols = Math.ceil(window?.innerWidth / gridConfig.spacing) + 5 || 50;
    const rows = Math.ceil(window?.innerHeight / gridConfig.spacing) + 5 || 30;
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const x = j * gridConfig.spacing;
        const y = i * gridConfig.spacing;
        const delay = (i + j) * 0.1;
        
        dots.push(
          <motion.div
            key={`${i}-${j}`}
            className={`topo-dot topo-dot-${theme}`}
            style={{
              left: x,
              top: y,
              width: gridConfig.dotSize,
              height: gridConfig.dotSize,
            }}
            initial={{ opacity: gridConfig.opacity[0] }}
            animate={animation && !shouldReduceMotion ? {
              opacity: [gridConfig.opacity[0], gridConfig.opacity[1], gridConfig.opacity[0]],
              scale: [1, 1.2, 1]
            } : {}}
            transition={{
              duration: 4,
              delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      }
    }
    return dots;
  }, [gridConfig, animation, shouldReduceMotion, theme]);

  // Topographical elevation lines (SVG paths)
  const elevationLines = useMemo(() => {
    const lines = [];
    const lineCount = 5;
    
    for (let i = 0; i < lineCount; i++) {
      const pathData = generateTopographicalPath(i);
      lines.push(
        <motion.path
          key={`line-${i}`}
          d={pathData}
          stroke={theme === 'dark' ? '#15B37D' : '#0A2540'}
          strokeWidth="1"
          strokeOpacity="0.2"
          fill="none"
          strokeDasharray="4 8"
          initial={{ pathLength: 0 }}
          animate={animation && !shouldReduceMotion ? { pathLength: 1 } : { pathLength: 1 }}
          transition={{
            duration: 8,
            delay: i * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      );
    }
    return lines;
  }, [animation, shouldReduceMotion, theme]);

  // Parallax effect
  useEffect(() => {
    if (!parallax || shouldReduceMotion) return;

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallaxSpeed = 0.3;
      
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [parallax, shouldReduceMotion]);

  return (
    <div 
      ref={containerRef}
      className={`topo-grid topo-grid-${theme} ${className}`}
    >
      {/* Mesh gradient background */}
      <div className={`topo-gradient topo-gradient-${theme}`} />
      
      {/* Grid dots */}
      <div className="topo-dots-container">
        {gridDots}
      </div>

      {/* Elevation lines */}
      <svg className="topo-lines" width="100%" height="100%">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme === 'dark' ? '#15B37D' : '#0A2540'} stopOpacity="0" />
            <stop offset="50%" stopColor={theme === 'dark' ? '#15B37D' : '#0A2540'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={theme === 'dark' ? '#15B37D' : '#0A2540'} stopOpacity="0" />
          </linearGradient>
        </defs>
        {elevationLines}
      </svg>

      {/* Edge fade overlay */}
      <div className={`topo-fade topo-fade-${theme}`} />
    </div>
  );
};

// Helper function to generate curved topographical paths
function generateTopographicalPath(index: number): string {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const height = typeof window !== 'undefined' ? window.innerHeight : 800;
  
  const startY = (height / 6) * (index + 1);
  const points = [];
  
  // Generate organic curve points
  for (let x = 0; x <= width; x += width / 20) {
    const baseY = startY + Math.sin(x / 200) * 30;
    const noise = Math.sin(x / 100 + index) * 15;
    points.push([x, baseY + noise]);
  }
  
  // Create smooth SVG path
  let path = `M ${points[0][0]} ${points[0][1]}`;
  
  for (let i = 1; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const cp1x = x1 + (x2 - x1) / 3;
    const cp1y = y1;
    const cp2x = x2 - (x2 - x1) / 3;
    const cp2y = y2;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  }
  
  return path;
}

export default TopographicalGrid;