"use client"

import { useState, useRef, MouseEvent } from "react"
import { motion, useMotionValue } from "framer-motion"
import { Users, Ticket, Bus, Smartphone, Route, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
    {
        title: "App do Passageiro",
        description: "Seus colaboradores acompanham o ônibus em tempo real, reservam assentos e avaliam a viagem.",
        icon: Smartphone,
        className: "md:col-span-2 md:row-span-2",
    },
    {
        title: "Rotas Inteligentes",
        description: "Algoritmos que desenham o melhor trajeto para buscar todos os funcionários no menor tempo.",
        icon: Route,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "Controle de Embarque",
        description: "Check-in digital via QR Code ou cartão NFC para garantir que apenas autorizados embarquem.",
        icon: Ticket,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "Gestão de Frota",
        description: "Controle total de manutenção, documentação e custos dos seus ônibus e vans.",
        icon: Bus,
        className: "md:col-span-1",
    },
    {
        title: "Pontualidade Real",
        description: "Monitoramento de horários de parada e previsão de chegada (ETA) precisa.",
        icon: Clock,
        className: "md:col-span-1",
    },
    {
        title: "Ocupação Otimizada",
        description: "Analytics para redimensionar a frota conforme a demanda real de passageiros.",
        icon: Users,
        className: "md:col-span-1",
    }
]

export function BentoFeatures() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)] max-w-7xl mx-auto px-4">
            {features.map((feature, i) => (
                <FeatureCard key={i} feature={feature} index={i} />
            ))}
        </div>
    )
}

function FeatureCard({ feature, index }: { feature: any, index: number }) {
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect()
        mouseX.set(clientX - left)
        mouseY.set(clientY - top)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            onMouseMove={handleMouseMove}
            className={cn(
                "group relative border border-white/10 rounded-3xl bg-slate-950/50 overflow-hidden",
                feature.className
            )}
        >
            {/* Efeito de Spotlight que segue o mouse */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(650px circle at ${mouseX.get()}px ${mouseY.get()}px, rgba(249, 115, 22, 0.15), transparent 80%)`,
                }}
            />

            {/* Container do Conteúdo */}
            <div className="relative h-full p-8 flex flex-col z-10">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-brand shadow-lg shadow-brand/10 group-hover:scale-110 transition-transform duration-500">
                    <feature.icon className="h-6 w-6" />
                </div>

                <h3 className="mb-3 text-xl font-bold text-white tracking-tight group-hover:text-brand transition-colors duration-300">
                    {feature.title}
                </h3>

                <p className="text-slate-400 leading-relaxed text-sm flex-grow">
                    {feature.description}
                </p>

                {/* Efeito decorativo sutil */}
                <div className="absolute bottom-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <feature.icon className="h-24 w-24 -rotate-12" />
                </div>
            </div>

            {/* Padrão de noise sutil para textura */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-overlay pointer-events-none" />
        </motion.div>
    )
}
