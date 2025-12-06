import { Variants } from "framer-motion"

/* ============================================================
   FRAMER MOTION PRESETS - GolfFox v41
   ============================================================ */

// Fade In
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

// Slide In Right
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
}

// Slide In Left
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
}

// Scale In
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
}

// Stagger Children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

// List Item
export const listItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// Hover Lift
export const hoverLift: Variants = {
  rest: { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.02 },
}

// Sidebar Highlight
export const sidebarHighlight: Variants = {
  rest: { x: 0 },
  hover: { x: 4 },
}

// Modal Backdrop
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

// Modal Content
export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    }
  },
}

// Button Ripple
export const buttonRipple: Variants = {
  rest: { scale: 0, opacity: 0 },
  pressed: { 
    scale: 1, 
    opacity: 0.4,
    transition: {
      duration: 0.3,
    }
  },
}

// Map Marker Bounce
export const markerBounce: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 12,
    }
  },
}

// Float Animation
export const float: Variants = {
  hidden: { y: 0 },
  visible: {
    y: [-0, -10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    }
  },
}

// Pulse Glow
export const pulseGlow: Variants = {
  hidden: { opacity: 0.6 },
  visible: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2,
      repeat: Infinity,
    }
  },
}

// Premium Transitions - Material Design 3 + Apple HIG
export const defaultTransition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
}

export const smoothTransition = {
  duration: 0.25,
  ease: [0.25, 0.46, 0.45, 0.94],
}

export const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
}

export const bounceTransition = {
  type: "spring",
  stiffness: 300,
  damping: 15,
}

export const gentleSpring = {
  type: "spring",
  stiffness: 200,
  damping: 20,
}

export const snappySpring = {
  type: "spring",
  stiffness: 500,
  damping: 30,
}

// Premium Animation Variants
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: smoothTransition
  },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: smoothTransition
  },
}

export const scaleInBounce: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: bounceTransition
  },
}

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: springTransition
  },
}

export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: springTransition
  },
}

// Enhanced Stagger
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

// Enhanced Hover Effects
export const hoverLiftPremium: Variants = {
  rest: { 
    y: 0, 
    scale: 1,
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.08)"
  },
  hover: { 
    y: -6, 
    scale: 1.02,
    boxShadow: "0 10px 25px -3px rgb(0 0 0 / 0.1)",
    transition: springTransition
  },
}

export const hoverScale: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: smoothTransition
  },
}

export const hoverGlow: Variants = {
  rest: { 
    boxShadow: "0 0 0 0 rgba(249, 115, 22, 0)"
  },
  hover: { 
    boxShadow: "0 0 20px 5px rgba(249, 115, 22, 0.3)",
    transition: smoothTransition
  },
}

// Card Entrance
export const cardEntrance: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      ...springTransition,
      duration: 0.5
    }
  },
}

// Icon Animation
export const iconSpin: Variants = {
  rest: { rotate: 0 },
  hover: { 
    rotate: 360,
    transition: {
      duration: 0.6,
      ease: "easeInOut"
    }
  },
}

export const iconBounce: Variants = {
  rest: { y: 0 },
  hover: { 
    y: -4,
    transition: bounceTransition
  },
}

// Loading States
export const shimmer: Variants = {
  hidden: { opacity: 0.5 },
  visible: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
}

// Page Transitions
export const pageTransition: Variants = {
  initial: { 
    opacity: 0,
    y: 20
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: smoothTransition
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.15
    }
  },
}

