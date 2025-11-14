import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Health Check Endpoint
 * Verifica status da aplicação e conexão com Supabase
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseKey === 'anon-placeholder') {
      return NextResponse.json(
        { 
          status: 'ok',
          ok: true, 
          supabase: 'unconfigured',
          error: null,
          timestamp: new Date().toISOString() 
        },
        { status: 200 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Teste simples de conexão
    const { error } = await supabase
      .from('companies')
      .select('id')
      .limit(1)

    const isOk = !error
    const httpStatus = isOk ? 200 : 500

    return NextResponse.json({
      status: isOk ? 'ok' : 'error',
      ok: isOk,
      supabase: error ? 'error' : 'ok',
      error: error?.message || null,
      timestamp: new Date().toISOString()
    }, { status: httpStatus })
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'error',
        ok: false, 
        supabase: 'error',
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    )
  }
}

