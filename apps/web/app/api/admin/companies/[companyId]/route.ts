import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey)
}

// Validação de UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid)
}

function sanitizeId(id: string | undefined | null): string | null {
  if (!id || typeof id !== 'string') return null
  return id.trim() || null
}

/**
 * PUT /api/admin/companies/[companyId]
 * Atualizar empresa
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const params = await context.params

  const { companyId: companyIdParam  } = params
  try {
    // ✅ Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const companyId = sanitizeId(companyIdParam)
    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!isValidUUID(companyId)) {
      return NextResponse.json(
        { error: 'company_id deve ser um UUID válido' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    // Verificar se empresa existe e buscar cnpj para validação
    const { data: existingCompany, error: fetchError } = await supabaseAdmin
      .from('companies')
      .select('id,cnpj')
      .eq('id', companyId)
      .single()

    if (fetchError || !existingCompany) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Validar CNPJ único se fornecido e diferente do atual
    if (body.cnpj && body.cnpj !== existingCompany.cnpj) {
      const { data: companyWithSameCnpj } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('cnpj', body.cnpj)
        .neq('id', companyId)
        .single()

      if (companyWithSameCnpj) {
        return NextResponse.json(
          { error: 'Uma empresa com este CNPJ já existe' },
          { status: 400 }
        )
      }
    }

    // Validar email se fornecido
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização (apenas campos que existem na tabela)
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.cnpj !== undefined) updateData.cnpj = body.cnpj?.trim() || null
    if (body.address !== undefined) updateData.address = body.address?.trim() || null
    // Campos de endereço separados
    if (body.address_zip_code !== undefined) updateData.address_zip_code = body.address_zip_code?.trim() || null
    if (body.address_street !== undefined) updateData.address_street = body.address_street?.trim() || null
    if (body.address_number !== undefined) updateData.address_number = body.address_number?.trim() || null
    if (body.address_neighborhood !== undefined) updateData.address_neighborhood = body.address_neighborhood?.trim() || null
    if (body.address_complement !== undefined) updateData.address_complement = body.address_complement?.trim() || null
    if (body.address_city !== undefined) updateData.address_city = body.address_city?.trim() || null
    if (body.address_state !== undefined) updateData.address_state = body.address_state?.trim() || null
    // Campos legados (para compatibilidade)
    if (body.city !== undefined) updateData.address_city = body.city?.trim() || null
    if (body.state !== undefined) updateData.address_state = body.state?.trim() || null
    if (body.zip_code !== undefined) updateData.address_zip_code = body.zip_code?.trim() || null
    if (body.address_number !== undefined) updateData.address_number = body.address_number?.trim() || null
    if (body.address_complement !== undefined) updateData.address_complement = body.address_complement?.trim() || null
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null
    if (body.email !== undefined) updateData.email = body.email?.trim() || null
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // Atualizar empresa
    const { data: updatedCompany, error: updateError } = await supabaseAdmin
      .from('companies')
      .update(updateData)
      .eq('id', companyId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar empresa:', updateError)
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar empresa',
          message: updateError.message || 'Erro desconhecido',
          details: process.env.NODE_ENV === 'development' ? updateError : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      company: updatedCompany
    })
  } catch (err) {
    console.error('Erro ao atualizar empresa:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar empresa',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(err) : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/companies/[companyId]
 * Excluir empresa (soft delete se tiver dependências)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const params = await context.params

  const { companyId: companyIdParam  } = params
  try {
    // ✅ Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const companyId = sanitizeId(companyIdParam)
    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!isValidUUID(companyId)) {
      return NextResponse.json(
        { error: 'company_id deve ser um UUID válido' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verificar se empresa existe (selecionar apenas id para verificação)
    const { data: existingCompany, error: fetchError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single()

    if (fetchError || !existingCompany) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Verificar dependências
    const { count: usersCount } = await supabaseAdmin
      .from('users')
      .select('id', { head: true, count: 'exact' })
      .eq('company_id', companyId)

    const { count: vehiclesCount } = await supabaseAdmin
      .from('vehicles')
      .select('id', { head: true, count: 'exact' })
      .eq('company_id', companyId)

    const { count: routesCount } = await supabaseAdmin
      .from('routes')
      .select('id', { head: true, count: 'exact' })
      .eq('company_id', companyId)

    const totalDependencies = (usersCount || 0) + (vehiclesCount || 0) + (routesCount || 0)

    if (totalDependencies > 0) {
      // Soft delete se tiver dependências
      const { error: updateError } = await supabaseAdmin
        .from('companies')
        .update({ is_active: false })
        .eq('id', companyId)

      if (updateError) {
        console.error('Erro ao arquivar empresa:', updateError)
        return NextResponse.json(
          { error: 'Erro ao arquivar empresa', message: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        archived: true,
        message: 'Empresa arquivada (soft delete) devido a dependências',
        dependencies: {
          users: usersCount || 0,
          vehicles: vehiclesCount || 0,
          routes: routesCount || 0
        }
      })
    } else {
      // Hard delete se não tiver dependências
      const { error: deleteError } = await supabaseAdmin
        .from('companies')
        .delete()
        .eq('id', companyId)

      if (deleteError) {
        console.error('Erro ao excluir empresa:', deleteError)
        return NextResponse.json(
          { error: 'Erro ao excluir empresa', message: deleteError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        deleted: true,
        message: 'Empresa excluída com sucesso'
      })
    }
  } catch (error: any) {
    console.error('Erro ao excluir empresa:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir empresa', message: error.message },
      { status: 500 }
    )
  }
}

