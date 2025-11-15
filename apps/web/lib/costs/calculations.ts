/**
 * Funções de cálculo para custos
 */

export interface CostMetrics {
  totalCost: number
  totalKm: number
  totalTrips: number
  totalPassengers: number
}

/**
 * Calcular custo por KM
 */
export function calculateCostPerKm(metrics: CostMetrics): number {
  if (metrics.totalKm <= 0) {
    return 0
  }
  return metrics.totalCost / metrics.totalKm
}

/**
 * Calcular custo por viagem
 */
export function calculateCostPerTrip(metrics: CostMetrics): number {
  if (metrics.totalTrips <= 0) {
    return 0
  }
  return metrics.totalCost / metrics.totalTrips
}

/**
 * Calcular custo por passageiro
 */
export function calculateCostPerPassenger(metrics: CostMetrics): number {
  if (metrics.totalPassengers <= 0) {
    return 0
  }
  return metrics.totalCost / metrics.totalPassengers
}

/**
 * Calcular variação vs orçamento
 */
export function calculateBudgetVariance(
  actual: number,
  budget: number
): { varianceAbsolute: number; variancePercent: number } {
  const varianceAbsolute = actual - budget
  const variancePercent = budget > 0 ? (varianceAbsolute / budget) * 100 : 0

  return {
    varianceAbsolute,
    variancePercent
  }
}

/**
 * Detectar outliers usando método 3-sigma
 */
export function detectOutliers3Sigma(values: number[]): number[] {
  if (values.length === 0) return []

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  const threshold = 3 * stdDev
  return values.filter(val => Math.abs(val - mean) > threshold)
}

/**
 * Detectar outliers usando percentil (95%)
 */
export function detectOutliersPercentile(values: number[], percentile: number = 95): number[] {
  if (values.length === 0) return []

  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  const threshold = sorted[index]

  return values.filter(val => val > threshold)
}

/**
 * Calcular manutenção por KM
 */
export function calculateMaintenancePerKm(
  maintenanceCost: number,
  totalKm: number
): number {
  if (totalKm <= 0) {
    return 0
  }
  return maintenanceCost / totalKm
}

/**
 * Calcular eficiência de combustível (km por litro)
 */
export function calculateFuelEfficiency(
  totalKm: number,
  totalLiters: number
): number {
  if (totalLiters <= 0) {
    return 0
  }
  return totalKm / totalLiters
}

/**
 * Calcular custo de combustível por KM
 */
export function calculateFuelCostPerKm(
  fuelCost: number,
  totalKm: number
): number {
  if (totalKm <= 0) {
    return 0
  }
  return fuelCost / totalKm
}

