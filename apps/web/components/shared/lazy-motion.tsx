"use client"

import dynamic from "next/dynamic"

/**
 * Lazy load componentes do framer-motion para reduzir bundle size inicial
 * framer-motion é uma biblioteca grande (~150KB) e nem sempre é necessária imediatamente
 */

// Lazy load motion (componente mais usado)
export const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false }
)

export const MotionSpan = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.span),
  { ssr: false }
)

export const MotionButton = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.button),
  { ssr: false }
)

export const MotionCard = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false }
)

// AnimatePresence pode ser importado normalmente (é menor)
export { AnimatePresence } from "framer-motion"

// Hooks podem ser importados normalmente (são pequenos)
export { useMotionTemplate, useScroll } from "framer-motion"

