import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logError, debug } from '@/lib/logger'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

// GET - Buscar alertas escalados
export async function GET(request: NextRequest) {
  try {
    // Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Opcional: filtrar por status

    let query = supabaseAdmin
      .from('gf_escalated_alerts')
      .select('*')
      .order('created_at', { ascending: false })

    // Filtrar por status se fornecido
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      logError('Erro ao buscar alertas escalados', { error }, 'escalated-alerts-api')
      return NextResponse.json(
        { error: 'Erro ao buscar alertas escalados', details: error.message },
        { status: 500 }
      )
    }

    debug('Alertas escalados buscados', { count: data?.length || 0 }, 'escalated-alerts-api')

    return NextResponse.json({ alerts: data || [] }, { status: 200 })
  } catch (error: any) {
    logError('Exceção ao buscar alertas escalados', { error }, 'escalated-alerts-api')
    return NextResponse.json(
      { error: 'Erro interno ao buscar alertas escalados', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Criar novo alerta escalado
export async function POST(request: NextRequest) {
  try {
    // Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const body = await request.json()
    const {
      type,
      severity,
      title,
      message,
      source,
      source_id,
      source_name,
      status = 'pending'
    } = body

    // Validação
    if (!type || !severity || !title || !message || !source || !source_name) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('gf_escalated_alerts')
      .insert({
        type,
        severity,
        title,
        message,
        source,
        source_id,
        source_name,
        status
      })
      .select()
      .single()

    if (error) {
      logError('Erro ao criar alerta escalado', { error }, 'escalated-alerts-api')
      return NextResponse.json(
        { error: 'Erro ao criar alerta escalado', details: error.message },
        { status: 500 }
      )
    }

    debug('Alerta escalado criado', { id: data.id }, 'escalated-alerts-api')

    return NextResponse.json({ alert: data }, { status: 201 })
  } catch (error: any) {
    logError('Exceção ao criar alerta escalado', { error }, 'escalated-alerts-api')
    return NextResponse.json(
      { error: 'Erro interno ao criar alerta escalado', details: error.message },
      { status: 500 }
    )
  }
}

