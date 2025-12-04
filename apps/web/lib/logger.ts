/**
 * Logger condicional baseado em NODE_ENV
 * Logs de debug/info/warn só aparecem em desenvolvimento
 * Erros sempre são logados (críticos para produção)
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  /**
   * Log geral - apenas em desenvolvimento
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },

  /**
   * Log de informação - apenas em desenvolvimento
   */
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  /**
   * Log de aviso - apenas em desenvolvimento
   */
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  /**
   * Log de erro - sempre loga (crítico para produção)
   */
  error: (...args: unknown[]): void => {
    console.error(...args)
  },
}

// Exportações nomeadas para compatibilidade com importações diretas
// Nota: log() é exportado abaixo com assinatura diferente (level, message, data)
export const debug = logger.debug
export const info = logger.info
export const warn = logger.warn
export const error = logger.error

// Alias comum para error
export const logError = logger.error

// Sistema de armazenamento de logs para requisições
type LogEntry = {
  level: string
  message: string
  data?: unknown
  timestamp: string
}

// Armazenamento de logs em memória (por requisição no Edge Runtime)
// Nota: No Edge Runtime, cada requisição tem seu próprio contexto,
// então este array será limpo automaticamente entre requisições
const logs: LogEntry[] = []

/**
 * Função log com formato (level, message, data) para compatibilidade
 * com generate-stops/route.ts
 */
export function log(level: string, message: string, data?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  }
  
  // Adicionar ao array de logs
  logs.push(entry)
  
  // Também logar no console conforme o nível
  const logMessage = `[${level.toUpperCase()}] ${message}${data ? ` ${JSON.stringify(data)}` : ''}`
  
  switch (level.toLowerCase()) {
    case 'debug':
      logger.debug(logMessage)
      break
    case 'info':
      logger.info(logMessage)
      break
    case 'warn':
      logger.warn(logMessage)
      break
    case 'error':
      logger.error(logMessage)
      break
    default:
      logger.log(logMessage)
  }
}

/**
 * Retorna todos os logs armazenados
 */
export function getLogs(): LogEntry[] {
  return [...logs] // Retorna cópia para evitar mutação externa
}

/**
 * Limpa todos os logs armazenados
 */
export function clearLogs(): void {
  logs.length = 0
}