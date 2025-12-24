import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { logError } from '@/lib/logger'
import { supabaseServiceRole } from '@/lib/supabase-server'

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
    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) return authErrorResponse

    // Selecionar apenas colunas principais usadas
    const { data, error } = await (supabaseServiceRole
      .from('transportadoras')
      .select('id, name, cnpj, email, phone, contact_person, address, address_city, address_state, address_zip_code, is_active, created_at, updated_at')
      .order('name', { ascending: true }))

    if (error) {
      logError('Erro ao buscar transportadoras', { error }, 'TransportadorasListAPI')
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar transportadoras', message: error.message },
        { status: 500 }
      )
    }

    return successResponse(data || [])
  } catch (err) {
    return errorResponse(err, 500, 'Erro ao processar requisição')
  }
}

