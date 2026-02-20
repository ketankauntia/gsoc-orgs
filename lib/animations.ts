/**
 * Reusable Framer Motion Animation Variants
 * Centralized animation configurations for consistent UX
 */

import { Variants } from "framer-motion";

/**
 * Fade in from bottom with slide up
 * Perfect for cards, sections entering viewport
 */
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuad
    }
  }
};

/**
 * Fade in from left
 * Used for left-aligned content blocks
 */
export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -30 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

/**
 * Fade in from right
 * Used for right-aligned content blocks
 */
export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 30 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

/**
 * Container for staggered children animations
 * Use with staggerItem for grid/list animations
 */
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

/**
 * Individual item in staggered animation
 * Pairs with staggerContainer
 */
export const staggerItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

/**
 * Scale animation for hover states
 * Subtle zoom effect for interactive elements
 */
export const scaleOnHover = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

/**
 * Card hover effect with shadow
 * Combined scale and shadow for depth
 */
export const cardHover = {
  rest: { 
    scale: 1,
    y: 0
  },
  hover: { 
    scale: 1.03,
    y: -4,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

/**
 * Slide in from left (larger distance)
 * For sidebar or side content animations
 */
export const slideInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -60 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

/**
 * Slide in from right (larger distance)
 * For sidebar or side content animations
 */
export const slideInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 60 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

/**
 * Simple fade in
 * Minimal animation for subtle elements
 */
export const fadeIn: Variants = {
  hidden: { 
    opacity: 0 
  },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

/**
 * Scale in animation
 * Pop effect for images or icons
 */
export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

/**
 * Default viewport options for scroll animations
 * Triggers animation when element is 20% visible
 */
export const defaultViewport = {
  once: true, // Animate only once
  margin: "0px 0px -100px 0px", // Trigger slightly before entering viewport
  amount: 0.2 // Trigger when 20% visible
};

/**
 * Gets animation variants with reduced motion support
 * Returns no-op variants if user prefers reduced motion
 */
export const getAccessibleVariants = (variants: Variants): Variants => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.01 } }
    };
  }
  return variants;
};
