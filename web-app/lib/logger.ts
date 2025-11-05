export type LogEntry = {
  ts: string
  level: 'info' | 'warn' | 'error'
  message: string
  meta?: Record<string, any>
}

const buffer: LogEntry[] = []

export function log(level: LogEntry['level'], message: string, meta?: Record<string, any>) {
  const entry: LogEntry = { ts: new Date().toISOString(), level, message, meta }
  buffer.push(entry)
  if (level === 'error') console.error('[GEN-STOPS]', message, meta || '')
  else if (level === 'warn') console.warn('[GEN-STOPS]', message, meta || '')
  else console.log('[GEN-STOPS]', message, meta || '')

  // Notificar canal de erros (webhook) se configurado
  if (level === 'error') {
    const url = process.env.NEXT_PUBLIC_ERROR_WEBHOOK_URL
    if (url) {
      try {
        // Fire and forget
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        }).catch(() => {})
      } catch {}
    }
  }
}

export function getLogs() { return buffer.slice() }
export function clearLogs() { buffer.length = 0 }
