import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { validateWithSchema, driverExamSchema, driverExamQuerySchema, uuidSchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

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
  const { driverId } = params

  try {
    const authErrorResponse = await requireAuth(request, 'gestor_transportadora')
    if (authErrorResponse) return authErrorResponse

    // Validar ID
    const idValidation = uuidSchema.safeParse(driverId)
    if (!idValidation.success) {
      return validationErrorResponse('ID do motorista inválido')
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(driverExamQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { type, result } = validation.data

    let query = supabaseServiceRole
      .from('driver_medical_exams')
      .select('id, motorista_id, exam_type, exam_date, expiry_date, result, file_url, file_name, clinic_name, doctor_name, doctor_crm, notes, created_at, updated_at')
      .eq('motorista_id', driverId)

    if (type) query = query.eq('exam_type', type)
    if (result) query = query.eq('result', result)

    const { data, error } = await query.order('exam_date', { ascending: false })

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
  const { driverId } = params

  try {
    const authErrorResponse = await requireAuth(request, 'gestor_transportadora')
    if (authErrorResponse) return authErrorResponse

    // Validar ID
    const idValidation = uuidSchema.safeParse(driverId)
    if (!idValidation.success) {
      return validationErrorResponse('ID do motorista inválido')
    }

    const body = await request.json()

    // Validar corpo
    const validation = validateWithSchema(driverExamSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const validated = validation.data

    const { data, error } = await supabaseServiceRole
      .from('driver_medical_exams')
      .insert({
        motorista_id: driverId,
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
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: errorMessage },
      { status: 500 }
    )
  }
}

