"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Truck, Plus, Search, Edit, Trash2, Building2, Calendar } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"
import { motion } from "framer-motion"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useDebounce } from "@/hooks/use-debounce"
import { SkeletonList } from "@/components/ui/skeleton"
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
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Lazy load modal
const VehicleModal = dynamic(
    () => import("@/components/modals/vehicle-modal").then(m => ({ default: m.VehicleModal })),
    { ssr: false, loading: () => null }
)

interface veiculo {
    id: string
    plate: string
    model: string
    year?: number
    capacity?: number
    prefix?: string
    photo_url?: string
    transportadora_id?: string
    carrier_name?: string
    is_active?: boolean
}

interface Transportadora {
    id: string
    name: string
}

export default function TransportadoraVeiculosPage() {
    const { user, loading: authLoading } = useAuthFast()
    const [vehicles, setVehicles] = useState<veiculo[]>([])
    const [transportadoras, setTransportadoras] = useState<Transportadora[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [selectedVehicle, setSelectedVehicle] = useState<veiculo | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSelectCarrierOpen, setIsSelectCarrierOpen] = useState(false)
    const [newVehicleCarrierId, setNewVehicleCarrierId] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState("")
    const [filterTransportadora, setFilterTransportadora] = useState<string>("all")
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    // Abre dialog de seleção de transportadora para novo veículo
    const handleNewVehicle = () => {
        setNewVehicleCarrierId("")
        setIsSelectCarrierOpen(true)
    }

    // Após selecionar transportadora, abre modal de cadastro
    const handleCarrierSelected = () => {
        if (!newVehicleCarrierId) return
        const selectedCarrier = transportadoras.find(t => t.id === newVehicleCarrierId)
        setSelectedVehicle({
            id: "",
            plate: "",
            model: "",
            transportadora_id: newVehicleCarrierId,
            carrier_name: selectedCarrier?.name
        })
        setIsSelectCarrierOpen(false)
        setIsModalOpen(true)
    }

    useEffect(() => {
        if (user && !authLoading) {
            loadVehicles()
            loadTransportadoras()
        }
    }, [user, authLoading])

    const loadVehicles = useCallback(async () => {
        try {
            setDataLoading(true)
            const response = await fetch('/api/admin/vehicles-list')
            if (!response.ok) throw new Error('Erro ao carregar veículos')
            const data = await response.json()
            setVehicles(Array.isArray(data) ? data : data.vehicles || [])
        } catch (error) {
            notifyError(error, "Erro ao carregar veículos")
            setVehicles([])
        } finally {
            setDataLoading(false)
        }
    }, [])

    const loadTransportadoras = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/transportadoras-list')
            if (!response.ok) return
            const data = await response.json()
            // API retorna { success: true, carriers: [...] }
            setTransportadoras(Array.isArray(data) ? data : data.carriers || data.transportadoras || [])
        } catch {
            setTransportadoras([])
        }
    }, [])

    const filteredVehicles = useMemo(() => {
        let result = vehicles

        // Filtrar por transportadora
        if (filterTransportadora !== "all") {
            result = result.filter(v => v.transportadora_id === filterTransportadora)
        }

        // Filtrar por busca
        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase()
            result = result.filter(v =>
                v.plate?.toLowerCase().includes(query) ||
                v.model?.toLowerCase().includes(query) ||
                v.prefix?.toLowerCase().includes(query) ||
                v.carrier_name?.toLowerCase().includes(query)
            )
        }

        return result
    }, [vehicles, debouncedSearchQuery, filterTransportadora])

    const handleDelete = async (vehicleId: string, vehiclePlate: string) => {
        if (!confirm(`Excluir veículo "${vehiclePlate}"?`)) return

        try {
            const response = await fetch(`/api/admin/vehicles/delete?id=${vehicleId}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Erro ao excluir')
            notifySuccess('Veículo excluído')
            loadVehicles()
        } catch (error) {
            notifyError(error, "Erro ao excluir veículo")
        }
    }

    if (authLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin" /></div>
    }

    return (
        <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Veículos das Transportadoras</h1>
                        <p className="text-sm sm:text-base text-text-muted-foreground">Todos os veículos de todas as transportadoras</p>
                    </div>
                    <Button
                        onClick={handleNewVehicle}
                        className="w-full sm:w-auto flex-shrink-0 min-h-[44px] touch-manipulation"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Cadastrar Veículo</span>
                        <span className="sm:hidden">Cadastrar</span>
                    </Button>
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light h-4 w-4" />
                        <Input
                            placeholder="Buscar veículos por placa, modelo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={filterTransportadora} onValueChange={setFilterTransportadora}>
                        <SelectTrigger className="w-full sm:w-[220px]">
                            <Building2 className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Transportadora" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas Transportadoras</SelectItem>
                            {transportadoras.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Grid */}
                {dataLoading && vehicles.length === 0 ? (
                    <SkeletonList count={5} />
                ) : (
                    <div className="grid gap-3 sm:gap-4 w-full">
                        {filteredVehicles.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">Nenhum veículo encontrado</p>
                            </Card>
                        ) : (
                            filteredVehicles.map((veiculo) => (
                                <motion.div
                                    key={veiculo.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <Card className="p-3 sm:p-4 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:border-text-brand/30 group">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                            <div className="flex-1 flex gap-3 sm:gap-4 min-w-0">
                                                {veiculo.photo_url && (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img
                                                        src={veiculo.photo_url}
                                                        alt={veiculo.plate}
                                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border-2 border-border flex-shrink-0"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <div className="p-1 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                                                            <Truck className="h-4 w-4 text-brand" />
                                                        </div>
                                                        <h3 className="font-bold text-base sm:text-lg group-hover:text-brand transition-colors">{veiculo.plate}</h3>
                                                        {veiculo.prefix && (
                                                            <Badge variant="outline">Prefixo: {veiculo.prefix}</Badge>
                                                        )}
                                                        <Badge variant={veiculo.is_active !== false ? "default" : "secondary"}>
                                                            {veiculo.is_active !== false ? "Ativo" : "Inativo"}
                                                        </Badge>
                                                    </div>
                                                    <p className="font-medium mb-1 text-sm sm:text-base">{veiculo.model || "Sem modelo"}</p>
                                                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-ink-muted">
                                                        {veiculo.year && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {veiculo.year}
                                                            </span>
                                                        )}
                                                        {veiculo.capacity && <span>Capacidade: {veiculo.capacity}</span>}
                                                        {veiculo.carrier_name && (
                                                            <span className="flex items-center gap-1">
                                                                <Building2 className="h-3 w-3" />
                                                                {veiculo.carrier_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => { setSelectedVehicle(veiculo); setIsModalOpen(true) }}
                                                    className="min-h-[44px] touch-manipulation"
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(veiculo.id, veiculo.plate)}
                                                    className="min-h-[44px] touch-manipulation text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Dialog de seleção de transportadora */}
            <Dialog open={isSelectCarrierOpen} onOpenChange={setIsSelectCarrierOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Selecionar Transportadora
                        </DialogTitle>
                        <DialogDescription>
                            Escolha a transportadora para vincular o novo veículo
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Transportadora *</Label>
                            <Select value={newVehicleCarrierId} onValueChange={setNewVehicleCarrierId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a transportadora" />
                                </SelectTrigger>
                                <SelectContent>
                                    {transportadoras.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSelectCarrierOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCarrierSelected} disabled={!newVehicleCarrierId}>
                            Continuar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal */}
            <VehicleModal
                veiculo={selectedVehicle as any}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={() => { setIsModalOpen(false); loadVehicles() }}
                carriers={transportadoras}
            />
        </AppShell>
    )
}
