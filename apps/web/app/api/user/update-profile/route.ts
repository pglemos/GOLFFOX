import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function tryDecode(cookieValue: string): any | null {
  try {
    const b64 = Buffer.from(cookieValue, 'base64').toString('utf-8')
    return JSON.parse(b64)
  } catch (_) {
    try {
      const uri = decodeURIComponent(cookieValue)
      return JSON.parse(uri)
    } catch {
      return null
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação via cookie
    const cookie = req.cookies.get('golffox-session')?.value
    if (!cookie) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userData = tryDecode(cookie)
    if (!userData || !userData.id || !userData.role) {
      return NextResponse.json(
        { success: false, error: 'Sessão inválida' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, email, newPassword } = body

    // Validar que o userId do cookie corresponde ao que está sendo atualizado
    const userId = userData.id

    // Atualizar nome se fornecido
    if (name !== undefined) {
      const { error: nameError } = await supabaseServiceRole
        .from('users')
        .update({ name })
        .eq('id', userId)

      if (nameError) {
        console.error('Erro ao atualizar nome:', nameError)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar nome: ' + nameError.message },
          { status: 500 }
        )
      }
    }

    // Atualizar email se fornecido (requer sessão Supabase válida)
    if (email !== undefined && email !== userData.email) {
      // Atualizar email usando admin API
      const { data: updateData, error: updateError } = await supabaseServiceRole.auth.admin.updateUserById(
        userId,
        { email }
      )

      if (updateError) {
        console.error('Erro ao atualizar email:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar email: ' + updateError.message },
          { status: 500 }
        )
      }
    }

    // Atualizar senha se fornecida (requer sessão Supabase válida)
    if (newPassword !== undefined && newPassword.length >= 6) {
      // Atualizar senha usando admin API
      const { data: updateData, error: updateError } = await supabaseServiceRole.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      )

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar senha: ' + updateError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao atualizar perfil',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

