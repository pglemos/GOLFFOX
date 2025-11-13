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
    const vehicleId = searchParams.get('id')

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'ID do veículo é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Excluir permanentemente o veículo do banco de dados
    // Primeiro, precisamos tratar as foreign keys:
    // - trips.vehicle_id tem ON DELETE SET NULL, mas precisamos setar manualmente para evitar erro
    // - Outras tabelas com CASCADE serão excluídas automaticamente
    
    console.log(`🗑️ Tentando excluir veículo: ${vehicleId}`)
    
    // Primeiro, setar vehicle_id para NULL em trips (mesmo que seja SET NULL, fazemos explicitamente)
    await supabaseAdmin
      .from('trips')
      .update({ vehicle_id: null })
      .eq('vehicle_id', vehicleId)
    
    // Agora excluir o veículo
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .select()

    if (error) {
      console.error('❌ Erro ao excluir veículo:', error)
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: 'Erro ao excluir veículo', 
          message: error.message,
          details: error.details || error.hint || 'Sem detalhes adicionais',
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log(`✅ Veículo excluído com sucesso: ${vehicleId}`, data)

    return NextResponse.json({
      success: true,
      message: 'Veículo excluído com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao excluir veículo:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir veículo', message: error.message },
      { status: 500 }
    )
  }
}

