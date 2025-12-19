/**
 * Testes de Segurança: SQL Injection
 * 
 * Valida que todas as rotas que recebem parâmetros SQL
 * estão protegidas contra SQL injection
 */

import { describe, it, expect } from '@jest/globals'
import { validateSQL, validateSQLOrThrow } from '@/lib/validation/sql-validator'

describe('SQL Injection Protection', () => {
  describe('validateSQL', () => {
    it('deve permitir SELECT simples', () => {
      const result = validateSQL('SELECT * FROM users WHERE id = $1')
      expect(result.valid).toBe(true)
    })

    it('deve permitir UPDATE com WHERE', () => {
      const result = validateSQL('UPDATE users SET name = $1 WHERE id = $2')
      expect(result.valid).toBe(true)
    })

    it('deve permitir INSERT simples', () => {
      const result = validateSQL('INSERT INTO users (name, email) VALUES ($1, $2)')
      expect(result.valid).toBe(true)
    })

    it('deve bloquear DROP TABLE', () => {
      const result = validateSQL('DROP TABLE users')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('DROP')
    })

    it('deve bloquear DELETE sem WHERE', () => {
      const result = validateSQL('DELETE FROM users')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('DELETE sem WHERE')
    })

    it('deve bloquear TRUNCATE', () => {
      const result = validateSQL('TRUNCATE TABLE users')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('TRUNCATE')
    })

    it('deve bloquear ALTER TABLE', () => {
      const result = validateSQL('ALTER TABLE users ADD COLUMN test VARCHAR')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('ALTER')
    })

    it('deve bloquear SQL injection clássico', () => {
      const maliciousSQL = "SELECT * FROM users WHERE id = 1; DROP TABLE users--"
      const result = validateSQL(maliciousSQL)
      expect(result.valid).toBe(false)
    })

    it('deve bloquear UNION SELECT', () => {
      const result = validateSQL('SELECT * FROM users UNION SELECT * FROM passwords')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('UNION')
    })

    it('deve bloquear EXEC', () => {
      const result = validateSQL('EXEC xp_cmdshell')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('EXEC')
    })

    it('deve remover comentários SQL', () => {
      const sql = 'SELECT * FROM users -- comentário malicioso'
      const result = validateSQL(sql)
      expect(result.valid).toBe(true)
    })

    it('deve permitir DELETE com WHERE', () => {
      const result = validateSQL('DELETE FROM users WHERE id = $1')
      expect(result.valid).toBe(true)
    })
  })

  describe('validateSQLOrThrow', () => {
    it('deve lançar erro para SQL inválido', () => {
      expect(() => {
        validateSQLOrThrow('DROP TABLE users')
      }).toThrow()
    })

    it('não deve lançar erro para SQL válido', () => {
      expect(() => {
        validateSQLOrThrow('SELECT * FROM users WHERE id = $1')
      }).not.toThrow()
    })
  })
})
