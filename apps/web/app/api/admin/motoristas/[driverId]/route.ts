import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { logError } from '@/lib/logger'
import { UserService } from '@/lib/services/server/user-service'
import { getSupabaseAdmin } from '@/lib/supabase-client'

// PUT /api/admin/motoristas/[driverId] - Editar motorista
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ driverId: string }> }
) {
  // Verificar autenticação admin
  const authError = await requireAuth(request, 'admin')
  if (authError) return authError

  try {
    const { driverId } = await context.params
    const body = await request.json()

    const {
      name,
      email,
      phone,
      transportadora_id,
      cpf,
      cnh,
      cnh_category,
      cnh_expiry,
      is_active,
      address_zip_code,
      address_street,
      address_number,
      address_neighborhood,
      address_complement,
      address_city,
      address_state
    } = body

    if (!name) {
      return errorResponse({ message: 'Nome é obrigatório' }, 400)
    }

    // Usar UserService para atualizar
    const updatedMotorista = await UserService.updateUser(driverId, {
      name,
      email,
      phone,
      transportadora_id: transportadora_id || null,
      cpf,
      cnh,
      cnh_category,
      // cnh_expiry: cnh_expiry, // UserService ainda não suporta cnh_expiry na tipagem padrão, podemos adicionar ou tratar separado
      is_active,
      address_zip_code,
      address_street,
      address_number,
      address_neighborhood,
      address_complement,
      address_city,
      address_state
    })

    // Se houver campos não suportados pelo UserService padrão (como cnh_expiry), atualizar manualmente se necessário.
    // Mas notei que cnh_expiry só aparece aqui na rota, não vi no Crate. Vou manter a consistência.
    if (cnh_expiry) {
      const supabase = getSupabaseAdmin()
      await supabase.from('users').update({ cnh_expiry }).eq('id', driverId)
    }

    // Invalidação de cache já é feita no UserService

    return successResponse({ motorista: { ...updatedMotorista, cnh_expiry } })
  } catch (error: any) {
    logError('Erro na API de atualizar motorista', { error, driverId: (await context.params).driverId }, 'DriversUpdateAPI')
    return errorResponse(error, 500, 'Erro ao atualizar motorista')
  }
}

// GET /api/admin/motoristas/[driverId] - Obter motorista específico
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ driverId: string }> }
) {
  // Verificar autenticação admin
  const authError = await requireAuth(request, 'admin')
  if (authError) return authError

  try {
    const supabase = getSupabaseAdmin()
    const { driverId } = await context.params

    // Buscar motorista da tabela users
    const { data: motorista, error } = await supabase
      .from('users')
      .select('*, carriers:transportadora_id(name)')
      .eq('id', driverId)
      .eq('role', 'motorista')
      .single()

    if (error) {
      logError('Erro ao buscar motorista', { error, driverId }, 'DriversGetAPI')
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, motorista })
  } catch (error: any) {
    logError('Erro na API de buscar motorista', { error, driverId: (await context.params).driverId }, 'DriversGetAPI')
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

