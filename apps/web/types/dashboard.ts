/**
 * Tipos relacionados a Dashboards
 */

/**
 * Item de Atividade (Timeline)
 */
export interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description?: string
  user_id?: string
  user_name?: string
  entity_type?: string
  entity_id?: string
  entity_name?: string
  metadata?: Record<string, unknown>
  created_at: string
}

/**
 * Tipo de Atividade
 */
export type ActivityType =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'trip_start'
  | 'trip_end'
  | 'alert_triggered'
  | 'alert_resolved'
  | 'document_uploaded'
  | 'cost_added'
  | 'report_generated'

/**
 * Ação Rápida
 */
export interface QuickAction {
  id: string
  label: string
  icon: string
  href?: string
  onClick?: () => void
  disabled?: boolean
  badge?: string | number
  color?: string
}

/**
 * Log de Auditoria
 */
export interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  user_id: string
  user_name?: string
  user_email?: string
  changes?: Record<string, { from: unknown; to: unknown }>
  ip_address?: string
  user_agent?: string
  created_at: string
}

/**
 * Item da Control Tower
 */
export interface ControlTowerItem {
  id: string
  type: 'vehicle' | 'route' | 'trip' | 'alert'
  status: string
  title: string
  subtitle?: string
  lat?: number
  lng?: number
  priority?: number
  data?: Record<string, unknown>
}

/**
 * KPIs do Dashboard Admin
 */
export interface AdminDashboardKPIs {
  totalVehicles: number
  activeVehicles: number
  totalDrivers: number
  activeDrivers: number
  totalRoutes: number
  activeTrips: number
  openAlerts: number
  criticalAlerts: number
  todayTrips: number
  completedTrips: number
  onTimePercentage: number
  averageDelay: number
}

/**
 * KPIs do Dashboard Operador
 */
export interface OperatorDashboardKPIs {
  assignedRoutes: number
  todayTrips: number
  activeTrips: number
  completedTrips: number
  pendingTrips: number
  delayedTrips: number
  openAlerts: number
  averageOccupancy: number
}

/**
 * Widget de Dashboard
 */
export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  size: 'small' | 'medium' | 'large' | 'full'
  position: { x: number; y: number }
  config?: Record<string, unknown>
  refreshInterval?: number
}

/**
 * Tipo de Widget
 */
export type WidgetType =
  | 'kpi_card'
  | 'chart_line'
  | 'chart_bar'
  | 'chart_pie'
  | 'chart_area'
  | 'map'
  | 'table'
  | 'timeline'
  | 'alerts'
  | 'quick_actions'

