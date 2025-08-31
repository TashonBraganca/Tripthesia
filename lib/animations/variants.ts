/**
 * React Bits Inspired Animation Variants
 * Framer Motion micro-interactions library for Tripthesia
 */

import { Variants, Transition } from 'framer-motion';

// Easing curves inspired by React Bits
export const easings = {
  spring: { type: "spring", stiffness: 300, damping: 30 } as Transition,
  smooth: { type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: 0.3 } as Transition,
  bounce: { type: "spring", stiffness: 400, damping: 17 } as Transition,
  gentle: { type: "tween", ease: "easeOut", duration: 0.2 } as Transition,
  elastic: { type: "spring", stiffness: 300, damping: 20, mass: 0.8 } as Transition,
};

// Card hover animations with perspective transforms
export const cardVariants: Variants = {
  initial: { 
    scale: 1, 
    rotateX: 0, 
    rotateY: 0,
    z: 0,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  },
  hover: { 
    scale: 1.02, 
    rotateX: 2, 
    rotateY: 1,
    z: 50,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: easings.spring
  },
  tap: {
    scale: 0.98,
    rotateX: 0,
    rotateY: 0,
    transition: easings.gentle
  }
};

// Enhanced button interactions
export const buttonVariants: Variants = {
  initial: { 
    scale: 1,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    backgroundColor: "var(--teal-500)"
  },
  hover: { 
    scale: 1.05,
    boxShadow: "0 10px 15px -3px rgba(21, 179, 125, 0.3), 0 4px 6px -2px rgba(21, 179, 125, 0.15)",
    backgroundColor: "var(--teal-400)",
    transition: easings.spring
  },
  tap: {
    scale: 0.95,
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    transition: easings.gentle
  },
  disabled: {
    scale: 1,
    opacity: 0.5,
    cursor: "not-allowed"
  }
};

// Floating travel icons
export const floatingIcons: Variants = {
  initial: {
    y: 0,
    rotate: 0,
    opacity: 0
  },
  animate: {
    y: [0, -10, 0],
    rotate: [0, 2, -2, 0],
    opacity: 0.6,
    transition: {
      y: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      },
      rotate: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      },
      opacity: {
        duration: 0.6
      }
    }
  }
};

// Glass morphism modal animations
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    rotateX: -15
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: {
      ...easings.spring,
      duration: 0.4
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    rotateX: 10,
    transition: easings.gentle
  }
};

// Form field focus states
export const inputVariants: Variants = {
  initial: {
    borderColor: "var(--border-primary)",
    boxShadow: "0 0 0 0 rgba(21, 179, 125, 0)"
  },
  focus: {
    borderColor: "var(--teal-400)",
    boxShadow: "0 0 0 3px rgba(21, 179, 125, 0.1)",
    transition: easings.smooth
  },
  error: {
    borderColor: "var(--error)",
    boxShadow: "0 0 0 3px rgba(255, 107, 107, 0.1)",
    transition: easings.gentle
  }
};

// Page transitions
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
    filter: "blur(4px)"
  },
  in: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      ...easings.smooth,
      duration: 0.4
    }
  },
  out: {
    opacity: 0,
    x: 20,
    filter: "blur(4px)",
    transition: easings.gentle
  }
};

// Stagger animations for lists
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: easings.spring
  }
};

// Loading spinner replacement
export const pulseVariants: Variants = {
  initial: {
    scale: 1,
    opacity: 1
  },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Success/error feedback animations
export const feedbackVariants: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
    opacity: 0
  },
  success: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25
    }
  },
  error: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      scale: easings.bounce,
      rotate: easings.bounce,
      opacity: easings.gentle,
      x: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  }
};

// Navigation menu animations
export const menuVariants: Variants = {
  closed: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  },
  open: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

// Scroll-triggered animations
export const scrollVariants: Variants = {
  offscreen: {
    opacity: 0,
    y: 50,
    scale: 0.95
  },
  onscreen: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...easings.spring,
      duration: 0.6
    }
  }
};

// Travel-specific animations
export const planeVariants: Variants = {
  initial: {
    x: -100,
    y: 0,
    rotate: 0,
    opacity: 0
  },
  flying: {
    x: [0, 50, 100],
    y: [0, -10, -5],
    rotate: [0, 5, 0],
    opacity: [0, 1, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
      times: [0, 0.5, 1]
    }
  }
};

export const mapPinVariants: Variants = {
  initial: {
    scale: 0,
    y: -50,
    opacity: 0
  },
  drop: {
    scale: [0, 1.2, 1],
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      duration: 0.6
    }
  },
  bounce: {
    y: [0, -10, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Gradient text animations
export const gradientTextVariants: Variants = {
  initial: {
    backgroundPosition: "0% 50%"
  },
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Glass card hover effects
export const glassCardVariants: Variants = {
  initial: {
    backdropFilter: "blur(10px)",
    backgroundColor: "rgba(6, 26, 44, 0.8)",
    borderColor: "rgba(184, 199, 211, 0.2)"
  },
  hover: {
    backdropFilter: "blur(20px)",
    backgroundColor: "rgba(6, 26, 44, 0.9)",
    borderColor: "rgba(21, 179, 125, 0.3)",
    scale: 1.02,
    y: -5,
    transition: easings.spring
  }
};

const animationVariants = {
  cardVariants,
  buttonVariants,
  floatingIcons,
  modalVariants,
  inputVariants,
  pageVariants,
  staggerContainer,
  staggerItem,
  pulseVariants,
  feedbackVariants,
  menuVariants,
  scrollVariants,
  planeVariants,
  mapPinVariants,
  gradientTextVariants,
  glassCardVariants,
  easings
};

export default animationVariants;