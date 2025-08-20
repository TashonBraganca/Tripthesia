import { useEffect, useRef, useState } from 'react';
import { useInView, useAnimation, useAnimationControls } from 'framer-motion';

type AnimationControls = ReturnType<typeof useAnimationControls>;

/**
 * Hook for scroll-triggered animations using Intersection Observer
 * @param threshold - Percentage of element that needs to be visible (0-1)
 * @param triggerOnce - Whether animation should only trigger once
 * @returns Animation controls and ref to attach to element
 */
export function useScrollAnimation(
  threshold: number = 0.1, 
  triggerOnce: boolean = true
): [AnimationControls, React.RefObject<any>] {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { 
    once: triggerOnce,
    margin: "-100px 0px" 
  });

  useEffect(() => {
    if (inView) {
      controls.start('onscreen');
    } else {
      controls.start('offscreen');
    }
  }, [controls, inView]);

  return [controls, ref];
}

/**
 * Hook for staggered scroll animations
 * @param staggerDelay - Delay between each child animation (seconds)
 * @param threshold - Visibility threshold
 * @returns Animation controls and ref
 */
export function useScrollStagger(
  staggerDelay: number = 0.1,
  threshold: number = 0.1
): [AnimationControls, React.RefObject<any>] {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      controls.start({
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.1,
        }
      });
    }
  }, [controls, inView, staggerDelay]);

  return [controls, ref];
}

/**
 * Hook for number counting animation
 * @param end - Final number to count to
 * @param duration - Animation duration in seconds
 * @param startOnView - Whether to start when in view
 */
export function useCountAnimation(
  end: number,
  duration: number = 2,
  startOnView: boolean = true
) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startOnView || inView) {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        
        // Easing function for smooth counting
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOutQuart * end));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [end, duration, startOnView, inView]);

  return [count, ref];
}

/**
 * Hook for text reveal animation (word by word)
 * @param text - Text to animate
 * @param wordDelay - Delay between words in seconds
 */
export function useTextReveal(text: string, wordDelay: number = 0.1) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [visibleWords, setVisibleWords] = useState(0);
  
  const words = text.split(' ');
  
  useEffect(() => {
    if (inView) {
      const timer = setInterval(() => {
        setVisibleWords(prev => {
          if (prev >= words.length) {
            clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, wordDelay * 1000);
      
      return () => clearInterval(timer);
    }
  }, [inView, words.length, wordDelay]);
  
  return { ref, visibleWords, words };
}

/**
 * Hook for parallax scrolling effects
 * @param speed - Parallax speed multiplier
 * @param direction - Scroll direction ('vertical' | 'horizontal')
 */
export function useParallax(speed: number = 0.5, direction: 'vertical' | 'horizontal' = 'vertical') {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = (ref.current as HTMLElement).getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * -speed;
        
        if (direction === 'vertical') {
          setOffset(rate);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, direction]);
  
  return [ref, offset];
}

/**
 * Utility to check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Conditional animation variants based on reduced motion preference
 * @param normalVariants - Full animation variants
 * @param reducedVariants - Reduced motion variants
 */
export function getAccessibleVariants(normalVariants: any, reducedVariants: any) {
  return prefersReducedMotion() ? reducedVariants : normalVariants;
}

/**
 * Hook for progressive image loading with animation
 * @param src - Image source URL
 */
export function useProgressiveImage(src: string) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
    };
    img.src = src;
  }, [src]);
  
  return { imageLoaded, imageSrc };
}

// Animation presets for common use cases
export const animationPresets = {
  // Fade in from bottom
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  },
  
  // Scale in
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 200, damping: 20 }
  },
  
  // Slide in from left
  slideInLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  },
  
  // Rotate and fade
  rotateIn: {
    initial: { opacity: 0, rotate: -10 },
    animate: { opacity: 1, rotate: 0 },
    transition: { duration: 0.6, ease: "backOut" }
  },
  
  // Bounce in
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 20,
      bounce: 0.6 
    }
  }
};

export default {
  useScrollAnimation,
  useScrollStagger,
  useCountAnimation,
  useTextReveal,
  useParallax,
  prefersReducedMotion,
  getAccessibleVariants,
  useProgressiveImage,
  animationPresets
};