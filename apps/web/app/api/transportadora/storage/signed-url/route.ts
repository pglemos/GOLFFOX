import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth, validateAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

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
    const authErrorResponse = await requireAuth(req, 'transportadora')
    if (authErrorResponse) return authErrorResponse

    const user = await validateAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { file_path } = body

    if (!file_path) {
      return NextResponse.json(
        { error: 'Caminho do arquivo não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se o arquivo pertence à transportadora do usuário
    // Extrair driverId ou vehicleId do caminho
    const pathParts = file_path.split('/')
    const folder = pathParts[0]
    const entityId = pathParts[1]

    if (folder === 'motorista-documents' || folder === 'medical-exams') {
      // Verificar se o motorista pertence à transportadora
      const { data: driver } = await supabaseServiceRole
        .from('users')
        .select('transportadora_id')
        .eq('id', entityId)
        .single()

      const { data: userData } = await supabaseServiceRole
        .from('users')
        .select('transportadora_id')
        .eq('id', user.id)
        .single()

      if (!driver || userData?.transportadora_id !== driver.transportadora_id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        )
      }
    } else if (folder === 'vehicle-documents') {
      // Verificar se o veículo pertence à transportadora
      const { data: vehicle } = await supabaseServiceRole
        .from('vehicles')
        .select('transportadora_id')
        .eq('id', entityId)
        .single()

      const { data: userData } = await supabaseServiceRole
        .from('users')
        .select('transportadora_id')
        .eq('id', user.id)
        .single()

      if (!vehicle || userData?.transportadora_id !== vehicle.transportadora_id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        )
      }
    }

    // Criar URL assinada válida por 1 hora
    const { data, error } = await supabaseServiceRole.storage
      .from('transportadora-documents')
      .createSignedUrl(file_path, 3600) // 1 hora

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao gerar URL assinada', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ signed_url: data?.signedUrl })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: error.message },
      { status: 500 }
    )
  }
}

