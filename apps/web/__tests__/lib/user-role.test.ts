import { getUserRoleByEmail } from '@/lib/user-role'

describe('lib/user-role', () => {
  describe('getUserRoleByEmail', () => {
    it('deve retornar role admin para email de admin', () => {
      expect(getUserRoleByEmail('golffox@admin.com')).toBe('admin')
      expect(getUserRoleByEmail('admin@golffox.com')).toBe('admin')
    })

    it('deve retornar role operador para email de operador', () => {
      expect(getUserRoleByEmail('operador@empresa.com')).toBe('operador')
      expect(getUserRoleByEmail('operador@golffox.com')).toBe('operador')
    })

    it('deve retornar role transportadora para email de transportadora', () => {
      expect(getUserRoleByEmail('transportadora@trans.com')).toBe('transportadora')
      expect(getUserRoleByEmail('transportadora@golffox.com')).toBe('transportadora')
    })

    it('deve retornar role motorista como padrão', () => {
      expect(getUserRoleByEmail('unknown@email.com')).toBe('motorista')
      expect(getUserRoleByEmail('')).toBe('motorista')
    })

    it('deve ser case-insensitive', () => {
      expect(getUserRoleByEmail('GOLFFOX@ADMIN.COM')).toBe('admin')
      expect(getUserRoleByEmail('  golffox@admin.com  ')).toBe('admin')
    })
  })
})

