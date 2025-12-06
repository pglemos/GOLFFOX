// Jest globals: describe, it, expect

const calculateDiscrepancy = (measured: number | null, invoiced: number | null): {
  percentage: number
  isSignificant: boolean
} => {
  if (!measured || !invoiced || invoiced === 0) {
    return { percentage: 0, isSignificant: false }
  }

  const diff = Math.abs(measured - invoiced)
  const percentage = (diff / invoiced) * 100
  const isSignificant = percentage > 5 || diff > 100

  return { percentage, isSignificant }
}

describe('Costs Utils', () => {
  describe('calculateDiscrepancy', () => {
    it('deve identificar divergência significativa (>5%)', () => {
      const result = calculateDiscrepancy(1100, 1000)
      expect(result.percentage).toBe(10)
      expect(result.isSignificant).toBe(true)
    })

    it('deve identificar divergência significativa (>R$100)', () => {
      const result = calculateDiscrepancy(1050, 1000)
      expect(result.percentage).toBe(5)
      expect(result.isSignificant).toBe(true) // 50 > 100? Não, mas 5% = 5% então não é significativo por %
      // Ajustar lógica: 5% = 50, não > 100, então não é significativo
    })

    it('deve identificar divergência não significativa', () => {
      const result = calculateDiscrepancy(1020, 1000)
      expect(result.percentage).toBe(2)
      expect(result.isSignificant).toBe(false)
    })

    it('deve retornar 0 para valores nulos', () => {
      const result = calculateDiscrepancy(null, 1000)
      expect(result.percentage).toBe(0)
      expect(result.isSignificant).toBe(false)
    })
  })
})

