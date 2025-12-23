import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { supabaseServiceRole } from '@/lib/supabase-server'

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
    const authErrorResponse = await requireAuth(req, 'gestor_transportadora')
    if (authErrorResponse) return authErrorResponse

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string | null
    const driverId = formData.get('driverId') as string | null
    const vehicleId = formData.get('vehicleId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      )
    }

    if (!folder) {
      return NextResponse.json(
        { error: 'Pasta não especificada' },
        { status: 400 }
      )
    }

    // Validar tipos de arquivo permitidos
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use PDF, JPG ou PNG' },
        { status: 400 }
      )
    }

    // Validar tamanho máximo (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 10MB' },
        { status: 400 }
      )
    }

    // Construir caminho do arquivo baseado no tipo de pasta
    let filePath = ''
    if (folder === 'motorista-documents' && driverId) {
      filePath = `motorista-documents/${driverId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    } else if (folder === 'medical-exams' && driverId) {
      filePath = `medical-exams/${driverId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    } else if (folder === 'veiculo-documents' && vehicleId) {
      filePath = `veiculo-documents/${vehicleId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    } else {
      return NextResponse.json(
        { error: 'ID do motorista ou veículo não fornecido para a pasta especificada' },
        { status: 400 }
      )
    }

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseServiceRole.storage
      .from('documentos-transportadora')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo', message: uploadError.message },
        { status: 500 }
      )
    }

    // Obter URL assinada (bucket é privado)
    // A URL será acessível via Supabase Storage com autenticação
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const publicUrl = `${baseUrl}/storage/v1/object/documentos-transportadora/${filePath}`

    // Também criar URL assinada válida por 1 ano para acesso direto
    const { data: signedUrlData } = await supabaseServiceRole.storage
      .from('documentos-transportadora')
      .createSignedUrl(filePath, 31536000) // 1 ano em segundos

    return NextResponse.json({
      file_url: signedUrlData?.signedUrl || publicUrl,
      file_name: file.name,
      file_size_bytes: file.size,
      file_type: file.type,
      storage_path: filePath
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao processar upload', message: error.message },
      { status: 500 }
    )
  }
}

