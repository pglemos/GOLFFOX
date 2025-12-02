import { NextRequest, NextResponse } from 'next/server'

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
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseAnonKey) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      const { data: dbUser } = await supabase
        .from('users')
        .select('id, email, name, role, company_id, transportadora_id, avatar_url')
        .eq('id', userData.id)
        .maybeSingle()

      // #region agent log
      console.log('[DEBUG H2] /api/auth/me - dbUser from database:', JSON.stringify({ hasDbUser: !!dbUser, avatar_url: dbUser?.avatar_url, keys: dbUser ? Object.keys(dbUser) : [] }));
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
    }
  } catch (error) {
    console.error('Erro ao buscar dados do usuário no banco:', error)
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
    }
  })
}