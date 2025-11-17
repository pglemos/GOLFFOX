"use client"

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

// Hook para KPIs do operador
export function useOperatorKPIs(companyId: string | null) {
  return useQuery({
    queryKey: ["operator-kpis", companyId],
    queryFn: async () => {
      if (!companyId) return null

      // Tentar usar materialized view primeiro, fallback para view segura
      let { data, error: kpiError } = await supabase
        .from("mv_operator_kpis")
        .select("*")
        .eq("company_id", companyId)
        .single()

      // Se materialized view falhar, usar view segura
      if (kpiError) {
        const result = await supabase
          .from("v_operator_dashboard_kpis_secure")
          .select("*")
          .eq("company_id", companyId)
          .single()
        data = result.data
        kpiError = result.error
      }

      if (kpiError) throw kpiError

      return {
        trips_today: Number(data?.trips_today || 0),
        trips_in_progress: Number(data?.trips_in_progress || 0),
        trips_completed: Number(data?.trips_completed || 0),
        delays_over_5min: Number(data?.delays_over_5min || 0),
        avg_occupancy: Number(data?.avg_occupancy || 0),
        daily_cost: Number(data?.daily_cost || 0),
        sla_d0: Number(data?.sla_d0 || 0),
      }
    },
    enabled: !!companyId,
    staleTime: 30 * 1000, // 30 segundos
  })
}

// Hook para Torre de Controle
export function useControlTower(companyId: string | null) {
  return useQuery({
    queryKey: ["control-tower", companyId],
    queryFn: async () => {
      if (!companyId) return null

      const [delaysRes, stoppedRes, deviationsRes, assistanceRes] = await Promise.all([
        supabase
          .from("gf_alerts")
          .select("id", { count: "exact", head: true })
          .eq("alert_type", "route_delayed")
          .eq("severity", "critical")
          .eq("company_id", companyId),
        supabase
          .from("gf_alerts")
          .select("id", { count: "exact", head: true })
          .eq("alert_type", "bus_stopped")
          .eq("is_resolved", false)
          .eq("company_id", companyId),
        supabase
          .from("gf_alerts")
          .select("id", { count: "exact", head: true })
          .eq("alert_type", "deviation")
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
      if (!companyId) return { data: [], count: 0 }

      let query = supabase
        .from("gf_employee_company")
        .select("id, company_id, name, cpf, email, phone, is_active, address", { count: "exact" })
        .eq("company_id", companyId)
        .order("name", { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (searchQuery) {
        query = query.or(
          `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,cpf.ilike.%${searchQuery}%`
        )
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
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
        .from("v_operator_routes_secure")
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
        .from("v_operator_alerts_secure")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((pageParam - 1) * pageSize, pageParam * pageSize - 1)

      if (filters?.type) {
        query = query.eq("alert_type", filters.type)
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
        .update({ is_resolved: resolved, resolved_at: resolved ? new Date().toISOString() : null })
        .eq("id", alertId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      queryClient.invalidateQueries({ queryKey: ["control-tower"] })
    },
  })
}

