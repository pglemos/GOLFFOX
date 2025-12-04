import {
  formatCurrency,
  formatCount,
  formatPercentage,
  formatDistance,
  formatDuration,
  formatDate,
  formatDateTime,
  formatRelativeTime,
} from '@/lib/kpi-utils'

describe('lib/kpi-utils', () => {
  describe('formatCurrency', () => {
    it('deve formatar moeda corretamente', () => {
      expect(formatCurrency(1000)).toContain('1.000')
      expect(formatCurrency(1000)).toContain('R$')
    })

    it('deve lidar com valores nulos', () => {
      expect(formatCurrency(null)).toBe('R$ 0,00')
      expect(formatCurrency(undefined)).toBe('R$ 0,00')
    })

    it('deve lidar com strings', () => {
      expect(formatCurrency('1000')).toContain('1.000')
    })

    it('deve lidar com NaN', () => {
      expect(formatCurrency(NaN)).toBe('R$ 0,00')
    })
  })

  describe('formatCount', () => {
    it('deve formatar contagem', () => {
      expect(formatCount(1000)).toBe('1.000')
      expect(formatCount(1000000)).toBe('1.000.000')
    })

    it('deve lidar com valores nulos', () => {
      expect(formatCount(null)).toBe('0')
      expect(formatCount(undefined)).toBe('0')
    })
  })

  describe('formatPercentage', () => {
    it('deve formatar porcentagem', () => {
      expect(formatPercentage(50)).toBe('50.0%')
      expect(formatPercentage(50.123)).toBe('50.1%')
    })

    it('deve usar decimais customizados', () => {
      expect(formatPercentage(50.123, 2)).toBe('50.12%')
    })

    it('deve lidar com valores nulos', () => {
      expect(formatPercentage(null)).toBe('0%')
    })
  })

  describe('formatDistance', () => {
    it('deve formatar distância', () => {
      expect(formatDistance(100)).toBe('100.00 km')
      expect(formatDistance(100, 'm')).toBe('100.00 m')
    })

    it('deve lidar com valores nulos', () => {
      expect(formatDistance(null)).toBe('0 km')
    })
  })

  describe('formatDuration', () => {
    it('deve formatar duração em horas', () => {
      expect(formatDuration(2.5, 'hours')).toBe('2.5h')
    })

    it('deve formatar duração em minutos', () => {
      expect(formatDuration(90, 'minutes')).toBe('1h 30min')
      expect(formatDuration(30, 'minutes')).toBe('30min')
    })

    it('deve lidar com valores nulos', () => {
      expect(formatDuration(null)).toBe('0 h')
    })
  })

  describe('formatDate', () => {
    it('deve formatar data', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toContain('15')
      expect(result).toContain('01')
      expect(result).toContain('2024')
    })

    it('deve lidar com strings de data', () => {
      const result = formatDate('2024-01-15')
      expect(result).toBeDefined()
    })

    it('deve retornar "-" para valores inválidos', () => {
      expect(formatDate(null)).toBe('-')
      expect(formatDate('invalid')).toBe('-')
    })
  })

  describe('formatDateTime', () => {
    it('deve formatar data e hora', () => {
      const date = new Date('2024-01-15T10:30:00')
      const result = formatDateTime(date)
      expect(result).toBeDefined()
    })

    it('deve retornar "-" para valores inválidos', () => {
      expect(formatDateTime(null)).toBe('-')
    })
  })

  describe('formatRelativeTime', () => {
    it('deve formatar tempo relativo - agora', () => {
      const now = new Date()
      expect(formatRelativeTime(now)).toBe('agora')
    })

    it('deve formatar tempo relativo - minutos', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(formatRelativeTime(fiveMinutesAgo)).toContain('min')
    })

    it('deve formatar tempo relativo - horas', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      expect(formatRelativeTime(twoHoursAgo)).toContain('h')
    })

    it('deve formatar tempo relativo - dias', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(threeDaysAgo)).toContain('d')
    })

    it('deve retornar "-" para valores inválidos', () => {
      expect(formatRelativeTime(null)).toBe('-')
      expect(formatRelativeTime('invalid')).toBe('-')
    })
  })
})

