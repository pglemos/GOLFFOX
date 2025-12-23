"use client"

import { memo, useMemo, useState, useEffect } from "react"

import { motion } from "framer-motion"

// Hook para verificar preferência de movimento reduzido
function useReducedMotion(): boolean {
    const [shouldReduceMotion, setShouldReduceMotion] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setShouldReduceMotion(mediaQuery.matches)
        const handleChange = (event: MediaQueryListEvent) => setShouldReduceMotion(event.matches)
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    return shouldReduceMotion
}

export const LandingScene = memo(() => {
    const shouldReduceMotion = useReducedMotion()
    const orbs = useMemo(() => [
        { color: 'rgba(249, 115, 22, 0.12)', x: ['-25%', '-15%'], y: ['10%', '20%'], duration: 20 },
        { color: 'rgba(139, 92, 246, 0.08)', x: ['75%', '85%'], y: ['60%', '70%'], duration: 25 },
        { color: 'rgba(59, 130, 246, 0.08)', x: ['40%', '50%'], y: ['-10%', '0%'], duration: 30 },
    ], [])

    if (shouldReduceMotion) return null

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {orbs.map((orb, i) => (
                <motion.div
                    key={i}
                    className="absolute w-[500px] h-[500px] rounded-full will-change-transform"
                    style={{
                        background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
                        filter: 'blur(60px)',
                    }}
                    initial={{ x: orb.x[0], y: orb.y[0] }}
                    animate={{ x: orb.x[1], y: orb.y[1] }}
                    transition={{
                        duration: orb.duration,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    )
})

LandingScene.displayName = "LandingScene"
