/**
 * Utilitários para formatação de KPIs
 */

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num)
}

export function formatCount(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0'
  const num = typeof value === 'string' ? parseInt(value) : value
  if (isNaN(num)) return '0'
  return new Intl.NumberFormat('pt-BR').format(num)
}

export function formatPercentage(value: number | string | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) return '0%'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0%'
  return `${num.toFixed(decimals)}%`
}

export function formatDistance(value: number | null | undefined, unit: string = 'km'): string {
  if (value === null || value === undefined) return `0 ${unit}`
  if (isNaN(value)) return `0 ${unit}`
  return `${value.toFixed(2)} ${unit}`
}

export function formatDuration(value: number | null | undefined, unit: 'minutes' | 'hours' = 'hours'): string {
  if (value === null || value === undefined) return `0 ${unit === 'hours' ? 'h' : 'min'}`
  if (isNaN(value)) return `0 ${unit === 'hours' ? 'h' : 'min'}`
  
  if (unit === 'minutes') {
    const hours = Math.floor(value / 60)
    const minutes = value % 60
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  } else {
    return `${value.toFixed(1)}h`
  }
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-'
  const date = typeof value === 'string' ? new Date(value) : value
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-'
  const date = typeof value === 'string' ? new Date(value) : value
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Formata um tempo relativo curto em pt-BR (ex.: "há 5 min", "há 2 h", "há 3 d")
export function formatRelativeTime(value: string | Date | number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value
  if (!date || isNaN(date.getTime())) return '-'

  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  if (diffHour < 24) return `há ${diffHour} h`
  return `há ${diffDay} d`
}
