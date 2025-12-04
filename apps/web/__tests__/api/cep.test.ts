import { GET } from '@/app/api/cep/route'
import { createMockRequest } from '../../helpers/api-test-helpers'

// Mock fetch global
global.fetch = jest.fn()

describe('GET /api/cep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve buscar CEP válido', async () => {
    const mockData = {
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      complemento: '',
      bairro: 'Bela Vista',
      localidade: 'São Paulo',
      uf: 'SP',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/cep?cep=01310100',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.address.cep).toBe('01310-100')
    expect(data.address.logradouro).toBe('Avenida Paulista')
  })

  it('deve rejeitar sem CEP', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/cep',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('CEP não fornecido')
  })

  it('deve validar formato do CEP', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/cep?cep=123',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('CEP deve ter 8 dígitos')
  })

  it('deve remover formatação do CEP', async () => {
    const mockData = {
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      complemento: '',
      bairro: 'Bela Vista',
      localidade: 'São Paulo',
      uf: 'SP',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/cep?cep=01310-100',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve retornar 404 para CEP não encontrado', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ erro: true }),
    })

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/cep?cep=00000000',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('CEP não encontrado')
  })

  it('deve lidar com erro da API ViaCEP', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/cep?cep=01310100',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erro ao buscar endereço pelo CEP')
  })

  it('deve lidar com resposta não ok', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/cep?cep=01310100',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erro ao buscar endereço pelo CEP')
  })
})

