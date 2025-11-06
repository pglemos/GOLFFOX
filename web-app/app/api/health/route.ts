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

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { 
          ok: false, 
          supabase: 'error',
          error: 'Supabase credentials not configured',
          ts: new Date().toISOString() 
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Teste simples de conexão
    const { error } = await supabase
      .from('companies')
      .select('id')
      .limit(1)

    const isOk = !error
    const status = isOk ? 200 : 500

    return NextResponse.json({
      ok: isOk,
      supabase: error ? 'error' : 'ok',
      error: error?.message || null,
      ts: new Date().toISOString()
    }, { status })
  } catch (error: any) {
    return NextResponse.json(
      { 
        ok: false, 
        supabase: 'error',
        error: error?.message || 'Unknown error',
        ts: new Date().toISOString() 
      },
      { status: 500 }
    )
  }
}

