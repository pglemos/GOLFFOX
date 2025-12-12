"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Wrench, Plus, Search, Edit, Trash2, Truck, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Maintenance {
    id: string
    vehicle_id: string
    type: string
    description?: string
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    due_at: string
    completed_at?: string
    cost?: number
    notes?: string
    vehicle?: {
        plate: string
        model: string
    }
}

interface Vehicle {
    id: string
    plate: string
    model: string
}

const MAINTENANCE_TYPES = [
    { value: 'preventive', label: 'Preventiva' },
    { value: 'corrective', label: 'Corretiva' },
    { value: 'inspection', label: 'Inspeção' },
    { value: 'oil_change', label: 'Troca de Óleo' },
    { value: 'tire_change', label: 'Troca de Pneus' },
    { value: 'brake', label: 'Freios' },
    { value: 'other', label: 'Outro' },
]

const STATUS_CONFIG = {
    pending: { label: 'Pendente', icon: Clock, variant: 'secondary' as const, color: 'text-yellow-500' },
    in_progress: { label: 'Em Andamento', icon: Wrench, variant: 'default' as const, color: 'text-blue-500' },
    completed: { label: 'Concluída', icon: CheckCircle, variant: 'outline' as const, color: 'text-green-500' },
    cancelled: { label: 'Cancelada', icon: AlertTriangle, variant: 'destructive' as const, color: 'text-red-500' },
}

export default function ManutencaoPage() {
    const { user, loading: authLoading } = useAuthFast()
    const [maintenances, setMaintenances] = useState<Maintenance[]>([])
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [filterVehicle, setFilterVehicle] = useState<string>("all")
    const debouncedSearchQuery = useDebounce(searchQuery, 300)
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        vehicle_id: "",
        type: "preventive",
        description: "",
        status: "pending",
        due_at: "",
        cost: "",
        notes: "",
    })

    useEffect(() => {
        if (user && !authLoading) {
            loadMaintenances()
            loadVehicles()
        }
    }, [user, authLoading])

    useEffect(() => {
        if (selectedMaintenance) {
            setFormData({
                vehicle_id: selectedMaintenance.vehicle_id || "",
                type: selectedMaintenance.type || "preventive",
                description: selectedMaintenance.description || "",
                status: selectedMaintenance.status || "pending",
                due_at: selectedMaintenance.due_at?.split('T')[0] || "",
                cost: selectedMaintenance.cost?.toString() || "",
                notes: selectedMaintenance.notes || "",
            })
        } else {
            setFormData({ vehicle_id: "", type: "preventive", description: "", status: "pending", due_at: "", cost: "", notes: "" })
        }
    }, [selectedMaintenance])

    const loadMaintenances = useCallback(async () => {
        try {
            setDataLoading(true)
            const { data, error } = await (supabase as any)
                .from('gf_vehicle_maintenance')
                .select(`
          *,
          vehicle:gf_vehicles(plate, model)
        `)
                .order('due_at', { ascending: false })

            if (error) throw error
            setMaintenances((data as any) || [])
        } catch (error) {
            notifyError(error, "Erro ao carregar manutenções")
            setMaintenances([])
        } finally {
            setDataLoading(false)
        }
    }, [])

    const loadVehicles = useCallback(async () => {
        try {
            const { data } = await (supabase as any)
                .from('gf_vehicles')
                .select('id, plate, model')
                .eq('is_active', true)
                .order('plate')
            setVehicles(data || [])
        } catch {
            setVehicles([])
        }
    }, [])

    const filteredMaintenances = useMemo(() => {
        let result = maintenances

        if (filterStatus !== "all") {
            result = result.filter(m => m.status === filterStatus)
        }

        if (filterVehicle !== "all") {
            result = result.filter(m => m.vehicle_id === filterVehicle)
        }

        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase()
            result = result.filter(m =>
                m.description?.toLowerCase().includes(query) ||
                m.type?.toLowerCase().includes(query) ||
                m.vehicle?.plate?.toLowerCase().includes(query) ||
                m.vehicle?.model?.toLowerCase().includes(query)
            )
        }

        return result
    }, [maintenances, debouncedSearchQuery, filterStatus, filterVehicle])

    const handleSave = async () => {
        if (!formData.vehicle_id || !formData.due_at) {
            notifyError(new Error("Campos obrigatórios"), "Selecione veículo e data")
            return
        }

        setSaving(true)
        try {
            const payload = {
                vehicle_id: formData.vehicle_id,
                type: formData.type,
                description: formData.description || null,
                status: formData.status,
                due_at: formData.due_at,
                cost: formData.cost ? parseFloat(formData.cost) : null,
                notes: formData.notes || null,
                completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
            }

            if (selectedMaintenance) {
                const { error } = await (supabase as any)
                    .from('gf_vehicle_maintenance')
                    .update(payload)
                    .eq('id', selectedMaintenance.id)
                if (error) throw error
            } else {
                const { error } = await (supabase as any)
                    .from('gf_vehicle_maintenance')
                    .insert(payload)
                if (error) throw error
            }

            notifySuccess(selectedMaintenance ? 'Manutenção atualizada' : 'Manutenção criada')
            setIsModalOpen(false)
            loadMaintenances()
        } catch (error) {
            notifyError(error, "Erro ao salvar manutenção")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta manutenção?')) return

        try {
            const { error } = await (supabase as any)
                .from('gf_vehicle_maintenance')
                .delete()
                .eq('id', id)
            if (error) throw error
            notifySuccess('Manutenção excluída')
            loadMaintenances()
        } catch (error) {
            notifyError(error, "Erro ao excluir")
        }
    }

    if (authLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" /></div>
    }

    return (
        <AppShell user={{ id: user.id, name: user.name || "Transportadora", email: user.email, role: user.role || "transportadora", avatar_url: user.avatar_url }}>
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Manutenções</h1>
                        <p className="text-sm sm:text-base text-[var(--muted)]">Gerenciar manutenções da frota</p>
                    </div>
                    <Button
                        onClick={() => { setSelectedMaintenance(null); setIsModalOpen(true) }}
                        className="w-full sm:w-auto flex-shrink-0 min-h-[44px] touch-manipulation"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Nova Manutenção</span>
                        <span className="sm:hidden">Nova</span>
                    </Button>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Buscar manutenções..."
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
                    <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <Truck className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Veículo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Veículos</SelectItem>
                            {vehicles.map(v => (
                                <SelectItem key={v.id} value={v.id}>{v.plate} - {v.model}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* View Toggle */}
                <div className="flex justify-end mb-4">
                    <div className="flex items-center space-x-2 bg-muted p-1 rounded-md">
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="h-8 px-2"
                        >
                            <Calendar className="h-4 w-4 mr-1" /> Lista
                        </Button>
                        <Button
                            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('kanban')}
                            className="h-8 px-2"
                        >
                            <ArrowUpRight className="h-4 w-4 mr-1" /> Quadro
                        </Button>
                    </div>
                </div>

                {/* Grid vs Kanban */}
                {dataLoading && maintenances.length === 0 ? (
                    <SkeletonList count={5} />
                ) : viewMode === 'list' ? (
                    <div className="grid gap-3 sm:gap-4 w-full">
                        {filteredMaintenances.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">Nenhuma manutenção encontrada</p>
                            </Card>
                        ) : (
                            filteredMaintenances.map((maintenance) => {
                                const statusConfig = STATUS_CONFIG[maintenance.status] || STATUS_CONFIG.pending
                                const StatusIcon = statusConfig.icon
                                const typeLabel = MAINTENANCE_TYPES.find(t => t.value === maintenance.type)?.label || maintenance.type
                                const isOverdue = new Date(maintenance.due_at) < new Date() && maintenance.status === 'pending'

                                return (
                                    <motion.div
                                        key={maintenance.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        whileHover={{ y: -4 }}
                                    >
                                        <Card className={`p-3 sm:p-4 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--brand)]/30 group ${isOverdue ? 'border-red-500/50' : ''}`}>
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <div className={`p-1 rounded-lg bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)]`}>
                                                            <Wrench className="h-4 w-4 text-[var(--brand)]" />
                                                        </div>
                                                        <h3 className="font-bold text-base sm:text-lg group-hover:text-[var(--brand)] transition-colors">
                                                            {maintenance.vehicle?.plate || 'Veículo'}
                                                        </h3>
                                                        <Badge variant="outline">{typeLabel}</Badge>
                                                        <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                                                            <StatusIcon className="h-3 w-3" />
                                                            {statusConfig.label}
                                                        </Badge>
                                                        {isOverdue && (
                                                            <Badge variant="destructive" className="flex items-center gap-1">
                                                                <AlertTriangle className="h-3 w-3" />
                                                                Atrasada
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="font-medium mb-1 text-sm sm:text-base">{maintenance.vehicle?.model}</p>
                                                    {maintenance.description && (
                                                        <p className="text-sm text-[var(--ink-muted)] mb-2">{maintenance.description}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-[var(--ink-muted)]">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Prevista: {new Date(maintenance.due_at).toLocaleDateString('pt-BR')}
                                                        </span>
                                                        {maintenance.cost && (
                                                            <span>Custo: R$ {maintenance.cost.toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setSelectedMaintenance(maintenance); setIsModalOpen(true) }}
                                                        className="min-h-[44px] touch-manipulation"
                                                    >
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(maintenance.id)}
                                                        className="min-h-[44px] touch-manipulation text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-4">
                        {['pending', 'in_progress', 'completed'].map(status => {
                            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
                            const items = filteredMaintenances.filter(m =>
                                status === 'completed' ? (m.status === 'completed' || m.status === 'cancelled') : m.status === status
                            )

                            return (
                                <div key={status} className="bg-muted/30 rounded-lg p-3 min-w-[280px]">
                                    <div className={`flex items-center gap-2 mb-3 pb-2 border-b border-border font-semibold ${config.color}`}>
                                        <config.icon className="h-4 w-4" />
                                        {config.label}
                                        <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {items.map(maintenance => (
                                            <Card
                                                key={maintenance.id}
                                                className="p-3 cursor-pointer hover:shadow-md transition-all bg-card"
                                                onClick={() => { setSelectedMaintenance(maintenance); setIsModalOpen(true) }}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-sm">{maintenance.vehicle?.plate}</span>
                                                    <Badge variant="outline" className="text-[10px] h-5">{maintenance.type}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{maintenance.description || 'Sem descrição'}</p>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>{new Date(maintenance.due_at).toLocaleDateString('pt-BR')}</span>
                                                    {maintenance.cost && <span>R$ {maintenance.cost}</span>}
                                                </div>
                                            </Card>
                                        ))}
                                        {items.length === 0 && (
                                            <div className="text-center py-4 text-xs text-muted-foreground border-2 border-dashed rounded-md">Vazio</div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wrench className="h-5 w-5" />
                            {selectedMaintenance ? "Editar Manutenção" : "Nova Manutenção"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label>Veículo *</Label>
                                <Select value={formData.vehicle_id} onValueChange={(v) => setFormData({ ...formData, vehicle_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o veículo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{v.plate} - {v.model}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MAINTENANCE_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Data Prevista *</Label>
                                <Input
                                    type="date"
                                    value={formData.due_at}
                                    onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Custo (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>Descrição</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descreva a manutenção..."
                                    rows={3}
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>Observações</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Observações adicionais..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    )
}
