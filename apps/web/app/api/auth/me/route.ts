import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'

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

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('golffox-session')?.value
  if (!cookie) {
    return NextResponse.json({ success: false }, { status: 401 })
  }
  const userData = tryDecode(cookie)
  if (!userData || !userData.id || !userData.role) {
    return NextResponse.json({ success: false }, { status: 401 })
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

      // #region agent log
      logger.log('[DEBUG H2] /api/auth/me - FULL dbUser from database:', JSON.stringify(dbUser, null, 2));
      logger.log('[DEBUG H2] /api/auth/me - avatar_url specifically:', dbUser?.avatar_url);
      if (dbError) logger.log('[DEBUG H2] /api/auth/me - DB ERROR:', JSON.stringify(dbError));
      // #endregion

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
      // #region agent log
      logger.log('[DEBUG H2] /api/auth/me - MISSING service key, falling back to cookie data');
      // #endregion
    }
  } catch (error) {
    logError('Erro ao buscar dados do usuário no banco', { error }, 'AuthMeAPI')
  }

  // Fallback para dados do cookie
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