import { normalizeOperatorUrl } from '../lib/url'

describe('normalizeOperatorUrl', () => {
  test('removes company param from /operador root', () => {
    const input = 'https://example.com/operador?company=11111111-1111-4111-8111-1111111111c1'
    const out = normalizeOperatorUrl(input)
    expect(out).toBe('/operador')
  })

  test('preserves other query params when removing company', () => {
    const input = 'https://example.com/operador?company=abc&foo=bar&baz=1'
    const out = normalizeOperatorUrl(input)
    expect(out).toBe('/operador?foo=bar&baz=1')
  })

  test('works for nested operador routes', () => {
    const input = 'https://example.com/operador/funcionarios?company=abc&search=joao'
    const out = normalizeOperatorUrl(input)
    expect(out).toBe('/operador/funcionarios?search=joao')
  })

  test('normalizes relative operador URL by stripping company param', () => {
    const input = '/operador?company=abc'
    const out = normalizeOperatorUrl(input)
    expect(out).toBe('/operador')
  })
})
