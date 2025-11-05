/**
 * Utilitários para formatação e cálculo de KPIs
 * Separado de kpi-card.tsx para reutilização
 */

/**
 * Formata número como valor monetário (R$)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00'
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formata número como porcentagem
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%'
  }
  return `${value.toFixed(decimals)}%`
}

/**
 * Formata número como contador (com separador de milhares)
 */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }
  return new Intl.NumberFormat('pt-BR').format(value)
}

/**
 * Formata número genérico (com separador de milhares)
 */
export function formatNumber(value: number | null | undefined): string {
  return formatCount(value)
}

/**
 * Formata número como distância (km)
 */
export function formatDistance(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0 km'
  }
  return `${value.toFixed(decimals)} km`
}

/**
 * Formata número como tempo (minutos ou horas)
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    return '0 min'
  }
  
  if (minutes < 60) {
    return `${Math.round(minutes)} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}min`
}

/**
 * Formata número como tempo restante (HH:MM)
 */
export function formatTimeRemaining(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    return '00:00'
  }
  
  const hours = Math.floor(Math.max(0, minutes) / 60)
  const mins = Math.floor(Math.max(0, minutes) % 60)
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Calcula variação percentual entre dois valores
 */
export function calculateTrend(current: number, previous: number): number | null {
  if (previous === 0 || previous === null || previous === undefined) {
    return null
  }
  if (current === null || current === undefined || isNaN(current) || isNaN(previous)) {
    return null
  }
  return ((current - previous) / previous) * 100
}

/**
 * Formata trend como string com seta
 */
export function formatTrend(trend: number | null | undefined): string {
  if (trend === null || trend === undefined || isNaN(trend)) {
    return ''
  }
  const sign = trend >= 0 ? '+' : ''
  return `${sign}${trend.toFixed(1)}%`
}

/**
 * Formata valor de KPI com unidade apropriada
 */
export function formatKpiValue(value: number | null | undefined, unit: 'count' | 'currency' | 'percentage' | 'distance' | 'duration' = 'count'): string {
  switch (unit) {
    case 'currency':
      return formatCurrency(value)
    case 'percentage':
      return formatPercentage(value ?? 0)
    case 'distance':
      return formatDistance(value)
    case 'duration':
      return formatDuration(value)
    default:
      return formatCount(value)
  }
}

/**
 * Calcula porcentagem de conclusão (progresso)
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0 || total === null || total === undefined) {
    return 0
  }
  if (current === null || current === undefined || isNaN(current) || isNaN(total)) {
    return 0
  }
  return Math.min(100, Math.max(0, (current / total) * 100))
}

/**
 * Formata data relativa (há X minutos/horas/dias)
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'Agora'
  
  const now = new Date()
  const then = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `Há ${diffMins} min`
  if (diffHours < 24) return `Há ${diffHours}h`
  if (diffDays < 7) return `Há ${diffDays} dias`
  
  return then.toLocaleDateString('pt-BR')
}

/**
 * Valida se valor é válido (não null, não undefined, não NaN)
 */
export function isValidValue(value: any): value is number {
  return value !== null && value !== undefined && !isNaN(value) && typeof value === 'number'
}

