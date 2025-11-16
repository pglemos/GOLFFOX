import { hasRole } from '../lib/api-auth'

describe('RBAC - hasRole', () => {
  it('admin deve acessar admin', () => {
    expect(hasRole({ id: '1', email: 'a@b', role: 'admin' }, 'admin')).toBe(true)
  })
  it('operator não deve acessar admin', () => {
    expect(hasRole({ id: '2', email: 'o@b', role: 'operator' }, 'admin')).toBe(false)
  })
  it('admin deve acessar operator', () => {
    expect(hasRole({ id: '3', email: 'x@y', role: 'admin' }, 'operator')).toBe(true)
  })
  it('operator deve acessar operator', () => {
    expect(hasRole({ id: '4', email: 'x@y', role: 'operator' }, 'operator')).toBe(true)
  })
  it('carrier não deve acessar operator', () => {
    expect(hasRole({ id: '5', email: 'x@y', role: 'carrier' }, 'operator')).toBe(false)
  })
  it('lista de roles - any match', () => {
    expect(hasRole({ id: '6', email: 'x@y', role: 'carrier' }, ['admin','carrier'])).toBe(true)
    expect(hasRole({ id: '7', email: 'x@y', role: 'passenger' }, ['admin','carrier'])).toBe(false)
  })
})


