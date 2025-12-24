"use client"

import { PageShell } from "@/components/landing/page-shell"
import { ArrowRight, Factory, HardHat, GraduationCap, Building2 } from "lucide-react"

export default function SolutionsPage() {
    return (
        <PageShell
            title="Soluções por Segmento"
            subtitle="Otimizamos o transporte de pessoas em ambientes complexos, garantindo a continuidade da sua operação."
            badge="ESPECIALIDADES"
        >
            <div className="grid gap-8">
                {solutions.map((solution, i) => (
                    <div
                        key={i}
                        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50 p-8 md:p-12 transition-all hover:border-brand/30"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="flex-shrink-0 h-20 w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <solution.icon className="h-10 w-10 text-brand" />
                            </div>

                            <div className="flex-grow">
                                <h3 className="text-2xl font-bold text-white mb-2">{solution.title}</h3>
                                <p className="text-slate-400 text-lg mb-6 max-w-3xl">{solution.description}</p>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    {solution.benefits.map((benefit, j) => (
                                        <div key={j} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/5">
                                            <div className="h-2 w-2 rounded-full bg-brand" />
                                            <span className="text-sm font-medium text-slate-200">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="flex-shrink-0 flex items-center gap-2 text-brand font-semibold group/btn">
                                Falar com consultor
                                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </PageShell>
    )
}

const solutions = [
    {
        title: "Indústrias e Fábricas",
        description: "Transporte de centenas ou milhares de colaboradores em múltiplos turnos operacionais.",
        icon: Factory,
        benefits: ["Gestão complexa de turnos", "Redução de faltas/atrasos", "Integração com catracas", "Otimização de rotas fretadas"]
    },
    {
        title: "Mineração e Óleo & Gás",
        description: "Operações em locais remotos e de difícil acesso que exigem segurança extrema.",
        icon: HardHat,
        benefits: ["Rastreamento via satélite", "Controle de fadiga do motorista", "Telemetria avançada de segurança", "Botão de pânico e emergência"]
    },
    {
        title: "Transporte Universitário e Escolar",
        description: "Segurança total e tranquilidade para pais e alunos no trajeto diário.",
        icon: GraduationCap,
        benefits: ["App para pais acompanharem", "Notificação de embarque/desembarque", "Carteirinha digital", "Controle de presença"]
    },
    {
        title: "Hubs Corporativos",
        description: "Shuttles executivos conectando estações de metrô e escritórios empresariais.",
        icon: Building2,
        benefits: ["Experiência premium", "Reserva de assento via App", "Wi-Fi e comodidades a bordo", "Relatórios ambientais (ESG)"]
    }
]
