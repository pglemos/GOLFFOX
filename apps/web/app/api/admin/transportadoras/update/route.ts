import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'
import { CarrierUpdate } from '@/types/carrier'
import { invalidateEntityCache } from '@/lib/next-cache'

export const runtime = 'nodejs'

const carrierUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
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
})

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

    const updateData: CarrierUpdate = {
      name: validated.name,
      address: validated.address || null,
      phone: validated.phone || null,
      contact_person: validated.contact_person || null,
      updated_at: new Date().toISOString(),
      address_zip_code: validated.address_zip_code || null,
      address_street: validated.address_street || null,
      address_number: validated.address_number || null,
      address_neighborhood: validated.address_neighborhood || null,
      address_complement: validated.address_complement || null,
      address_city: validated.address_city || null,
      address_state: validated.address_state || null
    }

    if (validated.email) {
      updateData.email = validated.email
    }
    if (validated.cnpj) {
      updateData.cnpj = validated.cnpj
    }
    if (validated.state_registration) {
      updateData.state_registration = validated.state_registration
    }
    if (validated.municipal_registration) {
      updateData.municipal_registration = validated.municipal_registration
    }

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

