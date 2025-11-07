import { normalizeOperatorUrl } from '../lib/url'

describe('normalizeOperatorUrl', () => {
  test('removes company param from /operator root', () => {
    const input = 'https://example.com/operator?company=11111111-1111-4111-8111-1111111111c1'
    const out = normalizeOperatorUrl(input)
    expect(out).toBe('/operator')
  })

  test('preserves other query params when removing company', () => {
    const input = 'https://example.com/operator?company=abc&foo=bar&baz=1'
    const out = normalizeOperatorUrl(input)
    expect(out).toBe('/operator?foo=bar&baz=1')
  })

  test('works for nested operator routes', () => {
    const input = 'https://example.com/operator/funcionarios?company=abc&search=joao'
    const out = normalizeOperatorUrl(input)
    expect(out).toBe('/operator/funcionarios?search=joao')
  })

  test('returns original string if invalid URL', () => {
    const input = '/operator?company=abc'
    const out = normalizeOperatorUrl(input)
    expect(out).toBe('/operator?company=abc')
  })
})
