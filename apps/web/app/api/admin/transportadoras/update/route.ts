import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { invalidateEntityCache } from '@/lib/next-cache'
import { supabaseServiceRole } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'
import { validateWithSchema, updateTransportadoraSchema, uuidSchema } from '@/lib/validation/schemas'

type TransportadorasUpdate = Database['public']['Tables']['transportadoras']['Update']

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function PUT(req: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) return authErrorResponse

    const carrierId = req.nextUrl.searchParams.get('id')

    // Validar ID
    const idValidation = uuidSchema.safeParse(carrierId)
    if (!idValidation.success) {
      return validationErrorResponse('ID da transportadora inválido')
    }

    const body = await req.json()

    // Validar corpo com Zod centralizado
    const validation = validateWithSchema(updateTransportadoraSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const validated = validation.data

    // Construir objeto de atualização com tipos corretos
    const updateData: Partial<TransportadorasUpdate> = {
      updated_at: new Date().toISOString(),
    }

    // Mapeamento dinâmico de campos
    const fields = [
      'name', 'address', 'phone', 'contact_person', 'email', 'cnpj',
      'state_registration', 'municipal_registration',
      'address_zip_code', 'address_street', 'address_number',
      'address_neighborhood', 'address_complement', 'address_city', 'address_state',
      'legal_rep_name', 'legal_rep_cpf', 'legal_rep_rg', 'legal_rep_email', 'legal_rep_phone',
      'bank_name', 'bank_code', 'bank_agency', 'bank_account', 'bank_account_type',
      'pix_key', 'pix_key_type', 'is_active'
    ]

    fields.forEach(field => {
      // @ts-ignore
      if (validated[field] !== undefined) {
        // @ts-ignore - Converter strings vazias para null para o banco
        updateData[field] = validated[field] === '' ? null : validated[field]
      }
    })

    const { data, error } = await (supabaseServiceRole
      .from('transportadoras')
      .update(updateData)
      .eq('id', carrierId)
      .select()
      .single())

    if (error) {
      return errorResponse(error, 500, 'Erro ao atualizar transportadora')
    }

    // Invalidar cache após atualização
    await invalidateEntityCache('gestor_transportadora', carrierId!)

    return successResponse(data)
  } catch (error: unknown) {
    const err = error as { message?: string }
    return errorResponse(err, 500, 'Erro ao processar requisição')
  }
}
