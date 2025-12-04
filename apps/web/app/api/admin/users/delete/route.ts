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

// Aceitar tanto DELETE quanto POST para compatibilidade
export async function DELETE(request: NextRequest) {
  return handleDelete(request)
}

export async function POST(request: NextRequest) {
  return handleDelete(request)
}

async function handleDelete(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    // Aceitar tanto query param quanto body
    const { searchParams } = new URL(request.url)
    let userId = searchParams.get('id')
    
    // Se não estiver na query, tentar no body
    if (!userId) {
      try {
        const body = await request.json()
        userId = body.id || body.user_id
      } catch (e) {
        // Body vazio ou inválido, continuar com null
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Excluir permanentemente o usuário do banco de dados
    // A tabela users tem referência a auth.users com ON DELETE CASCADE,
    // então excluir da tabela users também excluirá do Auth automaticamente
    // As foreign keys com ON DELETE CASCADE vão excluir automaticamente dados relacionados
    
    logger.log(`🗑️ Tentando excluir usuário: ${userId}`)
    
    // Primeiro, setar driver_id para NULL em trips se o usuário for motorista
    await supabaseAdmin
      .from('trips')
      .update({ driver_id: null })
      .eq('driver_id', userId)
    
    // Agora excluir o usuário
    const { data, error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)
      .select()

    if (error) {
      console.error('❌ Erro ao excluir usuário:', error)
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: 'Erro ao excluir usuário', 
          message: error.message,
          details: error.details || error.hint || 'Sem detalhes adicionais',
          code: error.code
        },
        { status: 500 }
      )
    }

    logger.log(`✅ Usuário excluído com sucesso: ${userId}`, data)

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir usuário', message: error.message },
      { status: 500 }
    )
  }
}

