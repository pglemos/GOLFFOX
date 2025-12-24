"use client"

import { PageShell } from "@/components/landing/page-shell"
import { BentoFeatures } from "@/components/landing/bento-features"
import { CheckCircle2, QrCode, MapPin, Bus, Users, CalendarClock } from "lucide-react"

export default function FeaturesPage() {
    return (
        <PageShell
            title="Tecnologia para Transporte de Pessoas"
            subtitle="Ferramentas avançadas para garantir que cada colaborador chegue ao trabalho com segurança, conforto e pontualidade."
            badge="PLATAFORMA INTEGRADA"
        >
            <div className="space-y-24">
                {/* Destaque Principal (Bento Grid) */}
                <section>
                    <BentoFeatures />
                </section>

                {/* Lista Detalhada */}
                <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {detailedFeatures.map((item, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors group">
                            <div className="h-12 w-12 rounded-lg bg-brand/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <item.icon className="h-6 w-6 text-brand" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-white">{item.title}</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">{item.description}</p>
                            <ul className="mt-6 space-y-2">
                                {item.bullets.map((bullet, j) => (
                                    <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        {bullet}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>
            </div>
        </PageShell>
    )
}

const detailedFeatures = [
    {
        title: "Embarque Digital",
        description: "Controle de acesso rigoroso aos veículos usando tecnologias modernas de identificação.",
        icon: QrCode,
        bullets: ["QR Code Dinâmico", "Cartão NFC/RFID", "Reconhecimento Facial"]
    },
    {
        title: "Roteirização de Passageiros",
        description: "Crie rotas baseadas nos endereços residenciais dos colaboradores para máxima eficiência.",
        icon: MapPin,
        bullets: ["Geocodificação de endereços", "Pontos de parada ideais", "Otimização de quilometragem"]
    },
    {
        title: "Gestão da Frota",
        description: "Controle completo dos veículos, sejam próprios ou terceirizados (agregados).",
        icon: Bus,
        bullets: ["Checklist digital diário", "Gestão de manutenção", "Controle de documentos"]
    },
    {
        title: "Portal do RH",
        description: "Dashboard para o departamento de Recursos Humanos acompanhar indicadores.",
        icon: Users,
        bullets: ["Relatório de absenteísmo", "Custo por passageiro", "Satisfação do usuário"]
    },
    {
        title: "Monitoramento em Tempo Real",
        description: "Acompanhe cada viagem ao vivo e receba alertas de incidentes na rota.",
        icon: CalendarClock,
        bullets: ["Previsão de chegada (ETA)", "Alertas de atraso", "Playback de rotas"]
    }
]
