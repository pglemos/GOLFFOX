import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
if (dsn) {
  const traces = parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_RATE || process.env.SENTRY_TRACES_RATE || '0.2')
  Sentry.init({
    dsn,
    tracesSampleRate: isNaN(traces) ? 0.2 : traces,
    environment: process.env.NODE_ENV || 'development',
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
