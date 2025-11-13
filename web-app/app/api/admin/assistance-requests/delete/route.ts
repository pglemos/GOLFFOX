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
    const requestId = searchParams.get('id')

    if (!requestId) {
      return NextResponse.json(
        { error: 'ID da solicitação é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    console.log(`🗑️ Tentando excluir solicitação de socorro: ${requestId}`)
    
    const { data, error } = await supabaseAdmin
      .from('gf_assistance_requests')
      .delete()
      .eq('id', requestId)
      .select()

    if (error) {
      console.error('❌ Erro ao excluir solicitação de socorro:', error)
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: 'Erro ao excluir solicitação de socorro', 
          message: error.message,
          details: error.details || error.hint || 'Sem detalhes adicionais',
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log(`✅ Solicitação de socorro excluída com sucesso: ${requestId}`, data)

    return NextResponse.json({
      success: true,
      message: 'Solicitação de socorro excluída com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao excluir solicitação de socorro:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir solicitação de socorro', message: error.message },
      { status: 500 }
    )
  }
}

