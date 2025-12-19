/**
 * Testes de Segurança: XSS Protection
 * 
 * Valida que inputs de usuário são sanitizados
 * e renderizados de forma segura
 */

import { describe, it, expect } from '@jest/globals'

/**
 * Sanitiza HTML removendo tags e atributos perigosos
 */
function sanitizeHTML(input: string): string {
  // Remove tags HTML
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Escapa caracteres especiais
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  
  return sanitized
}

describe('XSS Protection', () => {
  describe('sanitizeHTML', () => {
    it('deve remover tags script', () => {
      const malicious = '<script>alert("XSS")</script>'
      const sanitized = sanitizeHTML(malicious)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
    })

    it('deve remover tags img com onerror', () => {
      const malicious = '<img src="x" onerror="alert(1)">'
      const sanitized = sanitizeHTML(malicious)
      expect(sanitized).not.toContain('<img')
      expect(sanitized).not.toContain('onerror')
    })

    it('deve remover tags iframe', () => {
      const malicious = '<iframe src="javascript:alert(1)"></iframe>'
      const sanitized = sanitizeHTML(malicious)
      expect(sanitized).not.toContain('<iframe')
    })

    it('deve escapar caracteres especiais', () => {
      const input = '<>&"\'/'
      const sanitized = sanitizeHTML(input)
      expect(sanitized).toBe('&lt;&gt;&amp;&quot;&#x27;&#x2F;')
    })

    it('deve permitir texto simples', () => {
      const input = 'Texto simples sem HTML'
      const sanitized = sanitizeHTML(input)
      expect(sanitized).toBe(input)
    })

    it('deve remover event handlers', () => {
      const malicious = '<div onclick="alert(1)">Click me</div>'
      const sanitized = sanitizeHTML(malicious)
      expect(sanitized).not.toContain('onclick')
      expect(sanitized).not.toContain('alert')
    })

    it('deve remover javascript: protocol', () => {
      const malicious = '<a href="javascript:alert(1)">Link</a>'
      const sanitized = sanitizeHTML(malicious)
      expect(sanitized).not.toContain('javascript:')
    })
  })

  describe('Input Validation', () => {
    it('deve validar que inputs não contêm HTML', () => {
      const dangerousInputs = [
        '<script>',
        'javascript:',
        'onerror=',
        'onclick=',
        '<iframe',
      ]

      dangerousInputs.forEach(input => {
        const sanitized = sanitizeHTML(input)
        expect(sanitized).not.toContain(input.toLowerCase())
      })
    })
  })
})
