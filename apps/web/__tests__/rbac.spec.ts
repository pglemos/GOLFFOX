import { hasRole } from '../lib/api-auth'

describe('RBAC - hasRole', () => {
  it('admin deve acessar admin', () => {
    expect(hasRole({ id: '1', email: 'a@b', role: 'admin' }, 'admin')).toBe(true)
  })
  it('operador não deve acessar admin', () => {
    expect(hasRole({ id: '2', email: 'o@b', role: 'operador' }, 'admin')).toBe(false)
  })
  it('admin deve acessar operador', () => {
    expect(hasRole({ id: '3', email: 'x@y', role: 'admin' }, 'operador')).toBe(true)
  })
  it('operador deve acessar operador', () => {
    expect(hasRole({ id: '4', email: 'x@y', role: 'operador' }, 'operador')).toBe(true)
  })
  it('transportadora não deve acessar operador', () => {
    expect(hasRole({ id: '5', email: 'x@y', role: 'transportadora' }, 'operador')).toBe(false)
  })
  it('lista de roles - any match', () => {
    expect(hasRole({ id: '6', email: 'x@y', role: 'transportadora' }, ['admin','transportadora'])).toBe(true)
    expect(hasRole({ id: '7', email: 'x@y', role: 'passageiro' }, ['admin','transportadora'])).toBe(false)
  })
})


