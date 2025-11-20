import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

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

export async function GET(
  req: NextRequest,
  { params }: { params: { carrierId: string } }
) {
  try {
    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { data, error } = await supabaseServiceRole
      .from('users')
      .select('*')
      .eq('carrier_id', params.carrierId)
      .eq('role', 'carrier')
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar usuários', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: data || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição', message: error.message },
      { status: 500 }
    )
  }
}

