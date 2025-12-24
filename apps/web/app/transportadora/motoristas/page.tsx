"use client"

import { useEffect, useState, useMemo, useCallback } from "react"

import dynamic from "next/dynamic"
import Link from "next/link"

import { motion } from "framer-motion"
import { Users, Plus, Search, Edit, Trash2, Phone, Mail } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/components/providers/auth-provider"
import { DriverCard } from "@/components/transportadora/driver-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SkeletonList } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
import { DriverService, type Driver } from "@/lib/services/driver-service"
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
    is_active?: boolean
}

export default function TransportadoraMotoristasListPage() {
    const { user } = useAuth()
    const [motoristas, setMotoristas] = useState<Driver[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [selectedMotorista, setSelectedMotorista] = useState<Driver | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    const loadDrivers = useCallback(async () => {
        try {
            setDataLoading(true)
            const data = await DriverService.listDrivers()
            setMotoristas(data)
        } catch (error) {
            notifyError(error, "Erro ao carregar motoristas")
            setMotoristas([])
        } finally {
            setDataLoading(false)
        }
    }, [])

    useEffect(() => {
        if (user) {
            loadDrivers()
        }
    }, [user, loadDrivers])

    const filteredDrivers = useMemo(() => {
        if (!debouncedSearchQuery) return motoristas

        const query = debouncedSearchQuery.toLowerCase()
        return motoristas.filter(d =>
            d.name?.toLowerCase().includes(query) ||
            d.email?.toLowerCase().includes(query) ||
            d.cpf?.includes(query)
        )
    }, [motoristas, debouncedSearchQuery])

    const handleDelete = async (driverId: string, driverName: string) => {
        if (!confirm(`Excluir motorista "${driverName}"?`)) return

        try {
            const success = await DriverService.deleteDriver(driverId)
            if (success) {
                notifySuccess('Motorista excluído')
                loadDrivers()
            }
        } catch (error) {
            notifyError(error, "Erro ao excluir motorista")
        }
    }

    const handleNewDriver = () => {
        setSelectedMotorista({
            id: "",
            name: "",
            email: "",
            role: "motorista",
            transportadora_id: user?.companyId || ""
        } as Driver)
        setIsModalOpen(true)
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin" /></div>
    }

    return (
        <AppShell panel="gestor_transportadora" user={{ id: user.id, name: user.name || 'Gestor da Transportadora', email: user.email || '', role: user.role || 'gestor_transportadora', avatar_url: user.avatar_url || undefined }}>
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Motoristas</h1>
                        <p className="text-sm sm:text-base text-text-muted-foreground">Gerenciamento de motoristas da transportadora</p>
                    </div>
                    <Button
                        onClick={handleNewDriver}
                        className="w-full sm:w-auto flex-shrink-0 min-h-[44px] touch-manipulation"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Cadastrar Motorista</span>
                        <span className="sm:hidden">Cadastrar</span>
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <Button variant="default" className="bg-brand hover:bg-brand-hover cursor-default">
                        Lista de Motoristas
                    </Button>
                    <Link href="/transportadora/motoristas/ranking">
                        <Button variant="outline">
                            Ranking de Desempenho
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light h-4 w-4" />
                        <Input
                            placeholder="Buscar motoristas por nome, email ou CPF..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Grid */}
                {dataLoading && motoristas.length === 0 ? (
                    <SkeletonList count={5} />
                ) : (
                    <div className="grid gap-3 sm:gap-4 w-full">
                        {filteredDrivers.length === 0 ? (
                            <Card variant="premium" className="p-8 text-center">
                                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">Nenhum motorista encontrado</p>
                            </Card>
                        ) : (
                            filteredDrivers.map((motorista) => (
                                <DriverCard
                                    key={motorista.id}
                                    driver={motorista}
                                    onEdit={(d) => { setSelectedMotorista(d); setIsModalOpen(true) }}
                                    onDelete={handleDelete}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modal de motorista */}
            <MotoristaModal
                motorista={selectedMotorista}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={() => { setIsModalOpen(false); loadDrivers() }}
            />
        </AppShell>
    )
}
