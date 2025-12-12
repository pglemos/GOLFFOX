/**
 * Formatting utilities for currency, dates, and numbers
 */

/**
 * Formats a number as Brazilian currency (BRL)
 */
export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value)
}

/**
 * Formats a date to Brazilian format (DD/MM/YYYY)
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
}

/**
 * Formats a date with time to Brazilian format
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return '-'
    return new Date(date).toLocaleString('pt-BR')
}

/**
 * Formats a number with thousand separators
 */
export function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0'
    return new Intl.NumberFormat('pt-BR').format(value)
}

/**
 * Formats a percentage value
 */
export function formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0%'
    return `${value.toFixed(1)}%`
}
