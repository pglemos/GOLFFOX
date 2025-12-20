import { NextRequest, NextResponse } from 'next/server'
import { logError, debug, logger } from '@/lib/logger'
import { requireAuth } from '@/lib/api-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response'

function tryDecode(cookieValue: string): any | null {
  try {
    // Base64
    const b64 = Buffer.from(cookieValue, 'base64').toString('utf-8')
    return JSON.parse(b64)
  } catch (_) {
    try {
      // URI encoded JSON
      const uri = decodeURIComponent(cookieValue)
      return JSON.parse(uri)
    } catch {
      return null
    }
  }
}

async function meHandler(request: NextRequest) {
  // Verificar autenticação (qualquer usuário autenticado pode ver seus próprios dados)
  const authError = await requireAuth(request)
  if (authError) return authError

  // Obter dados do cookie para compatibilidade com código existente
  const cookie = request.cookies.get('golffox-session')?.value
  if (!cookie) {
    return unauthorizedResponse('Sessão não encontrada')
  }
  const userData = tryDecode(cookie)
  if (!userData || !userData.id || !userData.role) {
    return unauthorizedResponse('Sessão inválida')
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

  // Fallback para dados do cookie
  return successResponse({
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