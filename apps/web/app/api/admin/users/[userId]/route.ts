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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Promise<{ userId: string }>> }
) {
  const params = await context.params

  const { userId: userIdParam } = await params
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const userId = userIdParam?.trim()
    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json(
        { error: 'user_id deve ser um UUID válido' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    // Verificar se usuário existe
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name?.trim() || null
    if (body.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        )
      }
      updateData.email = body.email.trim()
    }
    if (body.role !== undefined) updateData.role = body.role
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.company_id !== undefined) updateData.company_id = body.company_id || null
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null
    if (body.cpf !== undefined) updateData.cpf = body.cpf?.replace(/\D/g, '') || null
    if (body.address_zip_code !== undefined) updateData.address_zip_code = body.address_zip_code
    if (body.address_street !== undefined) updateData.address_street = body.address_street
    if (body.address_number !== undefined) updateData.address_number = body.address_number
    if (body.address_neighborhood !== undefined) updateData.address_neighborhood = body.address_neighborhood
    if (body.address_complement !== undefined) updateData.address_complement = body.address_complement
    if (body.address_city !== undefined) updateData.address_city = body.address_city
    if (body.address_state !== undefined) updateData.address_state = body.address_state

    // Atualizar usuário
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError)
      return NextResponse.json(
        {
          error: 'Erro ao atualizar usuário',
          message: updateError.message || 'Erro desconhecido',
        },
        { status: 500 }
      )
    }

    // Se o email foi alterado, atualizar também no Supabase Auth
    if ((body.email && body.email !== existingUser.email) || body.password) {
      try {
        const authUpdates: any = {}
        if (body.email && body.email !== existingUser.email) {
          authUpdates.email = body.email
        }
        if (body.password && body.password.length >= 6) {
          authUpdates.password = body.password
        }

        if (Object.keys(authUpdates).length > 0) {
          await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates)
        }
      } catch (authError: any) {
        console.warn('Aviso: não foi possível atualizar dados no Auth:', authError)
        // Não falhar a operação se apenas o Auth falhar, mas idealmente deveria notificar
      }
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      {
        error: 'Erro ao atualizar usuário',
        message: error.message || 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

