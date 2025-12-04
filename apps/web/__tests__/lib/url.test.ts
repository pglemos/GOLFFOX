import { normalizeOperatorUrl, isValidUUID } from '@/lib/url'

describe('lib/url', () => {
  describe('normalizeOperatorUrl', () => {
    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
        },
        writable: true,
      })
    })

    it('deve remover parâmetro company de URL de operador', () => {
      const url = '/operador?company=123&other=456'
      const result = normalizeOperatorUrl(url)
      expect(result).toBe('/operador?other=456')
    })

    it('deve manter URL sem parâmetro company', () => {
      const url = '/operador?other=456'
      const result = normalizeOperatorUrl(url)
      expect(result).toBe('/operador?other=456')
    })

    it('deve manter URL que não é de operador', () => {
      const url = '/admin?company=123'
      const result = normalizeOperatorUrl(url)
      expect(result).toBe('/admin?company=123')
    })

    it('deve lidar com URL inválida', () => {
      const result = normalizeOperatorUrl('not-a-url')
      expect(result).toBeDefined()
    })

    it('deve construir URL completa quando necessário', () => {
      const url = '/operador?company=123'
      const result = normalizeOperatorUrl(url)
      expect(result).not.toContain('company=123')
    })
  })

  describe('isValidUUID', () => {
    it('deve validar UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('deve rejeitar string que não é UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('123')).toBe(false)
      expect(isValidUUID('')).toBe(false)
    })

    it('deve validar UUID em maiúsculas', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
    })
  })
})

