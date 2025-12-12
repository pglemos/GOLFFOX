"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

// Page transition wrapper
export const PageTransition = ({ children }: { children: ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
    >
        {children}
    </motion.div>
)

// Staggered list container
export const StaggerContainer = ({ children, delay = 0.05 }: { children: ReactNode, delay?: number }) => (
    <motion.div
        initial="hidden"
        animate="visible"
        variants={{
            hidden: { opacity: 0 },
            visible: {
                opacity: 1,
                transition: {
                    staggerChildren: delay
                }
            }
        }}
    >
        {children}
    </motion.div>
)

// Staggered list item
export const StaggerItem = ({ children }: { children: ReactNode }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
        }}
        transition={{ duration: 0.3 }}
    >
        {children}
    </motion.div>
)

// Hover scale effect
export const HoverScale = ({ children, scale = 1.02 }: { children: ReactNode, scale?: number }) => (
    <motion.div
        whileHover={{ scale }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
        {children}
    </motion.div>
)

// Fade in on scroll
export const FadeInView = ({ children }: { children: ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
    >
        {children}
    </motion.div>
)

// Count up animation hook
export const useCountUp = (end: number, duration: number = 1000) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let startTime: number | null = null
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)
            setCount(Math.floor(progress * end))
            if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }, [end, duration])

    return count
}

import { useState, useEffect } from "react"
