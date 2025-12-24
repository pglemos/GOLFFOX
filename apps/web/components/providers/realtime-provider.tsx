"use client"

import { useEffect, useRef } from "react"

import { useQueryClient } from "@tanstack/react-query"

import { showCriticalAlert } from "@/components/alerts/alert-toast"
import { useOperatorTenant } from "@/components/providers/empresa-tenant-provider"
import { supabase } from "@/lib/supabase"
import { notifySuccess } from "@/lib/toast"
import { debug } from "@/lib/logger"

export interface RealtimeProviderProps {
    children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
    const { tenantCompanyId } = useOperatorTenant()
    const queryClient = useQueryClient()
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    useEffect(() => {
        if (!tenantCompanyId) return

        debug(`[Realtime] Conectando ao canal da empresa`, { tenantCompanyId }, 'RealtimeProvider')

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
                    debug('[Realtime] Novo alerta recebido', { payload }, 'RealtimeProvider')

                    // Invalidate queries to refresh UI
                    queryClient.invalidateQueries({ queryKey: ["alerts"] })
                    queryClient.invalidateQueries({ queryKey: ["control-tower"] })
                    queryClient.invalidateQueries({ queryKey: ["empresa-kpis"] })

                    const newAlert = payload.new as { severity?: string; alert_type?: string; message?: string }

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
                    debug('[Realtime] Inscrito com sucesso', {}, 'RealtimeProvider')
                }
            })

        channelRef.current = channel

        return () => {
            debug('[Realtime] Desconectando', {}, 'RealtimeProvider')
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
            }
        }
    }, [tenantCompanyId, queryClient])

    return <>{children}</>
}
