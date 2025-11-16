import * as Sentry from '@sentry/nextjs'

// ✅ FIX: Validar DSN antes de inicializar Sentry
// Ignorar valores placeholder comuns
const dsn = process.env.SENTRY_DSN
const isValidDsn = dsn && 
                   dsn !== '__SET_IN_PRODUCTION__' && 
                   dsn !== 'YOUR_SENTRY_DSN' &&
                   dsn.startsWith('https://') &&
                   dsn.includes('ingest.sentry.io')

if (isValidDsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    replaysSessionSampleRate: Number(process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.05'),
    replaysOnErrorSampleRate: Number(process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '0.5'),
  })
} else if (dsn) {
  console.warn('⚠️ Sentry DSN inválido ou placeholder detectado. Sentry não será inicializado.')
}

