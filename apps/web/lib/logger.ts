/**
 * Re-export do logger do core para compatibilidade com imports antigos
 * @/lib/logger -> @/lib/core/logger
 */

export {
  logger,
  debug,
  info,
  warn,
  error,
  logError,
  log,
  getLogs,
  clearLogs,
} from './core/logger'

