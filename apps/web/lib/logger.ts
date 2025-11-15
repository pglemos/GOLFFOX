export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogEntry = {
  ts: string
  level: LogLevel
  message: string
  meta?: Record<string, unknown>
  context?: string
}

const buffer: LogEntry[] = []
const MAX_BUFFER_SIZE = 1000

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Sistema de logging centralizado
 * Em produção: apenas erros e warnings são logados
 * Em desenvolvimento: todos os logs são exibidos
 */
class Logger {
  private sanitize(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!meta) return meta
    const sensitiveKeys = [
      'password', 'token', 'authorization', 'accessToken', 'refreshToken',
      'api_key', 'apikey', 'secret', 'jwt', 'session', 'cpf', 'cnpj'
    ]
    const redacted: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(meta)) {
      // Normalizar objetos Error para não perder mensagem/stack no console
      const normalized = v instanceof Error ? { name: v.name, message: v.message, stack: v.stack } : v
      if (sensitiveKeys.some(sk => k.toLowerCase().includes(sk))) {
        redacted[k] = '[REDACTED]'
      } else {
        redacted[k] = normalized
      }
    }
    return redacted
  }
  private shouldLog(level: LogLevel): boolean {
    if (isProduction) {
      return level === 'error' || level === 'warn'
    }
    return true
  }

  private addToBuffer(entry: LogEntry): void {
    buffer.push(entry)
    // Limitar tamanho do buffer
    if (buffer.length > MAX_BUFFER_SIZE) {
      buffer.shift()
    }
  }

  private formatMessage(context: string | undefined, message: string): string {
    return context ? `[${context}] ${message}` : message
  }

  log(level: LogLevel, message: string, meta?: Record<string, unknown>, context?: string): void {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      message,
      meta: this.sanitize(meta),
      context,
    }

    this.addToBuffer(entry)

    if (!this.shouldLog(level)) {
      return
    }

    const formattedMessage = this.formatMessage(context, message)

    switch (level) {
      case 'error':
        console.error(formattedMessage, entry.meta || '')
        this.sendToWebhook(entry)
        break
      case 'warn':
        console.warn(formattedMessage, entry.meta || '')
        break
      case 'info':
        console.info(formattedMessage, entry.meta || '')
        break
      case 'debug':
        if (isDevelopment) {
          console.debug(formattedMessage, entry.meta || '')
        }
        break
    }
  }

  private sendToWebhook(entry: LogEntry): void {
    const url = process.env.NEXT_PUBLIC_ERROR_WEBHOOK_URL
    if (!url) return

    try {
      // Fire and forget - não bloquear execução
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {
        // Silenciosamente ignorar erros de webhook
      })
    } catch {
      // Silenciosamente ignorar erros
    }
  }

  debug(message: string, meta?: Record<string, unknown>, context?: string): void {
    this.log('debug', message, meta, context)
  }

  info(message: string, meta?: Record<string, unknown>, context?: string): void {
    this.log('info', message, meta, context)
  }

  warn(message: string, meta?: Record<string, unknown>, context?: string): void {
    this.log('warn', message, meta, context)
  }

  error(message: string, meta?: Record<string, unknown>, context?: string): void {
    this.log('error', message, meta, context)
  }
}

const logger = new Logger()

// Funções de conveniência
export function log(level: LogLevel, message: string, meta?: Record<string, unknown>, context?: string): void {
  logger.log(level, message, meta, context)
}

export function debug(message: string, meta?: Record<string, unknown>, context?: string): void {
  logger.debug(message, meta, context)
}

export function info(message: string, meta?: Record<string, unknown>, context?: string): void {
  logger.info(message, meta, context)
}

export function warn(message: string, meta?: Record<string, unknown>, context?: string): void {
  logger.warn(message, meta, context)
}

export function error(message: string, meta?: Record<string, unknown>, context?: string): void {
  logger.error(message, meta, context)
}

export function getLogs(): LogEntry[] {
  return buffer.slice()
}

export function clearLogs(): void {
  buffer.length = 0
}

// Exportar logger para uso avançado
export { logger }
