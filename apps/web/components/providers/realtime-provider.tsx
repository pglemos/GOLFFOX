"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useOperatorTenant } from "@/components/providers/empresa-tenant-provider"
import { showCriticalAlert } from "@/components/alerts/alert-toast"
import { notifySuccess } from "@/lib/toast"

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const { tenantCompanyId } = useOperatorTenant()
    const queryClient = useQueryClient()
    const channelRef = useRef<any>(null)

    useEffect(() => {
        if (!tenantCompanyId) return

        console.log(`🔌 [Realtime] Conectando ao canal da empresa: ${tenantCompanyId}`)

        // Cleanup previous channel if exists
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
        }

        const channel = supabase
            .channel(`company-alerts-${tenantCompanyId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'gf_alerts',
                    filter: `company_id=eq.${tenantCompanyId}`,
                },
                (payload) => {
                    console.log('🔔 [Realtime] Novo alerta recebido:', payload)

                    // Invalidate queries to refresh UI
                    queryClient.invalidateQueries({ queryKey: ["alerts"] })
                    queryClient.invalidateQueries({ queryKey: ["control-tower"] })
                    queryClient.invalidateQueries({ queryKey: ["empresa-kpis"] })

                    const newAlert = payload.new as any

                    // Show toast for critical/warning alerts
                    if (newAlert.severity === 'critical' || newAlert.severity === 'error') {
                        showCriticalAlert(
                            `Alerta: ${newAlert.alert_type?.replace(/_/g, ' ') || 'Crítico'}`,
                            newAlert.message || "Atenção necessária imediatamente."
                        )
                        // Optional: Play sound
                        // const audio = new Audio('/alert-sound.mp3')
                        // audio.play().catch(e => console.log('Audio autoplay blocked'))
                    } else if (newAlert.severity === 'warning') {
                        notifySuccess(`Novo alerta: ${newAlert.message}`)
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [Realtime] Inscrito com sucesso!')
                }
            })

        channelRef.current = channel

        return () => {
            console.log('🔌 [Realtime] Desconectando...')
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
            }
        }
    }, [tenantCompanyId, queryClient])

    return <>{children}</>
}
