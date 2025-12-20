"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Navigation, Search, Eye, MapPin, Clock, Users, Truck, Calendar } from "lucide-react"
import { notifyError } from "@/lib/toast"
import { motion } from "framer-motion"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useDebounce } from "@/hooks/use-debounce"
import { SkeletonList } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Route {
    id: string
    name: string
    origin: string
    destination: string
    status: 'pending' | 'active' | 'completed' | 'cancelled'
    scheduled_date?: string
    motorista_name?: string
    vehicle_plate?: string
    passengers_count?: number
    distance_km?: number
    estimated_duration?: string
}

const STATUS_CONFIG = {
    pending: { label: 'Pendente', variant: 'secondary' as const },
    active: { label: 'Em Andamento', variant: 'default' as const },
    completed: { label: 'Concluída', variant: 'outline' as const },
    cancelled: { label: 'Cancelada', variant: 'destructive' as const },
}

export default function TransportadoraRotasPage() {
    const { user, loading: authLoading } = useAuthFast()
    const [routes, setRoutes] = useState<Route[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    useEffect(() => {
        if (user && !authLoading) {
            loadRoutes()
        }
    }, [user, authLoading])

    const loadRoutes = useCallback(async () => {
        try {
            setDataLoading(true)
            const { data, error } = await (supabase as any)
                .from('gf_routes')
                .select(`
          *,
          motorista:users!gf_routes_driver_id_fkey(name),
          veiculo:gf_vehicles(plate)
        `)
                .eq('transportadora_id', (user as any)?.transportadora_id)
                .order('scheduled_date', { ascending: false })

            if (error) throw error

            const formattedRoutes = (data || []).map((r: any) => ({
                ...r,
                motorista_name: r.motorista?.name,
                vehicle_plate: r.veiculo?.plate,
            }))

            setRoutes(formattedRoutes)
        } catch (error) {
            notifyError(error, "Erro ao carregar rotas")
            setRoutes([])
        } finally {
            setDataLoading(false)
        }
    }, [user])

    const filteredRoutes = useMemo(() => {
        let result = routes

        if (filterStatus !== "all") {
            result = result.filter(r => r.status === filterStatus)
        }

        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase()
            result = result.filter(r =>
                r.name?.toLowerCase().includes(query) ||
                r.origin?.toLowerCase().includes(query) ||
                r.destination?.toLowerCase().includes(query) ||
                r.motorista_name?.toLowerCase().includes(query) ||
                r.vehicle_plate?.toLowerCase().includes(query)
            )
        }

        return result
    }, [routes, debouncedSearchQuery, filterStatus])

    if (authLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin" /></div>
    }

    return (
        <AppShell user={{ id: user.id, name: user.name || "Transportadora", email: user.email, role: user.role || "transportadora", avatar_url: user.avatar_url }}>
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Rotas</h1>
                        <p className="text-sm sm:text-base text-text-muted-foreground">Visualize as rotas da sua transportadora</p>
                    </div>
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light h-4 w-4" />
                        <Input
                            placeholder="Buscar rotas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Status</SelectItem>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Grid */}
                {dataLoading && routes.length === 0 ? (
                    <SkeletonList count={5} />
                ) : (
                    <div className="grid gap-3 sm:gap-4 w-full">
                        {filteredRoutes.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Navigation className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">Nenhuma rota encontrada</p>
                            </Card>
                        ) : (
                            filteredRoutes.map((route) => {
                                const statusConfig = STATUS_CONFIG[route.status] || STATUS_CONFIG.pending

                                return (
                                    <motion.div
                                        key={route.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        whileHover={{ y: -4 }}
                                    >
                                        <Card className="p-3 sm:p-4 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:border-text-brand/30 group">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <div className="p-1 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                                                            <Navigation className="h-4 w-4 text-brand" />
                                                        </div>
                                                        <h3 className="font-bold text-base sm:text-lg group-hover:text-brand transition-colors">
                                                            {route.name || 'Rota sem nome'}
                                                        </h3>
                                                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-2 text-sm">
                                                        <MapPin className="h-4 w-4 text-success" />
                                                        <span>{route.origin}</span>
                                                        <span className="text-muted-foreground">→</span>
                                                        <MapPin className="h-4 w-4 text-error" />
                                                        <span>{route.destination}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-ink-muted">
                                                        {route.scheduled_date && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(route.scheduled_date).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        )}
                                                        {route.motorista_name && (
                                                            <span className="flex items-center gap-1">
                                                                <Users className="h-3 w-3" />
                                                                {route.motorista_name}
                                                            </span>
                                                        )}
                                                        {route.vehicle_plate && (
                                                            <span className="flex items-center gap-1">
                                                                <Truck className="h-3 w-3" />
                                                                {route.vehicle_plate}
                                                            </span>
                                                        )}
                                                        {route.estimated_duration && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {route.estimated_duration}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="min-h-[44px] touch-manipulation"
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Ver Detalhes
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                )}
            </div>
        </AppShell>
    )
}
