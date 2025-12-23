import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Buscar todas as opções em paralelo
    const [routesRes, vehiclesRes, driversRes, carriersRes] = await Promise.all([
      supabaseAdmin.from('routes').select('id, name').order('name'),
      supabaseAdmin.from('veiculos').select('id, plate').order('plate'),
      supabaseAdmin.from('users').select('id, email').eq('role', 'motorista').order('email'),
      supabaseAdmin.from('transportadoras').select('id, name').order('name')
    ])

    return NextResponse.json({
      success: true,
      routes: routesRes.data || [],
      veiculos: vehiclesRes.data || [],
      motoristas: driversRes.data || [],
      carriers: carriersRes.data || []
    })
  } catch (error: unknown) {
    logError('Erro ao buscar opções de custos', { error }, 'CostsOptionsAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao buscar opções de custos', message: errorMessage },
      { status: 500 }
    )
  }
}

