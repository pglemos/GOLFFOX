import { validateBrazilianAddress } from '@/lib/address-validator'

global.fetch = jest.fn()

describe('lib/address-validator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve validar endereço completo', async () => {
    const address = {
      street: 'Rua Teste',
      number: '123',
      neighborhood: 'Bairro Teste',
      city: 'São Paulo',
      state: 'SP',
      cep: '01310-100',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    })

    const result = await validateBrazilianAddress(address)

    expect(result.isValid).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it('deve identificar campos faltando', async () => {
    const address = {
      street: 'Rua Teste',
      // Faltando number, neighborhood, etc.
    }

    const result = await validateBrazilianAddress(address)

    expect(result.isValid).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it('deve validar formato de CEP', async () => {
    const address = {
      street: 'Rua Teste',
      number: '123',
      neighborhood: 'Bairro',
      city: 'São Paulo',
      state: 'SP',
      cep: '123', // Formato inválido
    }

    const result = await validateBrazilianAddress(address)

    expect(result.isValid).toBe(false)
    expect(result.issues).toContain('CEP em formato inválido')
  })

  it('deve consultar ViaCEP quando CEP fornecido', async () => {
    const address = {
      street: 'Rua Teste',
      number: '123',
      neighborhood: 'Bairro',
      city: 'São Paulo',
      state: 'SP',
      cep: '01310-100',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    })

    await validateBrazilianAddress(address)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://viacep.com.br/ws/01310100/json/'
    )
  })

  it('deve lidar com CEP não encontrado', async () => {
    const address = {
      street: 'Rua Teste',
      number: '123',
      neighborhood: 'Bairro',
      city: 'São Paulo',
      state: 'SP',
      cep: '00000-000',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ erro: true }),
    })

    const result = await validateBrazilianAddress(address)

    expect(result.isValid).toBe(false)
    expect(result.issues).toContain('CEP não encontrado na base oficial')
  })

  it('deve lidar com erro na consulta ViaCEP', async () => {
    const address = {
      street: 'Rua Teste',
      number: '123',
      neighborhood: 'Bairro',
      city: 'São Paulo',
      state: 'SP',
      cep: '01310-100',
    }

    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const result = await validateBrazilianAddress(address)

    expect(result.issues).toContain('Falha ao consultar base de CEP')
  })
})

