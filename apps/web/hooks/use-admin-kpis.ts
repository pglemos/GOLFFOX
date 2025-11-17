import { useQuery } from "@tanstack/react-query"

interface KpiData {
  company_id: string
  company_name: string
  trips_today: number
  vehicles_active: number
  employees_in_transit: number
  critical_alerts: number
  routes_today: number
  trips_completed?: number
  trips_in_progress?: number
}

export function useAdminKpis(companyFilter?: string) {
  return useQuery<KpiData[]>({
    queryKey: ['admin-kpis', companyFilter],
    queryFn: async () => {
      const response = await fetch('/api/admin/kpis')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (result.success && result.kpis) {
        return result.kpis
      }
      return []
    },
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 60 * 1000, // Refetch a cada minuto
  })
}

