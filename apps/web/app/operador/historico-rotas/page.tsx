"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Navigation,
    Calendar,
    MapPin,
    Users,
    Clock,
    TrendingUp,
    DollarSign,
    Search
} from "lucide-react"
import { notifyError } from "@/lib/toast"
import { cn } from "@/lib/utils"

interface RouteExecution {
    id: string
    date: Date
    municipality: string
    route: string
    motorista: string
    duration: string // "2h 15min"
    distance: number // km
    passengers: number
    punctuality: number // %
    optimization: number // %
    cost: number // R$
    status: 'completed' | 'in_progress' | 'cancelled'
}

type FilterPeriod = 'last7' | 'last30' | 'last90' | 'custom'
type SortBy = 'date_recent' | 'date_old' | 'punctuality' | 'efficiency' | 'cost'

export default function HistoricoRotasPage() {
    const [executions, setExecutions] = useState<RouteExecution[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Filtros
    const [period, setPeriod] = useState<FilterPeriod>('last30')
    const [municipality, setMunicipality] = useState('all')
    const [sortBy, setSortBy] = useState<SortBy>('date_recent')

    useEffect(() => {
        loadExecutions()
    }, [period, municipality, sortBy])

    const loadExecutions = async () => {
        try {
            setLoading(true)
            // TODO: Implementar chamada real à API
            // Dados mockados por enquanto
            setExecutions([])
        } catch (error) {
            notifyError(error, "Erro ao carregar histórico")
        } finally {
            setLoading(false)
        }
    }

    const filteredExecutions = executions.filter(exec =>
        exec.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exec.motorista.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exec.municipality.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusBadge = (status: RouteExecution['status']) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-700 border-green-200">Concluída</Badge>
            case 'in_progress':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Em Andamento</Badge>
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-700 border-red-200">Cancelada</Badge>
        }
    }

    const getSortLabel = (sort: SortBy) => {
        switch (sort) {
            case 'date_recent': return 'Data (mais recente)'
            case 'date_old': return 'Data (mais antiga)'
            case 'punctuality': return 'Pontualidade'
            case 'efficiency': return 'Eficiência'
            case 'cost': return 'Custo'
        }
    }

    return (
        <AppShell panel="operador">
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">Histórico de Rotas</h1>
                    <p className="text-sm text-[var(--ink-muted)]">
                        Acompanhe e desempenho e métricas das rotas executadas
                    </p>
                </div>

                {/* Filtros */}
                <Card className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Período */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Período</label>
                            <Select value={period} onValueChange={(v) => setPeriod(v as FilterPeriod)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="last7">Últimos 7 dias</SelectItem>
                                    <SelectItem value="last30">Últimos 30 dias</SelectItem>
                                    <SelectItem value="last90">Últimos 90 dias</SelectItem>
                                    <SelectItem value="custom">Personalizado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Município */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Município</label>
                            <Select value={municipality} onValueChange={setMunicipality}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os municípios</SelectItem>
                                    <SelectItem value="belo_horizonte">Belo Horizonte</SelectItem>
                                    <SelectItem value="contagem">Contagem</SelectItem>
                                    <SelectItem value="betim">Betim</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Ordenar por */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Ordenar por</label>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date_recent">Data (mais recente)</SelectItem>
                                    <SelectItem value="date_old">Data (mais antiga)</SelectItem>
                                    <SelectItem value="punctuality">Pontualidade</SelectItem>
                                    <SelectItem value="efficiency">Eficiência</SelectItem>
                                    <SelectItem value="cost">Custo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Busca */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Rota, motorista..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Execuções de Rotas */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Execuções de Rotas</h2>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
                            <p className="mt-4 text-[var(--ink-muted)]">Carregando histórico...</p>
                        </div>
                    ) : filteredExecutions.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Navigation className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg font-medium text-[var(--ink-muted)]">
                                Nenhuma rota encontrada
                            </p>
                            <p className="text-sm text-[var(--ink-muted)] mt-1">
                                Não há execuções de rotas para os filtros selecionados.
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {/* Table Header - Desktop Only */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
                                <div className="col-span-1">DATA/HORA</div>
                                <div className="col-span-2">MUNICÍPIO</div>
                                <div className="col-span-2">MOTORISTA</div>
                                <div className="col-span-1">DURAÇÃO</div>
                                <div className="col-span-1">DISTÂNCIA</div>
                                <div className="col-span-1">PASSAGEIROS</div>
                                <div className="col-span-1">PONTUALIDADE</div>
                                <div className="col-span-1">OTIMIZAÇÃO</div>
                                <div className="col-span-1">CUSTO</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Table Rows */}
                            {filteredExecutions.map((exec) => (
                                <Card key={exec.id} className="p-4 hover:shadow-md transition-shadow">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                        {/* Data/Hora */}
                                        <div className="lg:col-span-1">
                                            <p className="lg:hidden text-xs text-gray-500 mb-1">Data/Hora</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400 lg:hidden" />
                                                <div className="text-sm">
                                                    <p className="font-medium">{new Date(exec.date).toLocaleDateString('pt-BR')}</p>
                                                    <p className="text-xs text-gray-500">{new Date(exec.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Município */}
                                        <div className="lg:col-span-2">
                                            <p className="lg:hidden text-xs text-gray-500 mb-1">Município</p>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400 lg:hidden" />
                                                <p className="font-medium text-sm">{exec.municipality}</p>
                                            </div>
                                        </div>

                                        {/* Motorista */}
                                        <div className="lg:col-span-2">
                                            <p className="lg:hidden text-xs text-gray-500 mb-1">Motorista</p>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-400 lg:hidden" />
                                                <div>
                                                    <p className="font-medium text-sm">{exec.motorista}</p>
                                                    <p className="text-xs text-gray-500">{exec.route}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Duração */}
                                        <div className="lg:col-span-1">
                                            <p className="lg:hidden text-xs text-gray-500 mb-1">Duração</p>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-400 lg:hidden" />
                                                <p className="text-sm font-medium">{exec.duration}</p>
                                            </div>
                                        </div>

                                        {/* Distância */}
                                        <div className="lg:col-span-1">
                                            <p className="lg:hidden text-xs text-gray-500 mb-1">Distância</p>
                                            <div className="flex items-center gap-2">
                                                <Navigation className="h-4 w-4 text-gray-400 lg:hidden" />
                                                <p className="text-sm font-medium">{exec.distance} km</p>
                                            </div>
                                        </div>

                                        {/* Passageiros */}
                                        <div className="lg:col-span-1">
                                            <p className="lg:hidden text-xs text-gray-500 mb-1">Passageiros</p>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-400 lg:hidden" />
                                                <p className="text-sm font-medium">{exec.passengers}</p>
                                            </div>
                                        </div>

                                        {/* Pontualidade */}
                                        <div className="lg:col-span-1">
                                            <p className="lg:hidden text-xs text-gray-500 mb-1">Pontualidade</p>
                                            <div className={cn(
                                                "text-sm font-bold",
                                                exec.punctuality >= 90 ? "text-green-600" :
                                                    exec.punctuality >= 70 ? "text-yellow-600" : "text-red-600"
                                            )}>
                                                {exec.punctuality}%
                                            </div>
                                        </div>

                                        {/* Otimização */}
                                        <div className="lg:col-span-1">
                                            <p className="lg:hidden text-xs text-gray-500 mb-1">Otimização</p>
                                            <div className={cn(
                                                "text-sm font-bold",
                                                exec.optimization >= 90 ? "text-green-600" :
                                                    exec.optimization >= 70 ? "text-yellow-600" : "text-red-600"
                                            )}>
                                                {exec.optimization}%
                                            </div>
                                        </div>

                                        {/* Custo */}
                                        <div className="lg:col-span-1">
                                            <p className="lg:hidden text-xs text-gray-500 mb-1">Custo</p>
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-gray-400 lg:hidden" />
                                                <p className="text-sm font-medium text-green-600">
                                                    R$ {exec.cost.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="lg:col-span-1 flex items-center justify-end">
                                            <Button variant="ghost" size="sm">
                                                Detalhes
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    )
}
