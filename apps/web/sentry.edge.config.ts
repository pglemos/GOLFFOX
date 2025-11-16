import * as Sentry from '@sentry/nextjs'

// ✅ FIX: Validar DSN antes de inicializar Sentry (edge runtime)
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
}

