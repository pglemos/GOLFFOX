/**
 * Tipos relacionados a Notificações
 */

/**
 * Notificação
 */
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  is_read: boolean
  read_at?: string
  action_url?: string
  action_label?: string
  priority: NotificationPriority
  expires_at?: string
  created_at: string
}

/**
 * Tipo de Notificação
 */
export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'alert'
  | 'system'
  | 'trip_update'
  | 'vehicle_alert'
  | 'route_deviation'
  | 'document_expiring'
  | 'cost_alert'
  | 'budget_alert'

/**
 * Prioridade de Notificação
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * Preferências de Notificação
 */
export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  in_app: boolean
  types: Record<NotificationType, boolean>
  quiet_hours?: {
    enabled: boolean
    start: string // HH:mm
    end: string // HH:mm
  }
}

/**
 * Payload para criar notificação
 */
export interface CreateNotificationPayload {
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  action_url?: string
  action_label?: string
  priority?: NotificationPriority
  expires_at?: string
}

