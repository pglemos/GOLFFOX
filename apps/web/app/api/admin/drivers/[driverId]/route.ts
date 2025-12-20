import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'

// PUT /api/admin/drivers/[driverId] - Editar motorista
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ driverId: string }> }
) {
  // Verificar autenticação admin
  const authError = await requireAuth(request, 'admin')
  if (authError) return authError

  try {
    const supabase = getSupabaseAdmin()
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
      is_active
    } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const transportadoraId = transportadora_id

    // Atualizar motorista na tabela users
    const { data: motorista, error: driverError } = await supabase
      .from('users')
      .update({
        name,
        email: email || null,
        phone: phone || null,
        transportadora_id: transportadoraId || null,
        cpf: cpf || null,
        cnh: cnh || null,
        cnh_category: cnh_category || null,
        cnh_expiry: cnh_expiry || null,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId)
      .eq('role', 'motorista')
      .select()
      .single()

    if (driverError) {
      logError('Erro ao atualizar motorista', { error: driverError, driverId }, 'DriversUpdateAPI')
      return NextResponse.json(
        { success: false, error: driverError.message },
        { status: 500 }
      )
    }

    // Invalidar cache após atualização
    await invalidateEntityCache('motorista', driverId)

    return NextResponse.json({ success: true, motorista })
  } catch (error: any) {
    logError('Erro na API de atualizar motorista', { error, driverId: (await context.params).driverId }, 'DriversUpdateAPI')
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// GET /api/admin/drivers/[driverId] - Obter motorista específico
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

