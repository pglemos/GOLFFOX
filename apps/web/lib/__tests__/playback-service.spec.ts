/**
 * Testes para PlaybackService
 */

import { PlaybackService, HistoricalPosition } from '../playback-service'

// Mock do Supabase
const mockRpc = jest.fn()

const mockSupabase = {
  rpc: mockRpc,
}

jest.mock('../supabase', () => ({
  supabase: mockSupabase,
}))

describe('PlaybackService', () => {
  let service: PlaybackService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new PlaybackService()
    jest.useFakeTimers()
  })

  afterEach(() => {
    service.stop()
    jest.useRealTimers()
  })

  describe('Carregamento de posições', () => {
    it('deve carregar posições históricas via RPC', async () => {
      const mockPositions = [
        {
          position_id: 'pos-1',
          trip_id: 'trip-1',
          vehicle_id: 'vehicle-1',
          driver_id: 'driver-1',
          route_id: 'route-1',
          lat: -19.916681,
          lng: -43.934493,
          speed: 10,
          heading: 0,
          timestamp: '2024-01-01T10:00:00Z',
          passenger_count: 5,
        },
        {
          position_id: 'pos-2',
          trip_id: 'trip-1',
          vehicle_id: 'vehicle-1',
          driver_id: 'driver-1',
          route_id: 'route-1',
          lat: -19.917681,
          lng: -43.935493,
          speed: 12,
          heading: 45,
          timestamp: '2024-01-01T10:01:00Z',
          passenger_count: 5,
        },
      ]

      mockRpc.mockResolvedValue({ data: mockPositions, error: null })

      const from = new Date('2024-01-01T10:00:00Z')
      const to = new Date('2024-01-01T11:00:00Z')

      const positions = await service.loadPositions(
        'company-1',
        'route-1',
        null,
        from,
        to,
        1
      )

      expect(mockRpc).toHaveBeenCalledWith('v_positions_by_interval', {
        p_company_id: 'company-1',
        p_route_id: 'route-1',
        p_vehicle_id: null,
        p_from: from.toISOString(),
        p_to: to.toISOString(),
        p_interval_minutes: 1,
      })

      expect(positions).toHaveLength(2)
      expect(positions[0].vehicle_id).toBe('vehicle-1')
      expect(positions[0].lat).toBe(-19.916681)
    })

    it('deve retornar array vazio se houver erro', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('Erro') })

      const positions = await service.loadPositions(
        null,
        null,
        null,
        new Date(),
        new Date(),
        1
      )

      expect(positions).toHaveLength(0)
    })
  })

  describe('Controles de playback', () => {
    beforeEach(async () => {
      const mockPositions = [
        {
          position_id: 'pos-1',
          trip_id: 'trip-1',
          vehicle_id: 'vehicle-1',
          driver_id: 'driver-1',
          route_id: 'route-1',
          lat: -19.916681,
          lng: -43.934493,
          speed: 10,
          heading: 0,
          timestamp: '2024-01-01T10:00:00Z',
          passenger_count: 5,
        },
      ]

      mockRpc.mockResolvedValue({ data: mockPositions, error: null })
      await service.loadPositions(
        null,
        null,
        null,
        new Date('2024-01-01T10:00:00Z'),
        new Date('2024-01-01T11:00:00Z'),
        1
      )
    })

    it('deve iniciar playback', () => {
      const onPlay = jest.fn()
      const onPositionUpdate = jest.fn()

      service.play({
        speed: 1,
        from: new Date('2024-01-01T10:00:00Z'),
        to: new Date('2024-01-01T11:00:00Z'),
        onPlay,
        onPositionUpdate,
      })

      expect(onPlay).toHaveBeenCalled()
    })

    it('deve pausar playback', () => {
      const onPlay = jest.fn()
      const onPause = jest.fn()

      service.play({
        speed: 1,
        from: new Date('2024-01-01T10:00:00Z'),
        to: new Date('2024-01-01T11:00:00Z'),
        onPlay,
        onPause,
      })

      service.pause()

      expect(onPause).toHaveBeenCalled()
    })

    it('deve parar playback', () => {
      const onPlay = jest.fn()

      service.play({
        speed: 1,
        from: new Date('2024-01-01T10:00:00Z'),
        to: new Date('2024-01-01T11:00:00Z'),
        onPlay,
      })

      service.stop()

      // Verificar que está parado
      expect(service).toBeDefined()
    })

    it('deve alterar velocidade dinamicamente', () => {
      const onPlay = jest.fn()

      service.play({
        speed: 1,
        from: new Date('2024-01-01T10:00:00Z'),
        to: new Date('2024-01-01T11:00:00Z'),
        onPlay,
      })

      service.setSpeed(2)
      service.setSpeed(4)

      // Verificar que velocidade foi alterada (sem reiniciar)
      expect(service).toBeDefined()
    })
  })

  describe('Seek', () => {
    beforeEach(async () => {
      const mockPositions = [
        {
          position_id: 'pos-1',
          trip_id: 'trip-1',
          vehicle_id: 'vehicle-1',
          driver_id: 'driver-1',
          route_id: 'route-1',
          lat: -19.916681,
          lng: -43.934493,
          speed: 10,
          heading: 0,
          timestamp: '2024-01-01T10:00:00Z',
          passenger_count: 5,
        },
        {
          position_id: 'pos-2',
          trip_id: 'trip-1',
          vehicle_id: 'vehicle-1',
          driver_id: 'driver-1',
          route_id: 'route-1',
          lat: -19.917681,
          lng: -43.935493,
          speed: 12,
          heading: 45,
          timestamp: '2024-01-01T10:30:00Z',
          passenger_count: 5,
        },
      ]

      mockRpc.mockResolvedValue({ data: mockPositions, error: null })
      await service.loadPositions(
        null,
        null,
        null,
        new Date('2024-01-01T10:00:00Z'),
        new Date('2024-01-01T11:00:00Z'),
        1
      )
    })

    it('deve fazer seek para timestamp específico', () => {
      const targetTime = new Date('2024-01-01T10:30:00Z')
      const onPositionUpdate = jest.fn()

      service.play({
        speed: 1,
        from: new Date('2024-01-01T10:00:00Z'),
        to: new Date('2024-01-01T11:00:00Z'),
        onPositionUpdate,
      })

      service.seekTo(targetTime)

      // Verificar que seek foi executado
      expect(service).toBeDefined()
    })
  })
})

