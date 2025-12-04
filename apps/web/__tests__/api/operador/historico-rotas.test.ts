import { GET } from '@/app/api/operador/historico-rotas/route'
import { createOperatorRequest } from '../../helpers/api-test-helpers'
import { NextRequest } from 'next/server'

describe('GET /api/operador/historico-rotas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar histórico de rotas', async () => {
    const req = createOperatorRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.executions)).toBe(true)
    expect(data.executions.length).toBeGreaterThan(0)
  })

  it('deve incluir dados de execução', async () => {
    const req = createOperatorRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    if (data.executions.length > 0) {
      const execution = data.executions[0]
      expect(execution).toHaveProperty('id')
      expect(execution).toHaveProperty('date')
      expect(execution).toHaveProperty('route')
      expect(execution).toHaveProperty('status')
    }
  })
})

