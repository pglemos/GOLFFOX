/**
 * Build Logger
 * 
 * Sistema de logging estruturado para builds do Next.js
 * Fornece informações detalhadas sobre performance e problemas de build
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
}

class BuildLogger {
  private logs: LogEntry[] = []
  private startTime: number = Date.now()

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private addLog(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }
    this.logs.push(entry)

    // Log para console também
    const formatted = this.formatMessage(level, message, context)
    switch (level) {
      case 'error':
        console.error(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(formatted)
        }
        break
      default:
        console.log(formatted)
    }
  }

  info(message: string, context?: Record<string, any>): void {
    this.addLog('info', message, context)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.addLog('warn', message, context)
  }

  error(message: string, context?: Record<string, any>): void {
    this.addLog('error', message, context)
  }

  debug(message: string, context?: Record<string, any>): void {
    this.addLog('debug', message, context)
  }

  /**
   * Log de início de build
   */
  startBuild(): void {
    this.startTime = Date.now()
    this.info('Build iniciado', {
      nodeEnv: process.env.NODE_ENV,
      nextVersion: process.env.NEXT_VERSION,
    })
  }

  /**
   * Log de fim de build com estatísticas
   */
  endBuild(stats?: {
    totalTime?: number
    pages?: number
    errors?: number
    warnings?: number
  }): void {
    const buildTime = Date.now() - this.startTime
    this.info('Build finalizado', {
      buildTime: `${buildTime}ms`,
      ...stats,
    })
  }

  /**
   * Log de performance de módulo
   */
  logModulePerformance(module: string, time: number): void {
    this.debug(`Módulo processado: ${module}`, {
      module,
      time: `${time}ms`,
    })
  }

  /**
   * Log de cache hit/miss
   */
  logCache(cacheType: 'hit' | 'miss', key: string): void {
    this.debug(`Cache ${cacheType}`, {
      cacheType,
      key,
    })
  }

  /**
   * Obter todos os logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * Obter logs por nível
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  /**
   * Limpar logs
   */
  clear(): void {
    this.logs = []
  }

  /**
   * Exportar logs como JSON
   */
  export(): string {
    return JSON.stringify(
      {
        buildTime: Date.now() - this.startTime,
        logs: this.logs,
      },
      null,
      2
    )
  }
}

// Singleton
export const buildLogger = new BuildLogger()

// Exportar tipos
export type { LogLevel, LogEntry }

