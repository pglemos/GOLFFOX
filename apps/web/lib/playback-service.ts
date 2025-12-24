/**
 * Serviço de Playback Histórico
 * Gerencia animação de marcadores no tempo histórico
 */

import { error as logError, warn } from './logger'
import { supabase } from './supabase'

export interface HistoricalPosition {
  position_id: string
  trip_id: string
  veiculo_id: string
  motorista_id: string
  route_id: string
  lat: number
  lng: number
  speed: number | null
  heading: number | null
  timestamp: Date
  passenger_count: number
}

export interface PlaybackOptions {
  speed: 1 | 2 | 4 // Velocidade de reprodução (1x, 2x, 4x)
  from: Date
  to: Date
  onPositionUpdate?: (position: HistoricalPosition, timestamp: Date) => void
  onComplete?: () => void
  onPause?: () => void
  onPlay?: () => void
}

export class PlaybackService {
  private positions: HistoricalPosition[] = []
  private currentIndex = 0
  private animationFrameId: number | null = null
  private isPlaying = false
  private isPaused = false
  private startTime: number = 0
  private pausedTime: number = 0
  private options: PlaybackOptions | null = null
  private intervalMs = 1000 // 1 segundo por padrão

  /**
   * Carrega posições históricas
   */
  async loadPositions(
    companyId: string | null,
    routeId: string | null,
    vehicleId: string | null,
    from: Date,
    to: Date,
    intervalMinutes: number = 1
  ): Promise<HistoricalPosition[]> {
      // Importar supabase dinamicamente
      const { supabase } = await import('@/lib/supabase')
      
      // Chamar função RPC v_positions_by_interval
      const { data, error } = await supabase.rpc(
        'v_positions_by_interval',
        {
          p_company_id: companyId,
          p_route_id: routeId,
          p_vehicle_id: vehicleId,
          p_from: from.toISOString(),
          p_to: to.toISOString(),
          p_interval_minutes: intervalMinutes,
        }
      )

    if (error) {
      logError('Erro ao carregar posições históricas', { error }, 'PlaybackService')
      return []
    }

    // Converter para formato interno
    this.positions = (data || []).map((p: any) => ({
      position_id: p.position_id,
      trip_id: p.trip_id,
      veiculo_id: p.veiculo_id,
      motorista_id: p.motorista_id,
      route_id: p.route_id,
      lat: p.lat,
      lng: p.lng,
      speed: p.speed,
      heading: p.heading,
      timestamp: new Date(p.timestamp),
      passenger_count: p.passenger_count,
    }))

    // Ordenar por timestamp
    this.positions.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    )

    return this.positions
  }

  /**
   * Inicia playback
   */
  play(options: PlaybackOptions): void {
    if (this.positions.length === 0) {
      warn('Nenhuma posição carregada para playback', {}, 'PlaybackService')
      return
    }

    this.options = options
    this.isPlaying = true
    this.isPaused = false

    // Calcular intervalo baseado na velocidade
    const baseInterval = 1000 // 1 segundo
    this.intervalMs = baseInterval / options.speed

    // Resetar índice se necessário
    if (this.currentIndex >= this.positions.length) {
      this.currentIndex = 0
    }

    // Se estava pausado, continuar do ponto onde parou
    if (this.pausedTime > 0) {
      this.startTime = performance.now() - this.pausedTime
      this.pausedTime = 0
    } else {
      this.startTime = performance.now()
      this.currentIndex = 0
    }

    this.lastUpdateTime = 0 // Reset throttling
    this.options.onPlay?.()
    this.animate()
  }

  /**
   * Pausa playback
   */
  pause(): void {
    if (!this.isPlaying) return

    this.isPaused = true
    this.isPlaying = false

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    // Salvar tempo de pausa
    this.pausedTime = performance.now() - this.startTime

    this.options?.onPause?.()
  }

  /**
   * Para playback
   */
  stop(): void {
    this.isPlaying = false
    this.isPaused = false
    this.currentIndex = 0
    this.pausedTime = 0
    this.lastUpdateTime = 0

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Altera velocidade (1x, 2x, 4x)
   */
  setSpeed(speed: 1 | 2 | 4): void {
    if (this.options) {
      const wasPlaying = this.isPlaying && !this.isPaused
      
      this.options.speed = speed
      this.intervalMs = 1000 / speed

      // Se estiver rodando, ajustar velocidade dinamicamente sem reiniciar
      if (wasPlaying) {
        // Não reiniciar, apenas ajustar intervalo
        // A velocidade será aplicada no próximo frame de animação
        this.lastUpdateTime = performance.now() // Reset throttling
      }
    }
  }

  /**
   * Vai para timestamp específico
   */
  seekTo(timestamp: Date): void {
    // Encontrar índice mais próximo
    const targetTime = timestamp.getTime()
    let closestIndex = 0
    let minDiff = Infinity

    for (let i = 0; i < this.positions.length; i++) {
      const diff = Math.abs(this.positions[i].timestamp.getTime() - targetTime)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    }

    this.currentIndex = closestIndex

    // Se estiver rodando, atualizar posição imediatamente
    if (this.isPlaying && !this.isPaused) {
      this.updatePosition()
    }
  }

  /**
   * Loop de animação otimizado com debounce
   */
  private lastUpdateTime: number = 0
  private readonly UPDATE_THROTTLE_MS = 16 // ~60fps (16ms por frame)

  private animate(): void {
    if (!this.isPlaying || this.isPaused) return

    const now = performance.now()
    
    // Throttle para ~60fps
    if (now - this.lastUpdateTime < this.UPDATE_THROTTLE_MS) {
      this.animationFrameId = requestAnimationFrame(() => this.animate())
      return
    }

    this.lastUpdateTime = now
    const elapsed = now - this.startTime - this.pausedTime
    const targetTime = elapsed * this.options!.speed

    // Encontrar posições a serem exibidas baseado no tempo decorrido
    // Limitar a 1 atualização por frame para suavidade
    let updatesThisFrame = 0
    const MAX_UPDATES_PER_FRAME = 1

    while (
      this.currentIndex < this.positions.length &&
      updatesThisFrame < MAX_UPDATES_PER_FRAME &&
      this.positions[this.currentIndex].timestamp.getTime() <=
        this.options!.from.getTime() + targetTime
    ) {
      this.updatePosition()
      this.currentIndex++
      updatesThisFrame++
    }

    // Verificar se completou
    if (this.currentIndex >= this.positions.length) {
      this.stop()
      this.options?.onComplete?.()
      return
    }

    // Continuar animação
    this.animationFrameId = requestAnimationFrame(() => this.animate())
  }

  /**
   * Atualiza posição atual
   */
  private updatePosition(): void {
    if (this.currentIndex >= this.positions.length) return

    const position = this.positions[this.currentIndex]
    const timestamp = position.timestamp

    this.options?.onPositionUpdate?.(position, timestamp)
  }

  /**
   * Retorna posições agrupadas por veículo
   */
  getPositionsByVehicle(): Map<
    string,
    Array<{ position: HistoricalPosition; index: number }>
  > {
    const grouped = new Map<
      string,
      Array<{ position: HistoricalPosition; index: number }>
    >()

    this.positions.forEach((pos, index) => {
      const vehicleId = pos.veiculo_id
      if (!grouped.has(vehicleId)) {
        grouped.set(vehicleId, [])
      }
      grouped.get(vehicleId)!.push({ position: pos, index })
    })

    return grouped
  }

  /**
   * Retorna timestamp mínimo e máximo
   */
  getTimeRange(): { min: Date; max: Date } | null {
    if (this.positions.length === 0) return null

    return {
      min: this.positions[0].timestamp,
      max: this.positions[this.positions.length - 1].timestamp,
    }
  }

  /**
   * Retorna progresso atual (0-1)
   */
  getProgress(): number {
    if (this.positions.length === 0) return 0
    return this.currentIndex / this.positions.length
  }

  /**
   * Retorna timestamp atual
   */
  getCurrentTimestamp(): Date | null {
    if (this.currentIndex >= this.positions.length) return null
    return this.positions[this.currentIndex].timestamp
  }

  /**
   * Getters
   */
  get playing(): boolean {
    return this.isPlaying && !this.isPaused
  }

  get paused(): boolean {
    return this.isPaused
  }

  get positionsCount(): number {
    return this.positions.length
  }
}

