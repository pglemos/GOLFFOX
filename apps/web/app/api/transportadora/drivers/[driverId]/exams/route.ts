import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const examSchema = z.object({
  exam_type: z.enum(['admissional', 'periodico', 'toxicologico', 'demissional', 'retorno_trabalho']),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  result: z.enum(['apto', 'inapto', 'apto_com_restricoes']).optional(),
  file_url: z.string().url().optional().nullable(),
  file_name: z.string().optional().nullable(),
  clinic_name: z.string().optional().nullable(),
  doctor_name: z.string().optional().nullable(),
  doctor_crm: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
  try {
    const authErrorResponse = await requireAuth(request, 'transportadora')
    if (authErrorResponse) return authErrorResponse

    const { data, error } = await supabaseServiceRole
      .from('driver_medical_exams')
      .select('*')
      .eq('driver_id', params.driverId)
      .order('exam_date', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar exames', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
  try {
    const authErrorResponse = await requireAuth(request, 'transportadora')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json()
    const validated = examSchema.parse(body)

    const { data, error } = await supabaseServiceRole
      .from('driver_medical_exams')
      .insert({
        driver_id: params.driverId,
        ...validated,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao criar exame', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: error.message },
      { status: 500 }
    )
  }
}

