import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { applyRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

// Buckets permitidos (devem corresponder aos buckets criados no Supabase Storage)
const ALLOWED_BUCKETS = [
    'vehicle-documents',
    'driver-documents',
    'carrier-documents',
    'company-documents',
    'vehicle-photos',
    'avatars',
    'costs'
]

export async function POST(request: NextRequest) {
    try {
        // Aplicar rate limiting
        const rateLimitResponse = await applyRateLimit(request, 'api')
        if (rateLimitResponse) return rateLimitResponse

        // Verificar autenticação
        const authErrorResponse = await requireAuth(request)
        if (authErrorResponse) {
            return authErrorResponse
        }

        // Parse FormData
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const bucket = formData.get('bucket') as string | null
        const folder = formData.get('folder') as string | null
        const entityId = formData.get('entityId') as string | null

        // Validações
        if (!file) {
            return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
        }

        if (!bucket) {
            return NextResponse.json({ error: 'Bucket não fornecido' }, { status: 400 })
        }

        if (!ALLOWED_BUCKETS.includes(bucket)) {
            return NextResponse.json({ error: 'Bucket não permitido' }, { status: 400 })
        }

        // Validar tamanho (10MB max)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'Arquivo muito grande. Máximo: 10MB' }, { status: 400 })
        }

        // Validar tipo
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
        ]
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
        }

        // Gerar nome único
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const fileName = entityId
            ? `${entityId}-${timestamp}-${randomStr}.${ext}`
            : `${timestamp}-${randomStr}.${ext}`

        // Montar caminho
        const filePath = folder ? `${folder}/${fileName}` : fileName

        // Converter para ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload com service role (bypassa RLS)
        const supabase = getSupabaseAdmin()
        const { error: uploadError, data: uploadData } = await supabase.storage
            .from(bucket)
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            })

        if (uploadError) {
            logError('Erro no upload', { error: uploadError, bucket, entityId }, 'UploadAPI')
            return NextResponse.json({
                error: 'Erro ao fazer upload',
                details: uploadError.message
            }, { status: 500 })
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: filePath,
            size: file.size,
            name: file.name,
            type: file.type,
        })
    } catch (error: any) {
        logError('Erro no upload', { error }, 'UploadAPI')
        return NextResponse.json({
            error: 'Erro interno',
            details: error.message
        }, { status: 500 })
    }
}
