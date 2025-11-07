import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireCompanyAccess } from '@/lib/api-auth'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

/**
 * Criar ou atualizar agendamento de relatório
 * POST /api/reports/schedule
 * Body: { scheduleId?, companyId, reportKey, cron, recipients[], isActive }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { scheduleId, companyId, reportKey, cron, recipients, isActive = true } = body

    if (!companyId || !reportKey || !cron || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'companyId, reportKey, cron e recipients são obrigatórios' },
        { status: 400 }
      )
    }

    // ✅ Validar autenticação e acesso à empresa
    const { user, error: authError } = await requireCompanyAccess(request, companyId)
    if (authError) {
      return authError
    }

    // Validar formato cron básico (5 ou 6 campos)
    const cronParts = cron.trim().split(/\s+/)
    if (cronParts.length < 5 || cronParts.length > 6) {
      return NextResponse.json(
        { error: 'Formato cron inválido. Use: "minuto hora dia mês dia-semana" ou com ano' },
        { status: 400 }
      )
    }

    // Validar reportKey
    const validReportKeys = ['delays', 'occupancy', 'not_boarded', 'efficiency', 'driver_ranking']
    if (!validReportKeys.includes(reportKey)) {
      return NextResponse.json(
        { error: 'reportKey inválido' },
        { status: 400 }
      )
    }

    // Buscar usuário autenticado
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id || null
    }

    if (scheduleId) {
      // Atualizar agendamento existente
      const { data, error } = await supabase
        .from('gf_report_schedules')
        .update({
          company_id: companyId,
          report_key: reportKey,
          cron,
          recipients,
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduleId)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ schedule: data })
    } else {
      // Criar novo agendamento
      const { data, error } = await supabase
        .from('gf_report_schedules')
        .insert({
          company_id: companyId,
          report_key: reportKey,
          cron,
          recipients,
          is_active: isActive,
          created_by: userId
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ schedule: data }, { status: 201 })
    }
  } catch (error: any) {
    console.error('Erro ao agendar relatório:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao agendar relatório' },
      { status: 500 }
    )
  }
}

/**
 * Listar agendamentos
 * GET /api/reports/schedule?companyId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')

    let query = supabase
      .from('gf_report_schedules')
      .select('*')
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ schedules: data || [] })
  } catch (error: any) {
    console.error('Erro ao listar agendamentos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao listar agendamentos' },
      { status: 500 }
    )
  }
}

/**
 * Deletar agendamento
 * DELETE /api/reports/schedule?scheduleId=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'scheduleId é obrigatório' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('gf_report_schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao deletar agendamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar agendamento' },
      { status: 500 }
    )
  }
}

