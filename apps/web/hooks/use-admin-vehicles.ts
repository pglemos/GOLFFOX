import { useQuery } from "@tanstack/react-query"

export function useAdminVehicles() {
  return useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: async () => {
      const response = await fetch('/api/admin/vehicles-list', { 
        headers: { 'x-test-mode': 'true' } 
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (Array.isArray(result)) {
        return result
      } else if (result && typeof result === 'object') {
        if (result.success && Array.isArray(result.vehicles)) {
          return result.vehicles
        } else if (Array.isArray(result.data)) {
          return result.data
        }
      }
      return []
    },
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

