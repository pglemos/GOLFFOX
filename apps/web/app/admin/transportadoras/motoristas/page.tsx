"use client"

import { useEffect, useState, useMemo, useCallback } from "react"

import dynamic from "next/dynamic"

import { motion } from "framer-motion"
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, Building2 } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SkeletonList } from "@/components/ui/skeleton"
import { useAuth } from "@/components/providers/auth-provider"
import { useDebounce } from "@/hooks/use-debounce"
import { notifySuccess, notifyError } from "@/lib/toast"

// Lazy load modal
const MotoristaModal = dynamic(
    () => import("@/components/modals/motorista-modal").then(m => ({ default: m.MotoristaModal })),
    { ssr: false, loading: () => null }
)

interface motorista {
    id: string
    name: string
    email: string
    phone?: string
    cpf?: string
    role: string
    transportadora_id?: string
    transportadora_name?: string
    is_active?: boolean
}

interface Transportadora {
    id: string
    name: string
}

export default function TransportadoraMotoristasPage() {
    const { user, loading: authLoading } = useAuth()
    const [motoristas, setMotoristas] = useState<motorista[]>([])
    const [transportadoras, setTransportadoras] = useState<Transportadora[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [selectedMotorista, setSelectedMotorista] = useState<motorista | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSelectCarrierOpen, setIsSelectCarrierOpen] = useState(false)
    const [newDriverCarrierId, setNewDriverCarrierId] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState("")
    const [filterTransportadora, setFilterTransportadora] = useState<string>("all")
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    // Abre dialog de seleção de transportadora para novo motorista
    const handleNewDriver = () => {
        setNewDriverCarrierId("")
        setIsSelectCarrierOpen(true)
    }

    // Após selecionar transportadora, abre modal de cadastro
    const handleCarrierSelected = () => {
        if (!newDriverCarrierId) return
        setSelectedMotorista({
            id: "",
            name: "",
            email: "",
            role: "motorista",
            transportadora_id: newDriverCarrierId,
            transportadora_name: transportadoras.find(t => t.id === newDriverCarrierId)?.name
        })
        setIsSelectCarrierOpen(false)
        setIsModalOpen(true)
    }

    useEffect(() => {
        if (user && !authLoading) {
            loadDrivers()
            loadTransportadoras()
        }
    }, [user, authLoading])

    const loadDrivers = useCallback(async () => {
        try {
            setDataLoading(true)
            const response = await fetch('/api/admin/motoristas-list')
            if (!response.ok) throw new Error('Erro ao carregar motoristas')
            const data = await response.json()
            setMotoristas(Array.isArray(data) ? data : data.motoristas || [])
        } catch (error) {
            notifyError(error, "Erro ao carregar motoristas")
            setMotoristas([])
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

    const filteredDrivers = useMemo(() => {
        let result = motoristas

        // Filtrar por transportadora
        if (filterTransportadora !== "all") {
            result = result.filter(d => d.transportadora_id === filterTransportadora)
        }

        // Filtrar por busca
        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase()
            result = result.filter(d =>
                d.name?.toLowerCase().includes(query) ||
                d.email?.toLowerCase().includes(query) ||
                d.cpf?.includes(query) ||
                d.transportadora_name?.toLowerCase().includes(query)
            )
        }

        return result
    }, [motoristas, debouncedSearchQuery, filterTransportadora])

    const handleDelete = async (driverId: string, driverName: string) => {
        if (!confirm(`Excluir motorista "${driverName}"?`)) return

        try {
            const response = await fetch(`/api/admin/motoristas/delete?id=${driverId}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Erro ao excluir')
            notifySuccess('Motorista excluído')
            loadDrivers()
        } catch (error) {
            notifyError(error, "Erro ao excluir motorista")
        }
    }

    if (authLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin" /></div>
    }

    return (
        <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden pb-12 sm:pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Motoristas</h1>
                        <p className="text-sm sm:text-base text-text-muted-foreground">Todos os motoristas de todas as transportadoras</p>
                    </div>
                    <Button
                        onClick={handleNewDriver}
                        className="w-full sm:w-auto flex-shrink-0"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Cadastrar Motorista</span>
                        <span className="sm:hidden">Cadastrar</span>
                    </Button>
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light h-4 w-4" />
                        <Input
                            placeholder="Buscar motoristas..."
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
                {dataLoading && motoristas.length === 0 ? (
                    <SkeletonList count={5} />
                ) : (
                    <div className="grid gap-3 sm:gap-4 w-full">
                        {filteredDrivers.length === 0 ? (
                            <Card variant="premium" className="p-3 text-center">
                                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">Nenhum motorista encontrado</p>
                            </Card>
                        ) : (
                            filteredDrivers.map((motorista) => (
                                <motion.div
                                    key={motorista.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <Card variant="premium" className="p-3 sm:p-4 group">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <div className="p-1 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                                                        <Users className="h-4 w-4 text-brand" />
                                                    </div>
                                                    <h3 className="font-bold text-base sm:text-lg group-hover:text-brand transition-colors">{motorista.name}</h3>
                                                    <Badge variant={motorista.is_active !== false ? "default" : "secondary"}>
                                                        {motorista.is_active !== false ? "Ativo" : "Inativo"}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-1 text-sm text-ink-muted">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-3 w-3" />
                                                        <span>{motorista.email}</span>
                                                    </div>
                                                    {motorista.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{motorista.phone}</span>
                                                        </div>
                                                    )}
                                                    {motorista.transportadora_name && (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-3 w-3" />
                                                            <span>{motorista.transportadora_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => { setSelectedMotorista(motorista); setIsModalOpen(true) }}
                                                    className="min-h-[44px] touch-manipulation"
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(motorista.id, motorista.name)}
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
                            Escolha a transportadora para vincular o novo motorista
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Transportadora *</Label>
                            <Select value={newDriverCarrierId} onValueChange={setNewDriverCarrierId}>
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
                        <Button onClick={handleCarrierSelected} disabled={!newDriverCarrierId}>
                            Continuar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de motorista */}
            <MotoristaModal
                motorista={selectedMotorista}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={() => { setIsModalOpen(false); loadDrivers() }}
                carriers={transportadoras}
            />
        </AppShell>
    )
}
