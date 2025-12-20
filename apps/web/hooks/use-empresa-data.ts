"use client"

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

// Hook para KPIs da Empresa (antigo useOperatorKPIs)
export function useOperatorKPIs(companyId: string | null) {
  return useQuery({
    queryKey: ["empresa-kpis", companyId],
    queryFn: async () => {
      if (!companyId) return null

      // Usar view segura diretamente (materialized views não suportam RLS)
      // A view segura já tem RLS configurado e funciona corretamente
      const { data, error: kpiError } = await supabase
        .from("v_operador_dashboard_kpis_secure")
        .select("*")
        .eq("company_id", companyId)
        .single()

      if (kpiError) throw kpiError

      return {
        trips_today: Number((data as any)?.trips_today || 0),
        trips_in_progress: Number((data as any)?.trips_in_progress || 0),
        trips_completed: Number((data as any)?.trips_completed || 0),
        delays_over_5min: Number((data as any)?.delays_over_5min || 0),
        avg_occupancy: Number((data as any)?.avg_occupancy || 0),
        daily_cost: Number((data as any)?.daily_cost || 0),
        sla_d0: Number((data as any)?.sla_d0 || 0),
      }
    },
    enabled: !!companyId,
    staleTime: 30 * 1000, // 30 segundos
  })
}

// Alias PT-BR
export const useEmpresaKPIs = useOperatorKPIs

// Hook para Torre de Controle
export function useControlTower(companyId: string | null) {
  return useQuery({
    queryKey: ["control-tower", companyId],
    queryFn: async () => {
      if (!companyId) return null

      const [delaysRes, stoppedRes, deviationsRes, assistanceRes] = await Promise.all([
        supabase
          .from("v_operador_alerts_secure")
          .select("id", { count: "exact", head: true })
          .eq("type", "route_delayed")
          .eq("severity", "critical")
          .eq("company_id", companyId),
        supabase
          .from("v_operador_alerts_secure")
          .select("id", { count: "exact", head: true })
          .eq("type", "bus_stopped")
          .eq("is_resolved", false)
          .eq("company_id", companyId),
        supabase
          .from("v_operador_alerts_secure")
          .select("id", { count: "exact", head: true })
          .eq("type", "deviation")
          .eq("is_resolved", false)
          .eq("company_id", companyId),
        supabase
          .from("gf_service_requests")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", companyId)
          .eq("tipo", "socorro")
          .in("status", ["rascunho", "enviado", "em_analise"]),
      ])

      return {
        delays: delaysRes.count || 0,
        stoppedVehicles: stoppedRes.count || 0,
        routeDeviations: deviationsRes.count || 0,
        openAssistance: assistanceRes.count || 0,
      }
    },
    enabled: !!companyId,
    staleTime: 30 * 1000, // 30 segundos
  })
}

// Hook para funcionários com paginação
export function useEmployees(
  companyId: string | null,
  page: number = 1,
  pageSize: number = 50,
  searchQuery: string = ""
) {
  return useQuery({
    queryKey: ["employees", companyId, page, pageSize, searchQuery],
    queryFn: async () => {
      console.log('🔍 [useEmployees] Buscando funcionários via API:', { companyId, page, pageSize, searchQuery })
      if (!companyId) {
        console.log('🔍 [useEmployees] Sem companyId, retornando vazio')
        return { data: [], count: 0 }
      }

      // Usar API route para contornar problemas de RLS
      const params = new URLSearchParams({
        company_id: companyId,
        page: page.toString(),
        pageSize: pageSize.toString()
      })
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/operador/employees?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('❌ [useEmployees] Erro na API:', errorData)
        throw new Error(errorData.error || 'Erro ao buscar funcionários')
      }

      const result = await response.json()

      console.log('🔍 [useEmployees] Resultado da API:', {
        dataLength: result.data?.length,
        count: result.count,
        companyId,
        firstItem: result.data?.[0]
      })

      return {
        data: result.data || [],
        count: result.count || 0,
        totalPages: result.totalPages || 0,
      }
    },
    enabled: !!companyId,
  })
}

// Hook para rotas
export function useRoutes(companyId: string | null) {
  return useQuery({
    queryKey: ["routes", companyId],
    queryFn: async () => {
      if (!companyId) return []

      const { data, error } = await supabase
        .from("v_operador_routes_secure")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!companyId,
  })
}

// Hook para alertas com paginação infinita
export function useAlerts(
  companyId: string | null,
  page: number = 1,
  pageSize: number = 50,
  filters?: {
    type?: string
    severity?: string
    resolved?: boolean
  }
) {
  return useInfiniteQuery({
    queryKey: ["alerts", companyId, pageSize, filters],
    queryFn: async ({ pageParam = 1 }) => {
      if (!companyId) return { data: [], count: 0, nextPage: null }

      let query = supabase
        .from("v_operador_alerts_secure")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((pageParam - 1) * pageSize, pageParam * pageSize - 1)

      if (filters?.type) {
        query = query.eq("type", filters.type)
      }
      if (filters?.severity) {
        query = query.eq("severity", filters.severity)
      }
      if (filters?.resolved !== undefined) {
        query = query.eq("is_resolved", filters.resolved)
      }

      const { data, error, count } = await query

      if (error) throw error

      const totalPages = Math.ceil((count || 0) / pageSize)
      const hasNextPage = pageParam < totalPages

      return {
        data: data || [],
        count: count || 0,
        nextPage: hasNextPage ? pageParam + 1 : null,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: !!companyId,
  })
}

// Hook para marcar alerta como resolvido
export function useResolveAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ alertId, resolved }: { alertId: string; resolved: boolean }) => {
      const { error } = await supabase
        .from("gf_alerts")
        .update({ is_resolved: resolved, resolved_at: resolved ? new Date().toISOString() : null } as any)
        .eq("id", alertId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      queryClient.invalidateQueries({ queryKey: ["control-tower"] })
    },
  })
}

export function useActiveTrips(companyId: string | null) {
  return useQuery({
    queryKey: ["active-trips", companyId],
    queryFn: async () => {
      if (!companyId) return []

      const { data, error } = await supabase
        .from("v_active_trips")
        .select("*")
        .eq("company_id", companyId)
        // We ensure we only get truly active statuses
        .in("status", ["in_progress", "delayed"])

      if (error) throw error
      return data || []
    },
    enabled: !!companyId,
    refetchInterval: 10000, // Polling every 10 seconds for "near-realtime" status
  })
}



