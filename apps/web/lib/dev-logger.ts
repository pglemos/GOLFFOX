/**
 * Development Logger
 * 
 * Sistema de logging melhorado para desenvolvimento
 * Fornece formatação colorida e estruturada para melhor DX
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success'

interface LogOptions {
  context?: Record<string, any>
  group?: string
  timestamp?: boolean
}

class DevLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
  }

  private formatTimestamp(): string {
    return new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
  }

  private formatContext(context?: Record<string, any>): string {
    if (!context || Object.keys(context).length === 0) return ''
    return ` ${this.colors.dim}${JSON.stringify(context, null, 2)}${this.colors.reset}`
  }

  private log(
    level: LogLevel,
    message: string,
    options: LogOptions = {}
  ): void {
    if (!this.isDevelopment) return

    const { context, group, timestamp = true } = options
    const time = timestamp ? `[${this.formatTimestamp()}] ` : ''
    const groupPrefix = group ? `[${group}] ` : ''
    const contextStr = this.formatContext(context)

    let color = this.colors.reset
    let prefix = ''

    switch (level) {
      case 'error':
        color = this.colors.red
        prefix = '❌ ERROR'
        break
      case 'warn':
        color = this.colors.yellow
        prefix = '⚠️  WARN'
        break
      case 'success':
        color = this.colors.green
        prefix = '✅ SUCCESS'
        break
      case 'debug':
        color = this.colors.cyan
        prefix = '🔍 DEBUG'
        break
      default:
        color = this.colors.blue
        prefix = 'ℹ️  INFO'
    }

    const formatted = `${time}${color}${prefix}${this.colors.reset} ${groupPrefix}${message}${contextStr}`

    switch (level) {
      case 'error':
        console.error(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      default:
        console.log(formatted)
    }
  }

  info(message: string, options?: LogOptions): void {
    this.log('info', message, options)
  }

  success(message: string, options?: LogOptions): void {
    this.log('success', message, options)
  }

  warn(message: string, options?: LogOptions): void {
    this.log('warn', message, options)
  }

  error(message: string, options?: LogOptions): void {
    this.log('error', message, options)
  }

  debug(message: string, options?: LogOptions): void {
    this.log('debug', message, options)
  }

  /**
   * Log de request HTTP
   */
  request(method: string, url: string, options?: LogOptions): void {
    this.info(`${method} ${url}`, {
      ...options,
      group: 'HTTP',
      context: {
        method,
        url,
        ...options?.context,
      },
    })
  }

  /**
   * Log de response HTTP
   */
  response(status: number, url: string, time?: number, options?: LogOptions): void {
    const statusColor = status >= 400 ? this.colors.red : status >= 300 ? this.colors.yellow : this.colors.green
    const timeStr = time ? ` (${time}ms)` : ''
    
    this.info(`${statusColor}${status}${this.colors.reset} ${url}${timeStr}`, {
      ...options,
      group: 'HTTP',
      context: {
        status,
        url,
        time,
        ...options?.context,
      },
    })
  }

  /**
   * Log de cache
   */
  cache(type: 'hit' | 'miss' | 'set' | 'invalidate', key: string, options?: LogOptions): void {
    const emoji = type === 'hit' ? '💾' : type === 'miss' ? '🔍' : type === 'set' ? '💿' : '🗑️'
    this.debug(`${emoji} Cache ${type}: ${key}`, {
      ...options,
      group: 'CACHE',
      context: {
        type,
        key,
        ...options?.context,
      },
    })
  }

  /**
   * Log de performance
   */
  performance(operation: string, time: number, options?: LogOptions): void {
    const color = time > 1000 ? this.colors.red : time > 500 ? this.colors.yellow : this.colors.green
    this.debug(`⚡ ${operation}: ${color}${time}ms${this.colors.reset}`, {
      ...options,
      group: 'PERF',
      context: {
        operation,
        time,
        ...options?.context,
      },
    })
  }

  /**
   * Agrupar logs relacionados
   */
  group(name: string, callback: () => void): void {
    if (!this.isDevelopment) {
      callback()
      return
    }

    console.group(`📦 ${name}`)
    try {
      callback()
    } finally {
      console.groupEnd()
    }
  }
}

// Singleton
export const devLogger = new DevLogger()

// Exportar tipos
export type { LogLevel, LogOptions }

