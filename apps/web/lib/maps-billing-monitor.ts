/**
 * Monitor de Billing do Google Maps
 * Monitora uso da API e alerta quando quota excedida
 */

export interface MapsBillingStatus {
  usage: number
  quota: number
  percentage: number
  status: 'ok' | 'warning' | 'critical' | 'exceeded'
  alerts: BillingAlert[]
}

export interface BillingAlert {
  level: 'warning' | 'critical'
  threshold: number
  message: string
  timestamp: string
}

const QUOTA_THRESHOLDS = {
  WARNING: 0.7, // 70%
  CRITICAL: 0.85, // 85%
  EXCEEDED: 0.95, // 95%
}

// Simular quota (em produção, buscar de API do Google Cloud Billing)
const DEFAULT_QUOTA = 100000 // Requisições por mês

/**
 * Monitor de billing do Google Maps
 */
export class MapsBillingMonitor {
  private usage: number = 0
  private quota: number = DEFAULT_QUOTA
  private alerts: BillingAlert[] = []
  private listeners: ((status: MapsBillingStatus) => void)[] = []

  constructor(quota: number = DEFAULT_QUOTA) {
    this.quota = quota
    this.loadUsage()
  }

  /**
   * Carrega uso atual (simulado, em produção buscar de API)
   */
  private loadUsage(): void {
    try {
      const stored = localStorage.getItem('gmaps_billing_usage')
      if (stored) {
        const data = JSON.parse(stored)
        // Reset mensal se necessário
        const lastReset = new Date(data.lastReset || 0)
        const now = new Date()
        if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
          this.usage = 0
          this.saveUsage()
        } else {
          this.usage = data.usage || 0
        }
      }
    } catch (error) {
      console.error('Erro ao carregar uso do Maps:', error)
    }
  }

  /**
   * Salva uso atual
   */
  private saveUsage(): void {
    try {
      localStorage.setItem('gmaps_billing_usage', JSON.stringify({
        usage: this.usage,
        lastReset: new Date().toISOString(),
      }))
    } catch (error) {
      console.error('Erro ao salvar uso do Maps:', error)
    }
  }

  /**
   * Incrementa contador de uso
   */
  incrementUsage(count: number = 1): void {
    this.usage += count
    this.saveUsage()
    this.checkAlerts()
    this.notifyListeners()
  }

  /**
   * Verifica alertas baseado nos thresholds
   */
  private checkAlerts(): void {
    const percentage = this.usage / this.quota
    this.alerts = []

    if (percentage >= QUOTA_THRESHOLDS.EXCEEDED) {
      this.alerts.push({
        level: 'critical',
        threshold: QUOTA_THRESHOLDS.EXCEEDED * 100,
        message: `Quota do Google Maps excedida em ${(percentage * 100).toFixed(1)}%!`,
        timestamp: new Date().toISOString(),
      })
    } else if (percentage >= QUOTA_THRESHOLDS.CRITICAL) {
      this.alerts.push({
        level: 'critical',
        threshold: QUOTA_THRESHOLDS.CRITICAL * 100,
        message: `Quota do Google Maps em ${(percentage * 100).toFixed(1)}%! Quase no limite.`,
        timestamp: new Date().toISOString(),
      })
    } else if (percentage >= QUOTA_THRESHOLDS.WARNING) {
      this.alerts.push({
        level: 'warning',
        threshold: QUOTA_THRESHOLDS.WARNING * 100,
        message: `Quota do Google Maps em ${(percentage * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Obtém status atual
   */
  getStatus(): MapsBillingStatus {
    const percentage = this.usage / this.quota
    let status: MapsBillingStatus['status'] = 'ok'

    if (percentage >= QUOTA_THRESHOLDS.EXCEEDED) {
      status = 'exceeded'
    } else if (percentage >= QUOTA_THRESHOLDS.CRITICAL) {
      status = 'critical'
    } else if (percentage >= QUOTA_THRESHOLDS.WARNING) {
      status = 'warning'
    }

    return {
      usage: this.usage,
      quota: this.quota,
      percentage,
      status,
      alerts: this.alerts,
    }
  }

  /**
   * Verifica se quota foi excedida
   */
  isQuotaExceeded(): boolean {
    return this.usage >= this.quota * QUOTA_THRESHOLDS.EXCEEDED
  }

  /**
   * Adiciona listener para mudanças de status
   */
  addListener(listener: (status: MapsBillingStatus) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * Notifica listeners
   */
  private notifyListeners(): void {
    const status = this.getStatus()
    this.listeners.forEach(listener => listener(status))
  }

  /**
   * Reseta uso (útil para testes)
   */
  resetUsage(): void {
    this.usage = 0
    this.alerts = []
    this.saveUsage()
    this.notifyListeners()
  }
}

// Instância global
let billingMonitor: MapsBillingMonitor | null = null

/**
 * Obtém instância do monitor de billing
 */
export function getMapsBillingMonitor(quota?: number): MapsBillingMonitor {
  if (!billingMonitor) {
    billingMonitor = new MapsBillingMonitor(quota)
  }
  return billingMonitor
}

