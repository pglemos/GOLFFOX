import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { CompanyService } from '@/lib/services/server/company-service'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export const runtime = 'nodejs'

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
 * PUT /api/admin/empresas/[companyId]
 * Atualizar empresa
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const params = await context.params

  const { companyId: companyIdParam } = params
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

    const body = await request.json()

    // Preparar dados para atualização
    // Campos legados (para compatibilidade) mapeados para os campos corretos
    const addressCity = body.address_city || body.city
    const addressState = body.address_state || body.state
    const addressZipCode = body.address_zip_code || body.zip_code

    // Delegar para o serviço
    const updatedCompany = await CompanyService.updateCompany(companyId, {
      name: body.name,
      cnpj: body.cnpj,
      address: body.address,
      phone: body.phone,
      email: body.email,
      is_active: body.is_active,
      address_zip_code: addressZipCode,
      address_street: body.address_street,
      address_number: body.address_number,
      address_neighborhood: body.address_neighborhood,
      address_complement: body.address_complement,
      address_city: addressCity,
      address_state: addressState
    })

    return NextResponse.json({
      success: true,
      company: updatedCompany
    })
  } catch (err: any) {
    logError('Erro ao atualizar empresa', { error: err, companyId: (await context.params).companyId }, 'CompaniesUpdateAPI')
    const message = err.message
    const status = message.includes('obrigatório') || message.includes('inválido') || message.includes('já existe') ? 400 : 500

    return NextResponse.json(
      {
        error: 'Erro ao atualizar empresa',
        message: message,
        details: process.env.NODE_ENV === 'development' ? String(err) : undefined
      },
      { status }
    )
  }
}

/**
 * DELETE /api/admin/empresas/[companyId]
 * Excluir empresa (soft delete se tiver dependências)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const params = await context.params

  const { companyId: companyIdParam } = params
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
      .from('veiculos')
      .select('id', { head: true, count: 'exact' })
      .eq('company_id', companyId)

    const { count: routesCount } = await supabaseAdmin
      .from('routes')
      .select('id', { head: true, count: 'exact' })
      .eq('company_id', companyId)

    const totalDependencies = (usersCount || 0) + (vehiclesCount || 0) + (routesCount || 0)

    if (totalDependencies > 0) {
      // Soft delete se tiver dependências
      await CompanyService.updateCompany(companyId, { is_active: false })

      return NextResponse.json({
        success: true,
        archived: true,
        message: 'Empresa arquivada (soft delete) devido a dependências',
        dependencies: {
          users: usersCount || 0,
          veiculos: vehiclesCount || 0,
          routes: routesCount || 0
        }
      })
    } else {
      // Hard delete se não tiver dependências
      await CompanyService.deleteCompany(companyId, true)

      return NextResponse.json({
        success: true,
        deleted: true,
        message: 'Empresa excluída com sucesso'
      })
    }
  } catch (error: any) {
    const params = await context.params
    const { companyId: errorCompanyId } = params
    logError('Erro ao excluir empresa', { error, companyId: errorCompanyId }, 'CompaniesDeleteAPI')
    return NextResponse.json(
      { error: 'Erro ao excluir empresa', message: error.message },
      { status: 500 }
    )
  }
}

