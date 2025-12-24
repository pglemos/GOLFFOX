import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'
import { logError, debug, logger } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'

function tryDecode(cookieValue: string): Record<string, unknown> | null {
  try {
    // Base64
    const b64 = Buffer.from(cookieValue, 'base64').toString('utf-8')
    const parsed = JSON.parse(b64)
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null
  } catch (_) {
    try {
      // URI encoded JSON
      const uri = decodeURIComponent(cookieValue)
      const parsed = JSON.parse(uri)
      return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null
    } catch {
      return null
    }
  }
}

async function meHandler(request: NextRequest) {
  debug('[AuthMeAPI] Iniciando verificação de autenticação', {
    hasCookies: request.cookies.getAll().length > 0,
    cookieNames: request.cookies.getAll().map(c => c.name)
  }, 'AuthMeAPI')

  // Obter dados do cookie golffox-session primeiro (método mais rápido e confiável)
  const cookie = request.cookies.get('golffox-session')?.value
  let userData: Record<string, unknown> | null = null

  if (cookie) {
    debug('[AuthMeAPI] Cookie golffox-session encontrado, tentando decodificar...', {
      cookieLength: cookie.length
    }, 'AuthMeAPI')
    userData = tryDecode(cookie)
    if (userData && userData.id && userData.role) {
      debug('[AuthMeAPI] Usuário encontrado no cookie golffox-session', {
        userId: userData.id,
        role: userData.role,
        email: userData.email?.substring(0, 3) + '***'
      }, 'AuthMeAPI')
    } else {
      debug('[AuthMeAPI] Cookie decodificado mas dados inválidos', {
        hasId: !!userData?.id,
        hasRole: !!userData?.role
      }, 'AuthMeAPI')
      userData = null
    }
  } else {
    debug('[AuthMeAPI] Cookie golffox-session não encontrado', {}, 'AuthMeAPI')
  }

  // Se não encontrou no cookie, tentar requireAuth (valida token do Supabase)
  // Mas apenas se realmente não houver cookie - não bloquear se cookie existir mas estiver inválido
  if (!userData) {
    debug('[AuthMeAPI] Cookie golffox-session não encontrado ou inválido, tentando requireAuth...', {}, 'AuthMeAPI')

    // Se não há cookie, retornar erro imediatamente (não tentar requireAuth que pode ser lento)
    if (!cookie) {
      debug('[AuthMeAPI] Nenhum cookie golffox-session encontrado, retornando sucesso falso (silencioso)', {}, 'AuthMeAPI')
      return NextResponse.json({
        success: false,
        user: null,
        message: 'No session'
      }, { status: 200 }) // Retornar 200 para evitar erro no console do navegador
    }

    // Se há cookie mas está inválido, tentar requireAuth como último recurso
    try {
      const authError = await requireAuth(request)
      if (authError) {
        debug('[AuthMeAPI] requireAuth falhou', {
          status: authError.status,
          statusText: authError.statusText
        }, 'AuthMeAPI')
        // Retornar erro mais informativo
        return NextResponse.json({
          success: false,
          user: null,
          message: 'Invalid session'
        }, { status: 200 }) // Retornar 200 para evitar erro no console do navegador
      }
      // Se requireAuth passou, buscar dados do cookie novamente ou usar dados validados
      const cookieRetry = request.cookies.get('golffox-session')?.value
      if (cookieRetry) {
        userData = tryDecode(cookieRetry)
        debug('[AuthMeAPI] Dados obtidos após requireAuth bem-sucedido', {
          hasUserData: !!userData
        }, 'AuthMeAPI')
      }
      if (!userData || !userData.id || !userData.role) {
        debug('[AuthMeAPI] Nenhum dado de usuário encontrado após requireAuth', {}, 'AuthMeAPI')
        return NextResponse.json({
          success: false,
          user: null,
          message: 'User data missing'
        }, { status: 200 }) // Retornar 200 para evitar erro no console do navegador
      }
    } catch (error) {
      logError('Erro ao executar requireAuth', { error }, 'AuthMeAPI')
      return NextResponse.json({
        success: false,
        error: 'Erro interno',
        message: 'Erro ao verificar autenticação'
      }, { status: 500 })
    }
  }

  // Buscar dados completos do usuário no banco para incluir transportadora_id, company_id, etc.
  // IMPORTANTE: Usar service_role_key para bypassar RLS
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // #region agent log
    logger.log('[DEBUG H2] /api/auth/me - Query params:', {
      userId: userData.id,
      hasServiceKey: !!supabaseServiceKey,
      hasUrl: !!supabaseUrl
    });
    // #endregion

    if (supabaseUrl && supabaseServiceKey) {
      const { createClient } = await import('@supabase/supabase-js')
      // Usar service_role_key para bypassar RLS na tabela users
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id, email, name, role, company_id, transportadora_id, avatar_url')
        .eq('id', userData.id)
        .maybeSingle()

      debug('[DEBUG H2] /api/auth/me - FULL dbUser from database', { dbUser, avatar_url: dbUser?.avatar_url, dbError }, 'AuthMeAPI')

      if (dbUser) {
        return NextResponse.json({
          success: true,
          user: {
            id: dbUser.id,
            email: dbUser.email || userData.email || '',
            name: dbUser.name || userData.name || '',
            role: dbUser.role || userData.role,
            companyId: dbUser.company_id || userData.companyId || null,
            transportadora_id: dbUser.transportadora_id || userData.transportadora_id || null,
            avatar_url: dbUser.avatar_url || null,
          }
        })
      }
    } else {
      debug('[DEBUG H2] /api/auth/me - MISSING service key, falling back to cookie data', {}, 'AuthMeAPI')
    }
  } catch (error) {
    logError('Erro ao buscar dados do usuário no banco', { error }, 'AuthMeAPI')
  }

  // Fallback para dados do cookie - retornar formato esperado pelo hook
  return NextResponse.json({
    success: true,
    user: {
      id: userData.id,
      email: userData.email || '',
      name: userData.name || '',
      role: userData.role,
      companyId: userData.companyId ?? null,
      transportadora_id: userData.transportadora_id ?? null,
      avatar_url: userData.avatar_url ?? null,
    }
  })
}

// Exportar com rate limiting
export const GET = withRateLimit(meHandler, 'api')