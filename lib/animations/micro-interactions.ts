'use client';

// Micro-interactions and Animation Library - Phase 7 Production Excellence
// Professional animations and micro-interactions for enhanced UX

import { Variants } from 'framer-motion';

// Animation variants for common interactions
export const fadeInUp: Variants = {
  initial: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.2 }
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1] // Custom easing
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 }
  }
};

export const fadeInDown: Variants = {
  initial: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 }
  }
};

export const scaleIn: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.9,
    transition: { duration: 0.15 }
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};

export const slideInLeft: Variants = {
  initial: { 
    opacity: 0, 
    x: -30,
    transition: { duration: 0.2 }
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2 }
  }
};

export const slideInRight: Variants = {
  initial: { 
    opacity: 0, 
    x: 30,
    transition: { duration: 0.2 }
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: 0.2 }
  }
};

// Button interaction variants
export const buttonHover: Variants = {
  idle: { 
    scale: 1,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.2 }
  },
  hover: { 
    scale: 1.02,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.15 }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.05 }
  }
};

export const iconButtonHover: Variants = {
  idle: { 
    scale: 1,
    rotate: 0,
    transition: { duration: 0.2 }
  },
  hover: { 
    scale: 1.1,
    rotate: 5,
    transition: { duration: 0.15 }
  },
  tap: { 
    scale: 0.95,
    rotate: 0,
    transition: { duration: 0.1 }
  }
};

// Loading animations
export const pulseGlow: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [0.95, 1, 0.95],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const shimmer: Variants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Success/error state animations
export const successScale: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: [0, 1.2, 1], 
    opacity: 1,
    transition: { 
      duration: 0.5,
      times: [0, 0.6, 1],
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
};

export const errorShake: Variants = {
  animate: {
    x: [-4, 4, -4, 4, 0],
    transition: { 
      duration: 0.4,
      ease: "easeInOut"
    }
  }
};

// Card and container animations
export const cardHover: Variants = {
  idle: { 
    y: 0,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    borderColor: "rgba(203, 213, 225, 0.3)",
    transition: { duration: 0.2 }
  },
  hover: { 
    y: -4,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    borderColor: "rgba(14, 165, 233, 0.3)",
    transition: { duration: 0.2 }
  }
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
};

// Currency and pricing animations
export const priceUpdate: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    color: ["#374151", "#059669", "#374151"],
    transition: { 
      duration: 0.6,
      times: [0, 0.3, 1]
    }
  }
};

export const currencySwitch: Variants = {
  initial: { rotateY: 0 },
  animate: { 
    rotateY: [0, 90, 0],
    transition: { 
      duration: 0.6,
      times: [0, 0.5, 1]
    }
  }
};

// Navigation and step animations
export const stepProgress: Variants = {
  initial: { scaleX: 0, originX: 0 },
  animate: { 
    scaleX: 1,
    transition: { 
      duration: 0.5,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
};

export const tabSwitch: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2 }
  }
};

// Modal and popup animations
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

export const modalContent: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.9,
    y: 20
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    y: 20,
    transition: { duration: 0.2 }
  }
};

// Notification animations
export const notificationSlide: Variants = {
  initial: { 
    opacity: 0, 
    x: 300,
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: { 
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    x: 300,
    scale: 0.95,
    transition: { 
      duration: 0.2,
      ease: [0.4, 0.0, 1, 1]
    }
  }
};

// Form field animations
export const fieldFocus: Variants = {
  initial: { 
    borderColor: "rgba(203, 213, 225, 0.5)",
    boxShadow: "0 0 0 0px rgba(59, 130, 246, 0)"
  },
  focus: { 
    borderColor: "rgba(59, 130, 246, 0.8)",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    transition: { duration: 0.2 }
  },
  error: {
    borderColor: "rgba(239, 68, 68, 0.8)",
    boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.1)",
    transition: { duration: 0.2 }
  }
};

export const labelFloat: Variants = {
  initial: { 
    y: 0, 
    fontSize: "1rem",
    color: "#9CA3AF"
  },
  float: { 
    y: -24, 
    fontSize: "0.875rem",
    color: "#374151",
    transition: { duration: 0.2 }
  }
};

// Trip planning specific animations
export const mapPin: Variants = {
  initial: { scale: 0, y: 10 },
  animate: { 
    scale: [0, 1.2, 1], 
    y: [10, -5, 0],
    transition: { 
      duration: 0.5,
      times: [0, 0.6, 1]
    }
  },
  hover: {
    scale: 1.1,
    y: -2,
    transition: { duration: 0.2 }
  }
};

export const routeLine: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { 
    pathLength: 1, 
    opacity: 1,
    transition: { 
      duration: 1.5,
      ease: "easeInOut"
    }
  }
};

// Performance optimized variants (reduce motion for accessibility)
export const reduceMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } }
};

// Utility function to check for reduced motion preference
export const getMotionVariant = (variant: Variants, respectReducedMotion = true): Variants => {
  if (respectReducedMotion && typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return prefersReducedMotion ? reduceMotion : variant;
  }
  return variant;
};

// Custom transition presets
export const transitions = {
  smooth: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] },
  snappy: { duration: 0.2, ease: [0.4, 0.0, 0.2, 1] },
  bouncy: { type: "spring", stiffness: 300, damping: 30 },
  gentle: { type: "spring", stiffness: 100, damping: 20 },
  instant: { duration: 0.1 },
};

// Animation composition helpers
export const composeVariants = (...variants: Variants[]): Variants => {
  return variants.reduce((acc, variant) => ({
    ...acc,
    ...variant,
  }), {});
};

export default {
  fadeInUp,
  fadeInDown,
  scaleIn,
  slideInLeft,
  slideInRight,
  buttonHover,
  iconButtonHover,
  pulseGlow,
  shimmer,
  successScale,
  errorShake,
  cardHover,
  staggerContainer,
  staggerItem,
  priceUpdate,
  currencySwitch,
  stepProgress,
  tabSwitch,
  modalBackdrop,
  modalContent,
  notificationSlide,
  fieldFocus,
  labelFloat,
  mapPin,
  routeLine,
  transitions,
  getMotionVariant,
  composeVariants,
};