import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { useTransportadoraTenant } from "@/components/providers/transportadora-tenant-provider"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"

export function useTransportadoraAlerts() {
    const { transportadoraId } = useTransportadoraTenant()

    return useQuery({
        queryKey: ["transportadora-alerts", transportadoraId],
        queryFn: async () => {
            if (!transportadoraId) return []

            const { data, error } = await supabase
                .from("gf_alerts")
                .select("*")
                .eq("transportadora_id", transportadoraId)
                .order("created_at", { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!transportadoraId
    })
}

export function useResolveTransportadoraAlert() {
    const queryClient = useQueryClient()
    const { transportadoraId } = useTransportadoraTenant()

    return useMutation({
        mutationFn: async (alertId: string) => {
            const { error } = await supabase
                .from("gf_alerts")
                .update({
                    is_resolved: true,
                    resolved_at: new Date().toISOString()
                    // resolved_by: user_id (pego trigger ou RLS)
                })
                .eq("id", alertId)
                .eq("transportadora_id", transportadoraId || '') // Segurança extra

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transportadora-alerts"] })
            notifySuccess("Alerta resolvido")
        },
        onError: (error) => {
            notifyError("Erro ao resolver alerta")
            console.error(error)
        }
    })
}
