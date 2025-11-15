import * as Sentry from '@sentry/nextjs'

export async function register() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  const traces = parseFloat(process.env.SENTRY_TRACES_RATE || '0.2')
  Sentry.init({
    dsn,
    tracesSampleRate: isNaN(traces) ? 0.2 : traces,
    environment: process.env.NODE_ENV || 'development',
  })
}
