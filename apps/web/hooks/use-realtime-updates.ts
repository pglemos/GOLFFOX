"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { RealtimeChannel } from "@supabase/supabase-js"

export function useRealtimeKPIs(companyId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`operador-kpis:${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mv_operador_kpis",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          // Invalidar cache quando houver mudanças
          queryClient.invalidateQueries({ queryKey: ["operador-kpis", companyId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, queryClient])
}

export function useRealtimeAlerts(companyId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`operador-alerts:${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gf_alerts",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["alerts", companyId] })
          queryClient.invalidateQueries({ queryKey: ["control-tower", companyId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, queryClient])
}

export function useRealtimeRoutes(companyId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`operador-routes:${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "routes",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["routes", companyId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, queryClient])
}

