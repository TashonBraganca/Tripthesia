/**
 * Motion variants library for Tripthesia
 * Provides reusable animation variants for Framer Motion
 */

export const fadeInUp = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0
  }
};

export const fadeInDown = {
  hidden: { 
    opacity: 0, 
    y: -20 
  },
  visible: { 
    opacity: 1, 
    y: 0
  }
};

export const fadeIn = {
  hidden: { 
    opacity: 0 
  },
  visible: { 
    opacity: 1
  }
};

export const slideInLeft = {
  hidden: { 
    opacity: 0, 
    x: -30 
  },
  visible: { 
    opacity: 1, 
    x: 0
  }
};

export const slideInRight = {
  hidden: { 
    opacity: 0, 
    x: 30 
  },
  visible: { 
    opacity: 1, 
    x: 0
  }
};

export const scaleIn = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1
  }
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const buttonHover = {
  rest: { 
    scale: 1 
  },
  hover: { 
    scale: 1.05
  },
  tap: { 
    scale: 0.95 
  }
};

export const cardHover = {
  rest: { 
    y: 0, 
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
  },
  hover: { 
    y: -5,
    boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.1)"
  }
};

export const glassmorphism = {
  initial: {
    backdropFilter: "blur(0px)",
    background: "rgba(255, 255, 255, 0)"
  },
  animate: {
    backdropFilter: "blur(10px)",
    background: "rgba(255, 255, 255, 0.1)",
    transition: { 
      duration: 0.6 
    }
  }
};

export const pageTransition = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0
  },
  exit: { 
    opacity: 0, 
    y: -20
  }
};

export const modalTransition = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1
  },
  exit: { 
    opacity: 0, 
    scale: 0.8
  }
};

export const loadingSpinner = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};