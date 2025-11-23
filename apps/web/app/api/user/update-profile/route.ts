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

    let updated = false
    const updates: string[] = []

    // Atualizar nome se fornecido
    if (name !== undefined && name !== null && name.trim() !== '') {
      const { data, error: nameError } = await supabaseServiceRole
        .from('users')
        .update({ name: name.trim() })
        .eq('id', userId)
        .select()

      if (nameError) {
        console.error('Erro ao atualizar nome:', nameError)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar nome: ' + nameError.message },
          { status: 500 }
        )
      }

      if (data && data.length > 0) {
        updated = true
        userData.name = name.trim() // Atualizar objeto local para o cookie
        updates.push('nome')
      }
    }

    // Atualizar email se fornecido (requer sessão Supabase válida)
    if (email !== undefined && email !== null && email.trim() !== '' && email !== userData.email) {
      // 1. Atualizar email no Supabase Auth
      const { data: updateData, error: updateError } = await supabaseServiceRole.auth.admin.updateUserById(
        userId,
        { email: email.trim() }
      )

      if (updateError) {
        console.error('Erro ao atualizar email no Auth:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar email: ' + updateError.message },
          { status: 500 }
        )
      }

      // 2. Atualizar email na tabela users para manter sincronia
      const { error: dbError } = await supabaseServiceRole
        .from('users')
        .update({ email: email.trim() })
        .eq('id', userId)

      if (dbError) {
        console.error('Erro ao atualizar email no banco:', dbError)
        // Não falhar completamente se o Auth passou, mas logar erro
      }

      if (updateData) {
        updated = true
        userData.email = email.trim() // Atualizar objeto local para o cookie
        updates.push('email')
      }
    }

    // Atualizar senha se fornecida (requer sessão Supabase válida)
    if (newPassword !== undefined && newPassword !== null && newPassword.length >= 6) {
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

      if (updateData) {
        updated = true
        updates.push('senha')
      }
    }

    if (!updated) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma alteração foi feita'
      }, { status: 400 })
    }

    // Criar nova resposta com sucesso
    const response = NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      updated: updates
    })

    // Atualizar o cookie de sessão com os novos dados
    // Isso garante que o AppShell e useAuthFast peguem as mudanças imediatamente
    const newSessionPayload = JSON.stringify(userData)
    const encodedSession = Buffer.from(newSessionPayload).toString('base64')

    response.cookies.set('golffox-session', encodedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    })

    return response
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
