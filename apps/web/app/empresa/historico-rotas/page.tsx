"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Navigation, Search, Filter, ArrowUpDown, CheckCircle2, AlertCircle, XCircle } from "lucide-react"
import { motion } from "framer-motion"
import { notifyError } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

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

export default function HistoricoRotasPage() {
    const { user } = useAuth()
    const [executions, setExecutions] = useState<RouteExecution[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [sortBy, setSortBy] = useState<keyof RouteExecution>("date")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

    useEffect(() => {
        loadExecutions()
    }, [])

    const loadExecutions = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/empresa/historico-rotas')
            const data = await response.json()

            // Convert strings to Date objects
            const apiExecutions = data.executions.map((exec: any) => ({
                ...exec,
                date: new Date(exec.date)
            }))

            setExecutions(apiExecutions)
        } catch (error) {
            notifyError(error, "Erro ao carregar histórico")
        } finally {
            setLoading(false)
        }
    }

    const handleSort = (field: keyof RouteExecution) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortOrder("desc") // Default to desc for new field
        }
    }

    const filteredExecutions = executions
        .filter(exec => {
            const matchesSearch =
                exec.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exec.municipality.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exec.motorista.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus = statusFilter === "all" || exec.status === statusFilter

            return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
            const aValue = a[sortBy]
            const bValue = b[sortBy]

            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
            return 0
        })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-success-light text-success hover:bg-success-light border-success-light">Concluída</Badge>
            case 'in_progress':
                return <Badge className="bg-info-light text-info hover:bg-info-light border-info-light">Em Andamento</Badge>
            case 'cancelled':
                return <Badge className="bg-error-light text-error hover:bg-error-light border-error-light">Cancelada</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <AppShell panel="gestor_empresa" user={user ? { id: user.id, name: user.name, email: user.email || '', role: user.role || 'gestor_empresa', avatar_url: (user as any).avatar_url } : { id: 'mock', name: 'Gestor da Empresa', email: 'empresa@golffox.com', role: 'gestor_empresa' }}>
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Histórico de Rotas</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Consulte o histórico detalhado de execução das rotas
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Exportar Relatório</span>
                            <span className="sm:hidden">Exportar</span>
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-light" />
                            <Input
                                placeholder="Buscar por rota, município ou motorista..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Status</SelectItem>
                                    <SelectItem value="completed">Concluída</SelectItem>
                                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                                    <SelectItem value="cancelled">Cancelada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* Table/List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent" />
                            <p className="mt-4 text-ink-muted">Carregando histórico...</p>
                        </div>
                    ) : filteredExecutions.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Navigation className="h-16 w-16 text-ink-light mx-auto mb-4" />
                            <p className="text-lg font-medium text-ink-muted">Nenhuma rota encontrada</p>
                            <p className="text-sm text-ink-muted mt-1">Tente ajustar os filtros de busca.</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {filteredExecutions.map((exec, index) => (
                                <motion.div
                                    key={exec.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ y: -4 }}
                                    className="group"
                                >
                                    <Card key={exec.id} className="p-4 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:border-text-brand/30">
                                        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                                            {/* Main Info */}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{exec.route}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-ink-muted">
                                                            <MapPin className="h-3 w-3" />
                                                            {exec.municipality}
                                                        </div>
                                                    </div>
                                                    <div className="lg:hidden">
                                                        {getStatusBadge(exec.status)}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-ink-light" />
                                                        {exec.date.toLocaleDateString('pt-BR')}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-ink-light" />
                                                        {exec.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Navigation className="h-4 w-4 text-ink-light" />
                                                        {exec.motorista}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Metrics */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:w-auto lg:flex-shrink-0 bg-bg-soft p-3 rounded-lg">
                                                <div className="text-center">
                                                    <p className="text-xs text-ink-muted">Duração</p>
                                                    <p className="font-medium">{exec.duration}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-ink-muted">Distância</p>
                                                    <p className="font-medium">{exec.distance} km</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-ink-muted">Passageiros</p>
                                                    <p className="font-medium">{exec.passengers}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-ink-muted">Custo</p>
                                                    <p className="font-medium text-success">R$ {exec.cost.toFixed(2)}</p>
                                                </div>
                                            </div>

                                            {/* Scores */}
                                            <div className="flex gap-4 lg:w-48 lg:flex-shrink-0 justify-center lg:justify-end">
                                                <div className="text-center">
                                                    <div className="relative inline-flex items-center justify-center">
                                                        <svg className="w-10 h-10 transform -rotate-90">
                                                            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-ink-light" />
                                                            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-info" strokeDasharray={100} strokeDashoffset={100 - exec.punctuality} />
                                                        </svg>
                                                        <span className="absolute text-xs font-medium">{exec.punctuality}%</span>
                                                    </div>
                                                    <p className="text-[10px] text-ink-muted mt-1">Pontualidade</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="relative inline-flex items-center justify-center">
                                                        <svg className="w-10 h-10 transform -rotate-90">
                                                            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-ink-light" />
                                                            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-success" strokeDasharray={100} strokeDashoffset={100 - exec.optimization} />
                                                        </svg>
                                                        <span className="absolute text-xs font-medium">{exec.optimization}%</span>
                                                    </div>
                                                    <p className="text-[10px] text-ink-muted mt-1">Otimização</p>
                                                </div>
                                            </div>

                                            {/* Status Badge (Desktop) */}
                                            <div className="hidden lg:block w-32 text-right">
                                                {getStatusBadge(exec.status)}
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    )
}
