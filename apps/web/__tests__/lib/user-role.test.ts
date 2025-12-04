import { getUserRoleByEmail } from '@/lib/user-role'

describe('lib/user-role', () => {
  describe('getUserRoleByEmail', () => {
    it('deve retornar role admin para email de admin', () => {
      expect(getUserRoleByEmail('golffox@admin.com')).toBe('admin')
      expect(getUserRoleByEmail('admin@golffox.com')).toBe('admin')
    })

    it('deve retornar role operador para email de operador', () => {
      expect(getUserRoleByEmail('operador@empresa.com')).toBe('operador')
      expect(getUserRoleByEmail('operator@golffox.com')).toBe('operador')
    })

    it('deve retornar role transportadora para email de transportadora', () => {
      expect(getUserRoleByEmail('transportadora@trans.com')).toBe('transportadora')
      expect(getUserRoleByEmail('carrier@golffox.com')).toBe('transportadora')
    })

    it('deve retornar role driver como padrão', () => {
      expect(getUserRoleByEmail('unknown@email.com')).toBe('driver')
      expect(getUserRoleByEmail('')).toBe('driver')
    })

    it('deve ser case-insensitive', () => {
      expect(getUserRoleByEmail('GOLFFOX@ADMIN.COM')).toBe('admin')
      expect(getUserRoleByEmail('  golffox@admin.com  ')).toBe('admin')
    })
  })
})

