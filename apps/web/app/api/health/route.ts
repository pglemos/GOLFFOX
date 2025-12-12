import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const start = Date.now()
  let dbStatus = 'unknown'
  let dbError: string | null = null

  try {
    const { error } = await supabase.from('users').select('*', { count: 'exact', head: true })
    if (error) throw error
    dbStatus = 'healthy'
  } catch (err: unknown) {
    dbStatus = 'unhealthy'
    dbError = err instanceof Error ? err.message : 'Unknown error'
  }

  const duration = Date.now() - start

  return NextResponse.json(
    {
      status: dbStatus === 'healthy' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          latency: `${duration}ms`,
          error: dbError
        }
      },
      version: '1.0.0'
    },
    { status: dbStatus === 'healthy' ? 200 : 503 }
  )
}
