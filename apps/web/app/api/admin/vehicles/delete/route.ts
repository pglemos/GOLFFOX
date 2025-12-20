import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { logger, logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
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
    // - trips.veiculo_id tem ON DELETE SET NULL, mas precisamos setar manualmente para evitar erro
    // - Outras tabelas com CASCADE serão excluídas automaticamente
    
    logger.log(`🗑️ Tentando excluir veículo: ${vehicleId}`)
    
    // Primeiro, setar veiculo_id para NULL em trips (mesmo que seja SET NULL, fazemos explicitamente)
    await supabaseAdmin
      .from('trips')
      .update({ veiculo_id: null })
      .eq('veiculo_id', vehicleId)
    
    // Agora excluir o veículo
    const { data, error } = await supabaseAdmin
      .from('veiculos')
      .delete()
      .eq('id', vehicleId)
      .select()

    if (error) {
      logError('Erro ao excluir veículo', { error, vehicleId, errorDetails: JSON.stringify(error, null, 2) }, 'VehiclesDeleteAPI')
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

    // Invalidar cache após exclusão
    await invalidateEntityCache('veiculo', vehicleId)

    logger.log(`✅ Veículo excluído com sucesso: ${vehicleId}`, data)

    return NextResponse.json({
      success: true,
      message: 'Veículo excluído com sucesso'
    })
  } catch (error: any) {
    logError('Erro ao excluir veículo', { error, vehicleId: request.nextUrl.searchParams.get('id') }, 'VehiclesDeleteAPI')
    return NextResponse.json(
      { error: 'Erro ao excluir veículo', message: error.message },
      { status: 500 }
    )
  }
}

