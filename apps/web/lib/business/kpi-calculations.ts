/**
 * Lógica de negócio para cálculos de KPIs
 * Extrai cálculos de KPIs dos componentes para facilitar testes e reutilização
 */

export interface KpiData {
  company_id: string
  company_name: string
  trips_today: number
  vehicles_active: number
  employees_in_transit: number
  critical_alerts: number
  routes_today: number
  trips_completed: number
  trips_in_progress: number
}

export interface KpiFilters {
  empresa?: string
}

export interface AggregatedKPIs {
  trips_today: number
  vehicles_active: number
  employees_in_transit: number
  critical_alerts: number
  routes_today: number
  trips_completed: number
  trips_in_progress: number
  routeEfficiency: number
  systemHealth: number
}

/**
 * Calcular KPIs agregados a partir de uma lista de KPIs
 */
export function calculateAggregatedKPIs(
  kpisData: KpiData[],
  filters: KpiFilters = {}
): AggregatedKPIs {
  const base = kpisData.reduce(
    (acc, kpi) => {
      // Aplicar filtro de empresa se fornecido
      if (filters.empresa && kpi.company_id !== filters.empresa) {
        return acc
      }

      return {
        trips_today: acc.trips_today + (kpi.trips_today || 0),
        vehicles_active: acc.vehicles_active + (kpi.vehicles_active || 0),
        employees_in_transit:
          acc.employees_in_transit + (kpi.employees_in_transit || 0),
        critical_alerts: acc.critical_alerts + (kpi.critical_alerts || 0),
        routes_today: acc.routes_today + (kpi.routes_today || 0),
        trips_completed: acc.trips_completed + (kpi.trips_completed || 0),
        trips_in_progress: acc.trips_in_progress + (kpi.trips_in_progress || 0),
      }
    },
    {
      trips_today: 0,
      vehicles_active: 0,
      employees_in_transit: 0,
      critical_alerts: 0,
      routes_today: 0,
      trips_completed: 0,
      trips_in_progress: 0,
    }
  )

  const routeEfficiency =
    base.routes_today > 0
      ? Math.round((base.trips_completed / base.routes_today) * 100)
      : 0

  const systemHealth =
    base.critical_alerts === 0
      ? 100
      : Math.max(0, 100 - base.critical_alerts * 10)

  return {
    ...base,
    routeEfficiency,
    systemHealth,
  }
}

/**
 * Calcular eficiência de rotas
 */
export function calculateRouteEfficiency(
  tripsCompleted: number,
  routesTotal: number
): number {
  if (routesTotal === 0) return 0
  return Math.round((tripsCompleted / routesTotal) * 100)
}

/**
 * Calcular saúde do sistema baseado em alertas críticos
 */
export function calculateSystemHealth(criticalAlerts: number): number {
  if (criticalAlerts === 0) return 100
  return Math.max(0, 100 - criticalAlerts * 10)
}

