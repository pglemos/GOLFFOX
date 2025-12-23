import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { logger, logError } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { createTransportadoraSchema } from '@/lib/validation/schemas'
import { CarrierInsert } from '@/types/carrier'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    // ✅ Rate Limit (Sensitive operation)
    const rateLimitResponse = await applyRateLimit(req, 'sensitive')
    if (rateLimitResponse) return rateLimitResponse

    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) {
      logError('[CREATE transportadora] Auth failed', { status: authErrorResponse.status }, 'CarriersCreateAPI')
      return authErrorResponse
    }

    const body = await req.json()
    logger.debug('[CREATE transportadora] Request body received:', JSON.stringify(body, null, 2))

    // Validar com schema compartilhado
    const validation = createTransportadoraSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse('Dados inválidos', { details: validation.error.errors })
    }
    const validated = validation.data
    logger.debug('[CREATE transportadora] Validation passed:', JSON.stringify(validated, null, 2))

    const insertData: CarrierInsert = {
      name: validated.name,
      address: validated.address || null,
      phone: validated.phone || null,
      contact_person: validated.contact_person || null,
      address_zip_code: validated.address_zip_code || null,
      address_street: validated.address_street || null,
      address_number: validated.address_number || null,
      address_neighborhood: validated.address_neighborhood || null,
      address_complement: validated.address_complement || null,
      address_city: validated.address_city || null,
      address_state: validated.address_state || null,
    }

    if (validated.email) {
      insertData.email = validated.email
    }
    if (validated.cnpj) {
      insertData.cnpj = validated.cnpj
    }
    if (validated.state_registration) {
      insertData.state_registration = validated.state_registration
    }
    if (validated.municipal_registration) {
      insertData.municipal_registration = validated.municipal_registration
    }

    logger.debug('[CREATE transportadora] Attempting insert...', JSON.stringify(insertData, null, 2))

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('transportadoras' as any)
      .insert(insertData as any)
      .select()
      .single()

    if (error) {
      logError('[CREATE transportadora] Database error', { error, code: error.code, details: error.details }, 'CarriersCreateAPI')
      return errorResponse(error, 500, 'Erro ao criar transportadora')
    }

    logger.debug('[CREATE transportadora] Success! transportadora created:', (data as any).id)

    return successResponse(data)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse('Dados inválidos', { details: error.errors })
    }
    return errorResponse(error, 500, 'Erro ao processar requisição')
  }
}

