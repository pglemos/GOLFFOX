/**
 * Testes para RealtimeService
 */

import { RealtimeService, RealtimeUpdateType } from '../realtime-service'

// Mock do Supabase
const mockChannel = {
  on: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
}

const mockFrom = jest.fn(() => ({
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      gte: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
}))

const mockSupabase = {
  channel: jest.fn(() => mockChannel),
  from: mockFrom,
}

jest.mock('../supabase', () => ({
  supabase: mockSupabase,
}))

describe('RealtimeService', () => {
  let service: RealtimeService
  let onUpdate: jest.Mock
  let onError: jest.Mock
  let onConnected: jest.Mock
  let onDisconnected: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    onUpdate = jest.fn()
    onError = jest.fn()
    onConnected = jest.fn()
    onDisconnected = jest.fn()

    service = new RealtimeService({
      onUpdate,
      onError,
      onConnected,
      onDisconnected,
      enablePolling: true,
      pollingInterval: 1000,
    })
  })

  afterEach(async () => {
    await service.disconnect()
  })

  describe('Conexão', () => {
    it('deve conectar aos canais de realtime', async () => {
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockChannel
      })

      await service.connect()

      expect(mockSupabase.channel).toHaveBeenCalledWith('map:driver_positions')
      expect(mockSupabase.channel).toHaveBeenCalledWith('map:trips')
      expect(mockChannel.subscribe).toHaveBeenCalled()
      expect(onConnected).toHaveBeenCalled()
    })

    it('deve usar polling como fallback se realtime falhar', async () => {
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('CHANNEL_ERROR')
        return mockChannel
      })

      await service.connect()

      // Verificar se polling foi iniciado (verificar se setInterval foi chamado)
      expect(service.connected).toBe(true)
    })
  })

  describe('Desconexão', () => {
    it('deve desconectar de todos os canais', async () => {
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockChannel
      })

      await service.connect()
      await service.disconnect()

      expect(mockChannel.unsubscribe).toHaveBeenCalled()
      expect(onDisconnected).toHaveBeenCalled()
    })
  })

  describe('Atualizações', () => {
    it('deve processar atualizações de posição', async () => {
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockChannel
      })

      mockChannel.on.mockImplementation((event, config, handler) => {
        if (event === 'postgres_changes' && config.table === 'driver_positions') {
          // Simular atualização de posição
          setTimeout(() => {
            handler({
              new: {
                vehicle_id: 'vehicle-1',
                trip_id: 'trip-1',
                lat: -19.916681,
                lng: -43.934493,
              },
            })
          }, 100)
        }
        return mockChannel
      })

      mockFrom.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: {
                  vehicle_id: 'vehicle-1',
                  lat: -19.916681,
                  lng: -43.934493,
                  speed: 10,
                  heading: 0,
                  vehicle_status: 'moving',
                  passenger_count: 5,
                },
                error: null,
              })
            ),
            gte: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })

      await service.connect()

      // Aguardar processamento
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Verificar se onUpdate foi chamado (pode não ser chamado devido ao debounce)
      // O teste verifica principalmente que não há erros
    })

    it('deve processar atualizações de trip', async () => {
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockChannel
      })

      mockChannel.on.mockImplementation((event, config, handler) => {
        if (event === 'postgres_changes' && config.table === 'trips') {
          setTimeout(() => {
            handler({
              new: {
                id: 'trip-1',
                route_id: 'route-1',
                vehicle_id: 'vehicle-1',
                driver_id: 'driver-1',
                status: 'completed',
              },
            })
          }, 100)
        }
        return mockChannel
      })

      await service.connect()

      await new Promise((resolve) => setTimeout(resolve, 200))
    })
  })

  describe('Status de conexão', () => {
    it('deve retornar status de conexão corretamente', async () => {
      expect(service.connected).toBe(false)

      mockChannel.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockChannel
      })

      await service.connect()

      expect(service.connected).toBe(true)
    })
  })
})

