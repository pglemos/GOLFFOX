import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  // Validar secret de cron (Vercel Cron)
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET não configurado' },
      { status: 500 }
    )
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Executar refresh da materialized view
    const { error } = await supabaseServiceRole.rpc('refresh_mv_costs_monthly')
    
    if (error) {
      console.error('Erro ao atualizar MV de custos:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      refreshed_at: new Date().toISOString() 
    })
  } catch (error: any) {
    console.error('Erro ao executar refresh_mv_costs_monthly:', error)
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

