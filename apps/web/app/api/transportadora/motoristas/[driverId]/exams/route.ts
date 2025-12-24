import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireAuth } from '@/lib/api-auth'
import { supabaseServiceRole } from '@/lib/supabase-server'

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
  context: { params: Promise<{ driverId: string }> }
) {
  const params = await context.params

  try {
    const authErrorResponse = await requireAuth(request, 'gestor_transportadora')
    if (authErrorResponse) return authErrorResponse

    // Selecionar apenas colunas necessárias para listagem (otimização de performance)
    const examColumns = 'id,motorista_id,exam_type,exam_date,expiry_date,result,file_url,file_name,clinic_name,doctor_name,doctor_crm,notes,created_at,updated_at'
    const { data, error } = await supabaseServiceRole
      .from('driver_medical_exams')
      .select(examColumns)
      .eq('motorista_id', params.driverId)
      .order('exam_date', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar exames', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ driverId: string }> }
) {
  const params = await context.params

  try {
    const authErrorResponse = await requireAuth(request, 'gestor_transportadora')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json()
    const validated = examSchema.parse(body)

    const { data, error } = await supabaseServiceRole
      .from('driver_medical_exams')
      .insert({
        motorista_id: params.driverId,
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
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: err.errors },
        { status: 400 }
      )
    }
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: errorMessage },
      { status: 500 }
    )
  }
}

