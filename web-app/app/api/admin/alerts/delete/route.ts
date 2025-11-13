import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

export async function DELETE(request: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse && !isDevelopment) {
      return authErrorResponse
    }
    if (authErrorResponse && isDevelopment) {
      console.warn('⚠️ Autenticação falhou em desenvolvimento, mas continuando...')
    }

    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json(
        { error: 'ID do alerta é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    console.log(`🗑️ Tentando excluir alerta: ${alertId}`)
    
    const { data, error } = await supabaseAdmin
      .from('gf_incidents')
      .delete()
      .eq('id', alertId)
      .select()

    if (error) {
      console.error('❌ Erro ao excluir alerta:', error)
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: 'Erro ao excluir alerta', 
          message: error.message,
          details: error.details || error.hint || 'Sem detalhes adicionais',
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log(`✅ Alerta excluído com sucesso: ${alertId}`, data)

    return NextResponse.json({
      success: true,
      message: 'Alerta excluído com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao excluir alerta:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir alerta', message: error.message },
      { status: 500 }
    )
  }
}

