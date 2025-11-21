import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth, validateAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(req: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(req, 'transportadora')
    if (authErrorResponse) return authErrorResponse

    const user = await validateAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar transportadora_id do usuário
    const { data: userData } = await supabaseServiceRole
      .from('users')
      .select('transportadora_id')
      .eq('id', user.id)
      .single()

    if (!userData?.transportadora_id) {
      return NextResponse.json(
        { error: 'Usuário não está associado a uma transportadora' },
        { status: 403 }
      )
    }

    // Buscar alertas de vencimento
    const alertLevel = req.nextUrl.searchParams.get('alert_level') || 'critical,warning'
    const alertLevels = alertLevel.split(',')

    const { data, error } = await supabaseServiceRole
      .from('v_carrier_expiring_documents')
      .select('*')
      .eq('transportadora_id', userData.transportadora_id)
      .in('alert_level', alertLevels)
      .order('days_to_expiry', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar alertas', message: error.message },
        { status: 500 }
      )
    }

    // Estatísticas
    const stats = {
      total: data?.length || 0,
      critical: data?.filter(a => a.alert_level === 'critical').length || 0,
      warning: data?.filter(a => a.alert_level === 'warning').length || 0,
      expired: data?.filter(a => a.alert_level === 'expired').length || 0,
    }

    return NextResponse.json({
      alerts: data || [],
      stats
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: error.message },
      { status: 500 }
    )
  }
}

