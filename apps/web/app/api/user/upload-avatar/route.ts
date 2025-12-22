import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { logError } from '@/lib/logger'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Verificar autenticação (qualquer usuário autenticado pode fazer upload do próprio avatar)
  const authError = await requireAuth(req)
  if (authError) return authError

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: 'Arquivo e ID do usuário são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Apenas imagens são permitidas' },
        { status: 400 }
      )
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'A imagem deve ter no máximo 5MB' },
        { status: 400 }
      )
    }

    // Usar cliente Supabase admin para bypass RLS
    const supabase = getSupabaseAdmin()

    // Converter File para Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload para storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatares/${fileName}`

    // Criar bucket se não existir (via SQL se necessário)
    const { error: uploadError } = await supabase.storage
      .from('avatares')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      // Se o bucket não existir, informar ao usuário
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found') || (uploadError as any).statusCode === '404') {
        throw new Error('Bucket de avatares não encontrado. Por favor, crie o bucket "avatares" no Supabase Storage primeiro.')
      }
      throw uploadError
    }

    // Obter URL pública com timestamp para evitar cache
    const { data: { publicUrl } } = supabase.storage
      .from('avatares')
      .getPublicUrl(filePath)

    // Adicionar timestamp à URL para evitar cache do navegador
    const publicUrlWithCache = `${publicUrl}?t=${Date.now()}`

    // Atualizar no banco de dados usando service role para garantir que funcione
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)
      .select('id, avatar_url')

    if (updateError) {
      logError('Erro ao atualizar avatar_url no banco', { error: updateError, userId }, 'UploadAvatarAPI')
      throw updateError
    }

    // Verificar se a atualização foi bem-sucedida
    if (!updateData || updateData.length === 0) {
      throw new Error('Não foi possível atualizar a foto de perfil no banco de dados')
    }

    // Verificar se o avatar_url foi realmente atualizado
    const updatedUser = updateData[0]
    if (updatedUser.avatar_url !== publicUrl) {
      logError('Avatar URL não corresponde ao esperado', {
        expected: publicUrl,
        actual: updatedUser.avatar_url,
        userId
      }, 'UploadAvatarAPI')
      throw new Error('A foto de perfil não foi atualizada corretamente no banco de dados')
    }

    // Aguardar um pouco para garantir que a atualização foi propagada
    await new Promise(resolve => setTimeout(resolve, 100))

    return NextResponse.json({
      success: true,
      url: publicUrlWithCache,
      publicUrl: publicUrlWithCache,
      avatar_url: publicUrl, // URL sem cache para salvar no banco
      message: 'Foto de perfil atualizada com sucesso'
    })
  } catch (error: any) {
    logError('Erro ao fazer upload', { error, userId: req.formData ? (await req.formData()).get('userId') : null }, 'UploadAvatarAPI')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao fazer upload da imagem',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

