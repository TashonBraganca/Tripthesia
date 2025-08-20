import { Variants } from "framer-motion";

// Page transitions
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Stagger animations for lists
export const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// Card hover effects
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

// Button press animations
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.1,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: "easeOut",
    },
  },
};

// Modal/Dialog animations
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
};

// Loading skeleton animations
export const skeletonVariants: Variants = {
  loading: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Slide in from directions
export const slideVariants = {
  fromLeft: {
    initial: { x: -300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
  },
  fromRight: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 300, opacity: 0 },
  },
  fromTop: {
    initial: { y: -300, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -300, opacity: 0 },
  },
  fromBottom: {
    initial: { y: 300, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 300, opacity: 0 },
  },
};

// Bounce animation for success states
export const bounceVariants: Variants = {
  initial: {
    scale: 0,
    rotate: 0,
  },
  animate: {
    scale: 1,
    rotate: 360,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

// Float animation for hero elements
export const floatVariants: Variants = {
  floating: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Parallax scroll variants
export const parallaxVariants = {
  slow: {
    y: [0, -50],
    transition: {
      duration: 0,
    },
  },
  medium: {
    y: [0, -100],
    transition: {
      duration: 0,
    },
  },
  fast: {
    y: [0, -150],
    transition: {
      duration: 0,
    },
  },
};

// Map pin animation
export const mapPinVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
    y: 20,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
  bounce: {
    y: [0, -8, 0],
    transition: {
      duration: 0.6,
      repeat: 3,
      ease: "easeInOut",
    },
  },
};

// Route line animation
export const routeLineVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 2,
        ease: "easeInOut",
      },
      opacity: {
        duration: 0.3,
      },
    },
  },
};

// Drag and drop variants
export const dragVariants: Variants = {
  drag: {
    scale: 1.02,
    rotate: 2,
    zIndex: 10,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: {
      duration: 0.1,
    },
  },
};

// Spring transition presets
export const springTransition = {
  light: { type: "spring", stiffness: 300, damping: 25 },
  medium: { type: "spring", stiffness: 200, damping: 20 },
  heavy: { type: "spring", stiffness: 100, damping: 15 },
};

// Easing presets
export const easings = {
  smooth: [0.25, 0.46, 0.45, 0.94],
  snappy: [0.68, -0.55, 0.265, 1.55],
  gentle: [0.25, 0.1, 0.25, 1],
};

// Duration presets
export const durations = {
  fast: 0.15,
  medium: 0.3,
  slow: 0.6,
};

// Scroll-triggered animations (use with Intersection Observer)
export const scrollVariants: Variants = {
  offscreen: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.6,
    },
  },
};

// Enhanced stagger container with scroll support
export const scrollStaggerContainer: Variants = {
  offscreen: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: 1,
    },
  },
  onscreen: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      staggerDirection: 1,
    },
  },
};

// Gesture-based interactions
export const gestureVariants: Variants = {
  initial: {
    scale: 1,
    rotate: 0,
  },
  whileTap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
  whileHover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
  whileDrag: {
    scale: 1.1,
    rotate: 5,
    zIndex: 100,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
    transition: {
      duration: 0.2,
    },
  },
};

// Enhanced card animations with scroll support
export const enhancedCardVariants: Variants = {
  offscreen: {
    opacity: 0,
    y: 30,
    scale: 0.9,
    rotateX: 25,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.8,
    },
  },
  hover: {
    y: -8,
    scale: 1.03,
    rotateX: 5,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    transition: {
      duration: 0.3,
    },
  },
};

// Text reveal animations
export const textRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

// Word-by-word text animation
export const wordVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

// Number counter animation
export const counterVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
};

// Image gallery navigation
export const galleryVariants: Variants = {
  enter: {
    x: 300,
    opacity: 0,
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: {
    zIndex: 0,
    x: -300,
    opacity: 0,
  },
};

// Progressive disclosure animation
export const disclosureVariants: Variants = {
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        duration: 0.3,
      },
      opacity: {
        duration: 0.2,
      },
    },
  },
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      height: {
        duration: 0.3,
      },
      opacity: {
        duration: 0.4,
        delay: 0.1,
      },
    },
  },
};

// Toast notification animations
export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    x: 300,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: 300,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

// Loading state animations
export const pulseVariants: Variants = {
  pulse: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Success/Error state animations
export const statusVariants: Variants = {
  success: {
    scale: [0, 1.2, 1],
    rotate: [0, 360, 0],
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
  error: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
    },
  },
};

// Reduced motion variants (respects prefers-reduced-motion)
export const reducedMotionVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Viewport-based reveal (use with useInView)
export const viewportReveal = {
  hidden: {
    opacity: 0,
    y: 75,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: 0.25,
    },
  },
};