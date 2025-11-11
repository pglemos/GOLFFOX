import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const vehicleSchema = z.object({
  plate: z.string().min(1, 'Placa é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  brand: z.string().optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  capacity: z.number().int().min(1).optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().default(true),
})

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { data, error } = await supabaseServiceRole
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar veículos', message: error.message },
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

export async function POST(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json()
    const validated = vehicleSchema.parse(body)

    // Se company_id não foi fornecido, buscar primeira empresa ativa
    let finalCompanyId = validated.company_id
    if (!finalCompanyId) {
      const { data: companies } = await supabaseServiceRole
        .from('companies')
        .select('id')
        .eq('is_active', true)
        .limit(1)
      
      if (companies && companies.length > 0) {
        finalCompanyId = companies[0].id
      }
    }

    const vehicleData: any = {
      plate: validated.plate,
      model: validated.model,
      brand: validated.brand,
      year: validated.year,
      capacity: validated.capacity,
      is_active: validated.is_active,
    }

    if (finalCompanyId) {
      vehicleData.company_id = finalCompanyId
    }

    const { data: newVehicle, error: createError } = await supabaseServiceRole
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single()

    if (createError) {
      return NextResponse.json(
        { error: 'Erro ao criar veículo', message: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(newVehicle, { status: 201 })
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

