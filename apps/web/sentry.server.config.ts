import * as Sentry from '@sentry/nextjs'

// ✅ FIX: Validar DSN antes de inicializar Sentry (server-side)
const dsn = process.env.SENTRY_DSN
const isValidDsn = dsn && 
                   dsn !== '__SET_IN_PRODUCTION__' && 
                   dsn !== 'YOUR_SENTRY_DSN' &&
                   dsn.startsWith('https://') &&
                   dsn.includes('ingest.sentry.io')

if (isValidDsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2'),
  })
} else if (dsn && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Sentry DSN inválido ou placeholder detectado (server). Sentry não será inicializado.')
}

