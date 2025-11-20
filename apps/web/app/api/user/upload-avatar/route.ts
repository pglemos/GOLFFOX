import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
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

    // Criar cliente Supabase com service role para bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Converter File para Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload para storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Criar bucket se não existir (via SQL se necessário)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      // Se o bucket não existir, informar ao usuário
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found') || uploadError.statusCode === '404') {
        throw new Error('Bucket de avatares não encontrado. Por favor, crie o bucket "avatars" no Supabase Storage primeiro.')
      }
      throw uploadError
    }

    // Obter URL pública com timestamp para evitar cache
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
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
      console.error('Erro ao atualizar avatar_url no banco:', updateError)
      throw updateError
    }

    // Verificar se a atualização foi bem-sucedida
    if (!updateData || updateData.length === 0) {
      throw new Error('Não foi possível atualizar a foto de perfil no banco de dados')
    }

    // Verificar se o avatar_url foi realmente atualizado
    const updatedUser = updateData[0]
    if (updatedUser.avatar_url !== publicUrl) {
      console.error('Avatar URL não corresponde ao esperado:', {
        expected: publicUrl,
        actual: updatedUser.avatar_url
      })
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
    console.error('Erro ao fazer upload:', error)
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

