import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'
import { CarrierUpdate } from '@/types/carrier'
import { invalidateEntityCache } from '@/lib/next-cache'

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
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validated = carrierUpdateSchema.parse(body)

    // Tipagem explícita 'any' para permitir campos dinâmicos
    const updateData: any = {
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

    const { data, error } = await supabaseServiceRole
      .from('carriers')
      .update(updateData)
      .eq('id', carrierId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar transportadora', message: error.message },
        { status: 500 }
      )
    }

    // Invalidar cache após atualização
    await invalidateEntityCache('carrier', carrierId)

    return NextResponse.json({
      success: true,
      carrier: data
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar requisição'
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição', message: errorMessage },
      { status: 500 }
    )
  }
}
