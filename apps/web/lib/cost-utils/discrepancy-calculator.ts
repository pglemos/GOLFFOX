/**
 * Utilitário para cálculo de discrepâncias em faturas
 */

export interface DiscrepancyResult {
  percentage: number
  isSignificant: boolean
}

export interface DiscrepancyStatus {
  hasSignificantDiscrepancy: boolean
  kmDiscrepancy: DiscrepancyResult
  timeDiscrepancy: DiscrepancyResult
  tripsDiscrepancy: DiscrepancyResult
}

/**
 * Calcula a discrepância entre um valor medido e um valor faturado
 * @param measured Valor medido
 * @param invoiced Valor faturado
 * @returns Resultado com porcentagem e se é significativa (>5% ou >R$100)
 */
export function calculateDiscrepancy(
  measured: number | null,
  invoiced: number | null
): DiscrepancyResult {
  if (!measured || !invoiced || invoiced === 0) {
    return { percentage: 0, isSignificant: false }
  }

  const diff = Math.abs(measured - invoiced)
  const percentage = (diff / invoiced) * 100

  // Significante se >5% ou >R$100
  const isSignificant = percentage > 5 || diff > 100

  return { percentage, isSignificant }
}

export interface InvoiceLine {
  measured_km: number | null
  invoiced_km: number | null
  measured_time: number | null
  invoiced_time: number | null
  measured_trips: number | null
  invoiced_trips: number | null
}

/**
 * Calcula o status de discrepância completo para uma linha de fatura
 * @param line Linha da fatura
 * @returns Status completo com todas as discrepâncias
 */
export function getDiscrepancyStatus(line: InvoiceLine): DiscrepancyStatus {
  const kmDiscrepancy = calculateDiscrepancy(line.measured_km, line.invoiced_km)
  const timeDiscrepancy = calculateDiscrepancy(line.measured_time, line.invoiced_time)
  const tripsDiscrepancy = calculateDiscrepancy(line.measured_trips, line.invoiced_trips)

  const hasSignificantDiscrepancy =
    kmDiscrepancy.isSignificant ||
    timeDiscrepancy.isSignificant ||
    tripsDiscrepancy.isSignificant

  return {
    hasSignificantDiscrepancy,
    kmDiscrepancy,
    timeDiscrepancy,
    tripsDiscrepancy,
  }
}
