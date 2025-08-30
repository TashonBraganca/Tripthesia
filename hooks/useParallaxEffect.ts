'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export interface ParallaxConfig {
  speed?: number;
  offset?: number;
  direction?: 'vertical' | 'horizontal' | 'both';
  threshold?: number;
}

export const useParallaxEffect = (config: ParallaxConfig = {}) => {
  const {
    speed = 0.3,
    offset = 0,
    direction = 'vertical',
    threshold = 0
  } = config;
  
  const elementRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  
  useEffect(() => {
    if (!elementRef.current || shouldReduceMotion) return;
    
    const element = elementRef.current;
    let ticking = false;
    
    const updateTransform = () => {
      const scrolled = window.pageYOffset;
      const elementTop = element.offsetTop;
      const elementHeight = element.offsetHeight;
      const windowHeight = window.innerHeight;
      
      // Check if element is in viewport with threshold
      const isInViewport = (
        scrolled + windowHeight >= elementTop - threshold &&
        scrolled <= elementTop + elementHeight + threshold
      );
      
      if (!isInViewport) return;
      
      // Calculate parallax offset
      const rate = (scrolled - elementTop + offset) * speed;
      
      // Apply transform based on direction
      let transform = '';
      switch (direction) {
        case 'vertical':
          transform = `translateY(${rate}px)`;
          break;
        case 'horizontal':
          transform = `translateX(${rate}px)`;
          break;
        case 'both':
          transform = `translate(${rate * 0.5}px, ${rate}px)`;
          break;
      }
      
      element.style.transform = transform;
      ticking = false;
    };
    
    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateTransform);
        ticking = true;
      }
    };
    
    // Throttled scroll handler
    const handleScroll = () => {
      requestTick();
    };
    
    // Intersection Observer for performance optimization
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.addEventListener('scroll', handleScroll, { passive: true });
          } else {
            window.removeEventListener('scroll', handleScroll);
          }
        });
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (element) {
        element.style.transform = '';
      }
    };
  }, [speed, offset, direction, threshold, shouldReduceMotion]);
  
  return elementRef;
};

export default useParallaxEffect;