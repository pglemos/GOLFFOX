import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function DELETE(req: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) return authErrorResponse

    const carrierId = req.nextUrl.searchParams.get('id')
    if (!carrierId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se a transportadora existe
    const { data: carrier, error: carrierError } = await supabaseServiceRole
      .from('carriers')
      .select('id, name')
      .eq('id', carrierId)
      .single()

    if (carrierError || !carrier) {
      return NextResponse.json(
        { success: false, error: 'Transportadora não encontrada', message: carrierError?.message },
        { status: 404 }
      )
    }

    // 1. Remover referências de users (setar transportadora_id como NULL)
    const { error: usersError } = await supabaseServiceRole
      .from('users')
      .update({ transportadora_id: null })
      .eq('transportadora_id', carrierId)

    if (usersError) {
      console.error('Erro ao atualizar users:', usersError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao remover referências de usuários', 
          message: usersError.message,
          details: 'Não foi possível atualizar os usuários relacionados à transportadora'
        },
        { status: 500 }
      )
    }

    // 2. Remover referências de vehicles (setar transportadora_id como NULL)
    const { error: vehiclesError } = await supabaseServiceRole
      .from('vehicles')
      .update({ transportadora_id: null })
      .eq('transportadora_id', carrierId)

    if (vehiclesError) {
      console.error('Erro ao atualizar vehicles:', vehiclesError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao remover referências de veículos', 
          message: vehiclesError.message,
          details: 'Não foi possível atualizar os veículos relacionados à transportadora'
        },
        { status: 500 }
      )
    }

    // 3. Excluir rotas relacionadas (routes.transportadora_id é NOT NULL, então precisamos excluir)
    const { error: routesError } = await supabaseServiceRole
      .from('routes')
      .delete()
      .eq('transportadora_id', carrierId)

    if (routesError) {
      console.error('Erro ao excluir routes:', routesError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao excluir rotas relacionadas', 
          message: routesError.message,
          details: 'Não foi possível excluir as rotas relacionadas à transportadora'
        },
        { status: 500 }
      )
    }

    // 4. Verificar se há outras tabelas com referências (ex: costs, se existir)
    try {
      const { data: costsData, error: costsCheckError } = await supabaseServiceRole
        .from('costs')
        .select('id')
        .eq('transportadora_id', carrierId)
        .limit(1)

      // Se a tabela existir e houver registros, remover referências
      if (!costsCheckError && costsData && costsData.length > 0) {
        const { error: costsError } = await supabaseServiceRole
          .from('costs')
          .update({ carrier_id: null })
          .eq('transportadora_id', carrierId)

        if (costsError) {
          console.warn('Aviso ao atualizar costs (pode não existir):', costsError)
          // Não falhar se a tabela não existir ou não tiver a coluna
        }
      }
    } catch (costsError: any) {
      // Ignorar erros relacionados à tabela costs (pode não existir)
      console.warn('Tabela costs não encontrada ou sem coluna transportadora_id, continuando...')
    }

    // 5. Agora podemos excluir a transportadora
    const { error: deleteError } = await supabaseServiceRole
      .from('carriers')
      .delete()
      .eq('id', carrierId)

    if (deleteError) {
      console.error('Erro ao excluir carrier:', deleteError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao excluir transportadora', 
          message: deleteError.message,
          details: 'As referências foram removidas, mas houve erro ao excluir a transportadora'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Transportadora excluída com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao processar exclusão de transportadora:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição', message: error.message },
      { status: 500 }
    )
  }
}

