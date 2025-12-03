import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { applyRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

export const runtime = 'nodejs'

const carrierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('').transform(() => null)).nullable(),
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
      console.error('[CREATE CARRIER] Auth failed:', authErrorResponse.status)
      return authErrorResponse
    }

    const body = await req.json()
    console.log('[CREATE CARRIER] Request body received:', JSON.stringify(body, null, 2))

    const validated = carrierSchema.parse(body)
    console.log('[CREATE CARRIER] Validation passed:', JSON.stringify(validated, null, 2))

    const insertData: any = {
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

    console.log('[CREATE CARRIER] Attempting insert...', JSON.stringify(insertData, null, 2))

    const { data, error } = await supabaseServiceRole
      .from('carriers')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[CREATE CARRIER] Database error:', error.code, error.message, error.details)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar transportadora', message: error.message },
        { status: 500 }
      )
    }

    console.log('[CREATE CARRIER] Success! Carrier created:', data.id)

    return NextResponse.json({
      success: true,
      carrier: data
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição', message: error.message },
      { status: 500 }
    )
  }
}

