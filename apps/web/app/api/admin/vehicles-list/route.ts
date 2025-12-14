import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { logger } from '@/lib/logger'

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
    // Validar autenticação (apenas admin) - mas permitir em desenvolvimento
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Buscar veículos com relacionamento carriers via transportadora_id
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .select('*, carriers:transportadora_id(id, name)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar veículos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar veículos', message: error.message },
        { status: 500 }
      )
    }

    // Mapear para incluir carrier_name de forma plana
    const vehiclesWithCarrier = (data || []).map((v: any) => ({
      ...v,
      carrier_name: v.carriers?.name || null,
      carriers: undefined  // Remover objeto aninhado para manter resposta limpa
    }))

    // Retornar array com carrier_name mapeado
    return NextResponse.json(vehiclesWithCarrier)
  } catch (error: any) {
    console.error('Erro ao listar veículos:', error)
    return NextResponse.json(
      { error: 'Erro ao listar veículos', message: error.message },
      { status: 500 }
    )
  }
}
