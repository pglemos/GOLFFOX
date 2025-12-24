import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { invalidateEntityCache } from '@/lib/next-cache'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { CarrierUpdate } from '@/types/carrier'
import type { Database } from '@/types/supabase'

type TransportadorasUpdate = Database['public']['Tables']['transportadoras']['Update']

export const runtime = 'nodejs'

const carrierUpdateSchema = z.object({
  // Name é opcional para permitir update parcial (ex: só dados bancários)
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  cnpj: z.string().optional().nullable(),
  state_registration: z.string().optional().nullable(),
  municipal_registration: z.string().optional().nullable(),
  address_zip_code: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_neighborhood: z.string().optional().nullable(),
  address_complement: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().optional().nullable(),
  // Campos do Representante Legal
  legal_rep_name: z.string().optional().nullable(),
  legal_rep_cpf: z.string().optional().nullable(),
  legal_rep_rg: z.string().optional().nullable(),
  legal_rep_email: z.string().optional().nullable(),
  legal_rep_phone: z.string().optional().nullable(),
  // Campos Bancários
  bank_name: z.string().optional().nullable(),
  bank_code: z.string().optional().nullable(),
  bank_agency: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  bank_account_type: z.string().optional().nullable(),
  pix_key: z.string().optional().nullable(),
  pix_key_type: z.string().optional().nullable()
}).refine(data => {
  // Pelo menos um campo deve ser fornecido para update
  return Object.values(data).some(v => v !== undefined && v !== null && v !== '')
}, { message: 'Pelo menos um campo deve ser fornecido para atualização' })

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
    if (!carrierId) {
      return validationErrorResponse('ID da transportadora não fornecido')
    }

    const body = await req.json()
    const validated = carrierUpdateSchema.parse(body)

    // Construir objeto de atualização com tipos corretos
    const updateData: Partial<TransportadorasUpdate> = {
      updated_at: new Date().toISOString(),
    }

    // Adicionar name apenas se fornecido
    if (validated.name) {
      updateData.name = validated.name
    }

    // Mapeamento dinâmico de campos opcionais
    const fields = [
      'address', 'phone', 'contact_person', 'email', 'cnpj',
      'state_registration', 'municipal_registration',
      'address_zip_code', 'address_street', 'address_number',
      'address_neighborhood', 'address_complement', 'address_city', 'address_state',
      // Representante
      'legal_rep_name', 'legal_rep_cpf', 'legal_rep_rg', 'legal_rep_email', 'legal_rep_phone',
      // Bancários
      'bank_name', 'bank_code', 'bank_agency', 'bank_account', 'bank_account_type',
      'pix_key', 'pix_key_type'
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
    await invalidateEntityCache('gestor_transportadora', carrierId)

    return successResponse(data)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse('Dados inválidos', { details: error.errors })
    }
    return errorResponse(error, 500, 'Erro ao processar requisição')
  }
}
