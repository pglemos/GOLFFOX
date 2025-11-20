import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const carrierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  cnpj: z.string().optional().nullable(),
  state_registration: z.string().optional().nullable(),
  municipal_registration: z.string().optional().nullable(),
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
    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) return authErrorResponse

    const body = await req.json()
    const validated = carrierSchema.parse(body)

    const insertData: any = {
      name: validated.name,
      address: validated.address || null,
      phone: validated.phone || null,
      contact_person: validated.contact_person || null,
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

    const { data, error } = await supabaseServiceRole
      .from('carriers')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar transportadora', message: error.message },
        { status: 500 }
      )
    }

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

