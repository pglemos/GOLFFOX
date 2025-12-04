import { geocodeAddress, maskCPF } from '@/lib/geocoding'

global.fetch = jest.fn()

describe('lib/geocoding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('geocodeAddress', () => {
    it('deve geocodificar endereço válido', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'AIzaTestKey'
      
      const mockResponse = {
        status: 'OK',
        results: [{
          geometry: {
            location: {
              lat: -23.5505,
              lng: -46.6333,
            },
          },
          formatted_address: 'Avenida Paulista, São Paulo - SP',
        }],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      const result = await geocodeAddress('Avenida Paulista, São Paulo')

      expect(result).not.toBeNull()
      expect(result?.lat).toBe(-23.5505)
      expect(result?.lng).toBe(-46.6333)
      expect(result?.formatted_address).toBe('Avenida Paulista, São Paulo - SP')
    })

    it('deve retornar null se API key não configurada', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      const result = await geocodeAddress('Avenida Paulista')
      
      expect(result).toBeNull()
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('deve retornar null se status não for OK', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'AIzaTestKey'
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ status: 'ZERO_RESULTS' }),
      })

      const result = await geocodeAddress('Endereço Inexistente')
      
      expect(result).toBeNull()
    })

    it('deve lidar com erro na requisição', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'AIzaTestKey'
      
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await geocodeAddress('Avenida Paulista')
      
      expect(result).toBeNull()
    })
  })

  describe('maskCPF', () => {
    it('deve formatar CPF corretamente', () => {
      expect(maskCPF('12345678900')).toBe('123.456.789-00')
    })

    it('deve remover caracteres não numéricos antes de formatar', () => {
      expect(maskCPF('123.456.789-00')).toBe('123.456.789-00')
      expect(maskCPF('12345678900')).toBe('123.456.789-00')
    })

    it('deve retornar string vazia para CPF vazio', () => {
      expect(maskCPF('')).toBe('')
    })

    it('deve retornar original se não tiver 11 dígitos', () => {
      expect(maskCPF('123')).toBe('123')
      expect(maskCPF('123456789')).toBe('123456789')
    })
  })
})

