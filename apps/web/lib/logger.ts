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
export const log = logger.log
export const debug = logger.debug
export const info = logger.info
export const warn = logger.warn
export const error = logger.error

// Alias comum para error
export const logError = logger.error