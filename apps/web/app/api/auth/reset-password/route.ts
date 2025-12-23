export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env'
import { logError, debug } from '@/lib/logger'

const EMAIL_REGEX =
  /^(?:[a-zA-Z0-9_'^&\/+\-])+(?:\.(?:[a-zA-Z0-9_'^&\/+\-])+)*@(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[<>"'`;()]/g, '').trim()
}

/**
 * Endpoint para solicitar recuperação de senha
 * POST /api/auth/reset-password
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = sanitize(body?.email)

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório', code: 'missing_email' },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'E-mail inválido', code: 'invalid_email' },
        { status: 422 }
      )
    }

    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseAnonKey()

    if (!supabaseUrl || !supabaseAnonKey) {
      logError('Variáveis de ambiente do Supabase não configuradas', {}, 'ResetPasswordAPI')
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta', code: 'missing_supabase_env' },
        { status: 500 }
      )
    }

    // Criar cliente para autenticação
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Solicitar reset de senha via Supabase
    const { data, error: resetError } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (resetError) {
      debug('Erro ao solicitar reset de senha', { error: resetError, email }, 'ResetPasswordAPI')
      
      // Não expor se o email existe ou não por segurança
      // Sempre retornar sucesso para evitar enumeração de emails
      return NextResponse.json({
        success: true,
        message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.',
      })
    }

    debug('Reset de senha solicitado com sucesso', { email }, 'ResetPasswordAPI')

    // Sempre retornar sucesso (não expor se email existe)
    return NextResponse.json({
      success: true,
      message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.',
    })
  } catch (error: any) {
    logError('Erro ao processar solicitação de reset de senha', { error }, 'ResetPasswordAPI')
    
    // Sempre retornar sucesso para evitar enumeração de emails
    return NextResponse.json({
      success: true,
      message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.',
    })
  }
}

