import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const runtime = 'nodejs'

export async function GET() {
  const eventId = Sentry.captureException(new Error('Sentry verification test'))
  await Sentry.flush(2000)
  return NextResponse.json({ ok: true, eventId })
}

