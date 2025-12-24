import { useState, useEffect } from "react"

import { logError } from "@/lib/logger"
import { FleetService } from "@/lib/services/fleet-service"
import { supabase } from "@/lib/supabase"
import { ensureSupabaseSession } from "@/lib/supabase-session"

export function useFleetManagement(userId: string) {
    const [loading, setLoading] = useState(true)
    const [veiculos, setVeiculos] = useState<any[]>([])
    const [vehiclesWithDetails, setVehiclesWithDetails] = useState<any[]>([])
    const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null)
    const [documents, setDocuments] = useState<any[]>([])
    const [maintenances, setMaintenances] = useState<any[]>([])

    const loadVeiculos = async () => {
        try {
            const { data: userData } = await supabase
                .from('users')
                .select('transportadora_id')
                .eq('id', userId)
                .single()

            if (userData?.transportadora_id) {
                const data = await FleetService.getVehicles(userData.transportadora_id)
                setVeiculos(data || [])
            }
        } catch (error) {
            logError("Erro ao carregar veículos", { error }, 'UseFleetManagement')
        }
    }

    const loadVehicleDocuments = async (vehicleId: string) => {
        try {
            const session = await ensureSupabaseSession()
            const res = await fetch(`/api/transportadora/veiculos/${vehicleId}/documents`, {
                credentials: 'include',
                headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
            })
            if (res.ok) {
                const data = await res.json()
                setDocuments(data || [])
            }
        } catch (error) {
            logError("Erro ao carregar documentos", { error }, 'UseFleetManagement')
        }
    }

    const loadVehicleMaintenances = async (vehicleId: string) => {
        try {
            const session = await ensureSupabaseSession()
            const res = await fetch(`/api/transportadora/veiculos/${vehicleId}/maintenances`, {
                credentials: 'include',
                headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
            })
            if (res.ok) {
                const data = await res.json()
                setMaintenances(data || [])
            }
        } catch (error) {
            logError("Erro ao carregar manutenções", { error }, 'UseFleetManagement')
        }
    }

    // Efeito para carregar detalhes adicionais (Pilar 9 - Performance via Memoização de dados se necessário)
    useEffect(() => {
        const fetchDetails = async () => {
            if (veiculos.length === 0) return

            const details = await Promise.all(
                veiculos.map(async (v) => {
                    // Lógica simplificada aqui para o hook
                    return { ...v, hasExpiringDocs: false, expiringDocsCount: 0 }
                })
            )
            setVehiclesWithDetails(details)
        }
        fetchDetails()
    }, [veiculos])

    return {
        veiculos,
        vehiclesWithDetails,
        selectedVeiculo,
        setSelectedVeiculo,
        documents,
        maintenances,
        loading,
        setLoading,
        loadVeiculos,
        loadVehicleDocuments,
        loadVehicleMaintenances
    }
}
