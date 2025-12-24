"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion"

export function HeroBackground() {
    const containerRef = useRef<HTMLDivElement>(null)
    const scrollY = useMotionValue(0)

    useEffect(() => {
        const handleScroll = () => {
            scrollY.set(window.scrollY)
        }
        window.addEventListener('scroll', handleScroll)
        handleScroll() // Initial value
        return () => window.removeEventListener('scroll', handleScroll)
    }, [scrollY])

    // Parallax suave
    const y1 = useTransform(scrollY, [0, 1000], [0, 400])
    const opacity = useTransform(scrollY, [0, 500], [1, 0])

    // Mouse follow effect suave
    const mouseX = useSpring(0, { stiffness: 50, damping: 20 })
    const mouseY = useSpring(0, { stiffness: 50, damping: 20 })

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            mouseX.set(event.clientX)
            mouseY.set(event.clientY)
        }
        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [mouseX, mouseY])

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#020617]" ref={containerRef}>
            {/* Grid Principal - Perspectiva 3D Sutil */}
            <motion.div
                style={{ y: y1, opacity }}
                className="absolute inset-x-0 top-[-10%] h-[150%] origin-top transform-gpu"
            >
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:160px_160px] opacity-50" />
            </motion.div>

            {/* Partículas Flutuantes (Simulação de Dados) */}
            <Particles />

            {/* Spotlight Interativo que segue o mouse */}
            <motion.div
                className="absolute w-[800px] h-[800px] rounded-full bg-brand/5 blur-[120px] pointer-events-none mix-blend-screen"
                style={{
                    x: mouseX,
                    y: mouseY,
                    translateX: "-50%",
                    translateY: "-50%"
                }}
            />

            {/* Luzes Ambientais Fixas */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/5 blur-[150px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-600/5 blur-[150px]" />
        </div>
    )
}

function Particles() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="absolute inset-0">
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-brand/40 rounded-full"
                    initial={{
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                        opacity: Math.random() * 0.5 + 0.1
                    }}
                    animate={{
                        y: [null, Math.random() * -100],
                        opacity: [null, 0]
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    )
}
