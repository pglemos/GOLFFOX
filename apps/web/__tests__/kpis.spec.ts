import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/kpi-utils'

describe('KPI Utils', () => {
  describe('formatCurrency', () => {
    it('deve formatar valores monetários corretamente', () => {
      expect(formatCurrency(1000)).toBe('R$ 1.000,00')
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
      expect(formatCurrency(0)).toBe('R$ 0,00')
    })
  })

  describe('formatPercentage', () => {
    it('deve formatar porcentagens corretamente', () => {
      expect(formatPercentage(50)).toBe('50%')
      expect(formatPercentage(75.5)).toBe('75,5%')
      expect(formatPercentage(0)).toBe('0%')
    })
  })

  describe('formatNumber', () => {
    it('deve formatar números corretamente', () => {
      expect(formatNumber(1000)).toBe('1.000')
      expect(formatNumber(1234567)).toBe('1.234.567')
      expect(formatNumber(0)).toBe('0')
    })
  })
})

