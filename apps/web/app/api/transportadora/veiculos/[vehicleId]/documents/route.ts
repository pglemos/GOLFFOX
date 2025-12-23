import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const documentSchema = z.object({
  document_type: z.enum(['crlv', 'ipva', 'seguro', 'inspecao', 'alvara']),
  document_number: z.string().optional().nullable(),
  file_url: z.string().url().optional().nullable(),
  file_name: z.string().optional().nullable(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  value_brl: z.number().min(0).optional().nullable(),
  insurance_company: z.string().optional().nullable(),
  policy_number: z.string().optional().nullable(),
  status: z.enum(['valid', 'expired', 'pending', 'cancelled']).optional(),
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
  context: { params: Promise<{ vehicleId: string }> }
) {
  const params = await context.params

  try {
    const authErrorResponse = await requireAuth(request, 'gestor_transportadora')
    if (authErrorResponse) return authErrorResponse

    // Selecionar apenas colunas necessárias para listagem (otimização de performance)
    const documentColumns = 'id,veiculo_id,document_type,document_number,file_url,file_name,issue_date,expiry_date,value_brl,insurance_company,policy_number,status,notes,created_at,updated_at'
    const { data, error } = await supabaseServiceRole
      .from('vehicle_documents')
      .select(documentColumns)
      .eq('veiculo_id', params.vehicleId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar documentos', message: error.message },
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
  context: { params: Promise<{ vehicleId: string }> }
) {
  const params = await context.params

  try {
    const authErrorResponse = await requireAuth(request, 'gestor_transportadora')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json()
    const validated = documentSchema.parse(body)

    const { data, error } = await supabaseServiceRole
      .from('vehicle_documents')
      .insert({
        veiculo_id: params.vehicleId,
        ...validated,
        issue_date: validated.issue_date || null,
        expiry_date: validated.expiry_date || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao criar documento', message: error.message },
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

