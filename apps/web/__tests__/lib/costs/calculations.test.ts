import {
  calculateCostPerKm,
  calculateCostPerTrip,
  calculateCostPerPassenger,
  calculateBudgetVariance,
  detectOutliers3Sigma,
  detectOutliersPercentile,
  calculateMaintenancePerKm,
  calculateFuelEfficiency,
  calculateFuelCostPerKm,
} from '@/lib/costs/calculations'

describe('lib/costs/calculations', () => {
  describe('calculateCostPerKm', () => {
    it('deve calcular custo por KM', () => {
      const metrics = {
        totalCost: 1000,
        totalKm: 100,
        totalTrips: 10,
        totalPassengers: 50,
      }
      expect(calculateCostPerKm(metrics)).toBe(10)
    })

    it('deve retornar 0 se totalKm <= 0', () => {
      const metrics = {
        totalCost: 1000,
        totalKm: 0,
        totalTrips: 10,
        totalPassengers: 50,
      }
      expect(calculateCostPerKm(metrics)).toBe(0)
    })
  })

  describe('calculateCostPerTrip', () => {
    it('deve calcular custo por viagem', () => {
      const metrics = {
        totalCost: 1000,
        totalKm: 100,
        totalTrips: 10,
        totalPassengers: 50,
      }
      expect(calculateCostPerTrip(metrics)).toBe(100)
    })

    it('deve retornar 0 se totalTrips <= 0', () => {
      const metrics = {
        totalCost: 1000,
        totalKm: 100,
        totalTrips: 0,
        totalPassengers: 50,
      }
      expect(calculateCostPerTrip(metrics)).toBe(0)
    })
  })

  describe('calculateCostPerPassenger', () => {
    it('deve calcular custo por passageiro', () => {
      const metrics = {
        totalCost: 1000,
        totalKm: 100,
        totalTrips: 10,
        totalPassengers: 50,
      }
      expect(calculateCostPerPassenger(metrics)).toBe(20)
    })

    it('deve retornar 0 se totalPassengers <= 0', () => {
      const metrics = {
        totalCost: 1000,
        totalKm: 100,
        totalTrips: 10,
        totalPassengers: 0,
      }
      expect(calculateCostPerPassenger(metrics)).toBe(0)
    })
  })

  describe('calculateBudgetVariance', () => {
    it('deve calcular variação positiva', () => {
      const result = calculateBudgetVariance(1200, 1000)
      expect(result.varianceAbsolute).toBe(200)
      expect(result.variancePercent).toBe(20)
    })

    it('deve calcular variação negativa', () => {
      const result = calculateBudgetVariance(800, 1000)
      expect(result.varianceAbsolute).toBe(-200)
      expect(result.variancePercent).toBe(-20)
    })

    it('deve retornar 0% se budget é 0', () => {
      const result = calculateBudgetVariance(1000, 0)
      expect(result.variancePercent).toBe(0)
    })
  })

  describe('detectOutliers3Sigma', () => {
    it('deve detectar outliers', () => {
      const values = [10, 11, 12, 13, 14, 15, 100] // 100 é outlier
      const outliers = detectOutliers3Sigma(values)
      expect(outliers).toContain(100)
    })

    it('deve retornar array vazio para array vazio', () => {
      expect(detectOutliers3Sigma([])).toEqual([])
    })
  })

  describe('detectOutliersPercentile', () => {
    it('deve detectar outliers por percentil', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 1000]
      const outliers = detectOutliersPercentile(values, 95)
      expect(outliers.length).toBeGreaterThan(0)
    })

    it('deve retornar array vazio para array vazio', () => {
      expect(detectOutliersPercentile([])).toEqual([])
    })
  })

  describe('calculateMaintenancePerKm', () => {
    it('deve calcular manutenção por KM', () => {
      expect(calculateMaintenancePerKm(1000, 100)).toBe(10)
    })

    it('deve retornar 0 se totalKm <= 0', () => {
      expect(calculateMaintenancePerKm(1000, 0)).toBe(0)
    })
  })

  describe('calculateFuelEfficiency', () => {
    it('deve calcular eficiência de combustível', () => {
      expect(calculateFuelEfficiency(100, 10)).toBe(10)
    })

    it('deve retornar 0 se totalLiters <= 0', () => {
      expect(calculateFuelEfficiency(100, 0)).toBe(0)
    })
  })

  describe('calculateFuelCostPerKm', () => {
    it('deve calcular custo de combustível por KM', () => {
      expect(calculateFuelCostPerKm(500, 100)).toBe(5)
    })

    it('deve retornar 0 se totalKm <= 0', () => {
      expect(calculateFuelCostPerKm(500, 0)).toBe(0)
    })
  })
})

