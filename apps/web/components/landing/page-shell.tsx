"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { SiteHeader } from "@/components/landing/site-header"
import { SiteFooter } from "@/components/landing/site-footer"
import { HeroBackground } from "@/components/landing/hero-background"
import { Badge } from "@/components/ui/badge"

interface PageShellProps {
    children: ReactNode
    title: string
    subtitle?: string
    badge?: string
}

export function PageShell({ children, title, subtitle, badge }: PageShellProps) {
    return (
        <main className="relative min-h-screen bg-[#020617] text-white selection:bg-brand/30 selection:text-brand-foreground overflow-x-hidden">
            <HeroBackground />
            <SiteHeader />

            <div className="relative z-10 pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header da Página */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-3xl mx-auto mb-20"
                >
                    {badge && (
                        <Badge variant="outline" className="mb-6 bg-brand/5 border-brand/20 text-brand px-4 py-1">
                            {badge}
                        </Badge>
                    )}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-lg text-slate-400 leading-relaxed">
                            {subtitle}
                        </p>
                    )}
                </motion.div>

                {/* Conteúdo Principal */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    {children}
                </motion.div>
            </div>

            <SiteFooter />
        </main>
    )
}
