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

// Common Transition
export const defaultTransition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
}

export const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
}

export const bounceTransition = {
  type: "spring",
  stiffness: 200,
  damping: 12,
}

