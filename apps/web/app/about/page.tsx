"use client"

import { PageShell } from "@/components/landing/page-shell"
import { Users2, Target, Trophy } from "lucide-react"

export default function AboutPage() {
    return (
        <PageShell
            title="Nossa Missão"
            subtitle="Estamos construindo o sistema operacional para o futuro da logística global."
            badge="SOBRE A GOLFFOX"
        >
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <div className="prose prose-invert prose-lg text-slate-400">
                        <p>
                            A GOLFFOX nasceu de uma necessidade real no mercado de transportes: a desconexão entre dados operacionais, financeiros e humanos.
                        </p>
                        <p>
                            Enquanto o mundo se digitalizava, frotas inteiras ainda eram geridas em planilhas desconexas e sistemas legados lentos. Vimos uma oportunidade de mudar isso aplicando tecnologias de ponta como Inteligência Artificial e IoT.
                        </p>
                        <p className="text-white font-medium italic border-l-4 border-brand pl-6 py-2 bg-white/5 rounded-r-lg">
                            "Não somos apenas uma empresa de software. Somos a inteligência por trás de cada quilômetro rodado com eficiência."
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-4">
                        <Stat number="50+" label="Especialistas" />
                        <Stat number="4" label="Países" />
                        <Stat number="24/7" label="Suporte" />
                    </div>
                </div>

                <div className="space-y-6">
                    <Card
                        icon={Target}
                        title="Visão"
                        text="Ser a plataforma global padrão para gestão de ativos móveis até 2030."
                    />
                    <Card
                        icon={Users2}
                        title="Cultura"
                        text="Innovação implacável. Foco obsessivo no cliente. Transparência radical."
                    />
                    <Card
                        icon={Trophy}
                        title="Excelência"
                        text="Entregamos software de classe mundial com design impecável e performance extrema."
                    />
                </div>
            </div>
        </PageShell>
    )
}

function Stat({ number, label }: { number: string, label: string }) {
    return (
        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="text-3xl font-bold text-white mb-1">{number}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">{label}</div>
        </div>
    )
}

function Card({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>, title: string, text: string }) {
    return (
        <div className="flex gap-6 p-6 rounded-2xl bg-slate-950/50 border border-white/10 hover:border-brand/30 transition-colors">
            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-brand" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{text}</p>
            </div>
        </div>
    )
}
