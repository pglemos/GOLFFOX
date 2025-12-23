"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { Star, ThumbsUp, ThumbsDown, TrendingUp, MessageSquare, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface SatisfactionData {
    overall_rating: number
    total_feedbacks: number
    positive_percent: number
    negative_percent: number
    nps_score: number
    categories: { name: string; rating: number }[]
    recent_feedbacks: { id: string; rating: number; comment: string; date: string }[]
}

export default function SatisfacaoPage() {
    const { user } = useAuth()
    const [data, setData] = useState<SatisfactionData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mock satisfaction data
        const mockData: SatisfactionData = {
            overall_rating: 4.5,
            total_feedbacks: 284,
            positive_percent: 89,
            negative_percent: 11,
            nps_score: 72,
            categories: [
                { name: 'Pontualidade', rating: 4.7 },
                { name: 'Conforto', rating: 4.3 },
                { name: 'Atendimento', rating: 4.6 },
                { name: 'Segurança', rating: 4.8 },
            ],
            recent_feedbacks: [
                { id: '1', rating: 5, comment: 'Excelente serviço! Motorista muito educado.', date: '2024-12-11' },
                { id: '2', rating: 4, comment: 'Bom serviço, chegou no horário.', date: '2024-12-10' },
                { id: '3', rating: 5, comment: 'Ótimo, como sempre!', date: '2024-12-09' },
            ]
        }
        setData(mockData)
        setLoading(false)
    }, [])

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                className={`h-5 w-5 ${i < Math.round(rating) ? 'fill-warning text-warning' : 'text-ink-light'}`}
            />
        ))
    }

    if (loading || !data) return null

    return (
        <AppShell panel="gestor_empresa" user={user ? { id: user.id, name: user.name || 'Gestor da Empresa', email: user.email || '', role: user.role || 'gestor_empresa' } : { id: 'mock', name: 'Gestor da Empresa', email: 'empresa@golffox.com', role: 'gestor_empresa' }}>
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
                            <Star className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
                            Indicadores de Satisfação
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Feedback dos colaboradores sobre o serviço de transporte
                        </p>
                    </div>
                </div>

                {/* Main KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-warning-light to-warning-light border-warning-light">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                {renderStars(data.overall_rating)}
                            </div>
                            <p className="text-3xl font-bold">{data.overall_rating.toFixed(1)}</p>
                            <p className="text-sm text-muted-foreground">Avaliação Geral</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2">
                                <ThumbsUp className="h-8 w-8 text-success" />
                                <div>
                                    <p className="text-2xl font-bold text-success">{data.positive_percent}%</p>
                                    <p className="text-sm text-muted-foreground">Positivos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-8 w-8 text-info" />
                                <div>
                                    <p className="text-2xl font-bold text-info">{data.nps_score}</p>
                                    <p className="text-sm text-muted-foreground">NPS Score</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-8 w-8 text-purple-600" />
                                <div>
                                    <p className="text-2xl font-bold">{data.total_feedbacks}</p>
                                    <p className="text-sm text-muted-foreground">Total Feedbacks</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Categories */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Avaliação por Categoria</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.categories.map(cat => (
                                <div key={cat.name}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">{cat.name}</span>
                                        <span className="text-sm text-muted-foreground">{cat.rating.toFixed(1)}</span>
                                    </div>
                                    <Progress value={cat.rating * 20} className="h-2" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Recent Feedbacks */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Feedbacks Recentes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.recent_feedbacks.map(fb => (
                                <div key={fb.id} className="border-b pb-3 last:border-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {renderStars(fb.rating)}
                                        <span className="text-xs text-muted-foreground ml-auto">{fb.date}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{fb.comment}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppShell>
    )
}
