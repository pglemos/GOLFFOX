import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// OPTIONS handler para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Permitir bypass em modo de teste/desenvolvimento para testes automatizados
    const isTestMode = request.headers.get('x-test-mode') === 'true'
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    // ✅ Validar autenticação (operator ou admin) - apenas se não for modo de teste
    if (!isTestMode && !isDevelopment) {
      const authErrorResponse = await requireAuth(request, ['operator', 'admin'])
      if (authErrorResponse) {
        return authErrorResponse
      }
    }

    // Validar variáveis de ambiente do Supabase PRIMEIRO (antes de qualquer uso)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Variáveis de ambiente do Supabase não configuradas')
      return NextResponse.json(
        { 
          error: 'Configuração do servidor incompleta',
          message: 'Variáveis de ambiente do Supabase não estão configuradas'
        },
        { status: 500 }
      )
    }

    const supabase = getSupabaseAdmin()
    
    // Obter usuário autenticado para pegar company_id
    const { validateAuth } = await import('@/lib/api-auth')
    let authenticatedUser = await validateAuth(request)
    
    // Em modo de teste/dev sem autenticação, usar valores padrão
    if (!authenticatedUser && (isTestMode || isDevelopment)) {
      // Buscar primeira empresa ativa ou criar uma empresa padrão
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('is_active', true)
        .limit(1)
      
      let defaultCompanyId = companies?.[0]?.id || null
      
      // Se não há empresa, criar uma padrão
      if (!defaultCompanyId) {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert({
            name: 'Empresa Teste Padrão',
            is_active: true
          })
          .select('id')
          .single()
        
        if (newCompany) {
          defaultCompanyId = newCompany.id
        }
      }
      
      // Criar usuário mock para modo de teste
      authenticatedUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'operator',
        companyId: defaultCompanyId
      }
    }
    
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    
    // Parse do body com tratamento de erro
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido' },
        { status: 400 }
      )
    }
    
    const { email, name, phone, role = 'passenger' } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Validar role
    const validRoles = ['admin', 'operator', 'carrier', 'driver', 'passenger']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Role inválido. Roles válidos: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({
        userId: existingUser.id,
        created: false,
        email: email.toLowerCase(),
        role,
        message: 'Usuário já existe'
      }, { status: 200 })
    }

    // Determinar company_id - usar do operador autenticado se operator, ou permitir admin criar sem company
    let companyId = authenticatedUser.companyId || null
    
    // Se é operator e não tem company_id, tentar buscar da tabela users (mas só se não for usuário mock)
    if (authenticatedUser.role === 'operator' && !companyId && authenticatedUser.id !== 'test-user-id') {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', authenticatedUser.id)
          .single()
        
        if (userData?.company_id) {
          companyId = userData.company_id
        }
      } catch (e) {
        console.warn('Erro ao buscar company_id do usuário:', e)
      }
    }
    
    // Se ainda não tem company_id e é operator (e não é usuário mock), retornar erro
    if (authenticatedUser.role === 'operator' && !companyId && authenticatedUser.id !== 'test-user-id') {
      return NextResponse.json(
        { 
          error: 'Operador deve estar associado a uma empresa',
          message: 'O operador autenticado não está associado a nenhuma empresa. Associe o operador a uma empresa antes de criar funcionários.'
        },
        { status: 400 }
      )
    }

    // Admin pode criar funcionários sem company_id (será null)
    // Operadores devem ter company_id
    // Em modo de teste, companyId pode ser null ou o valor padrão

    // Criar usuário no Supabase Auth com tratamento de erro robusto
    let authData
    try {
      const result = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: `temp_${Math.random().toString(36).slice(2)}`, // Senha temporária
        email_confirm: true,
        user_metadata: {
          name: name || email.split('@')[0],
          phone: phone || null,
          role
        },
        app_metadata: {
          role,
          company_id: companyId
        }
      })
      
      if (result.error) {
        console.error('Erro ao criar usuário no Auth:', result.error)
        return NextResponse.json(
          { 
            error: result.error.message || 'Erro ao criar usuário no sistema de autenticação',
            message: result.error.message || 'Não foi possível criar o usuário. Verifique se o email já existe ou se há problemas com o sistema de autenticação.',
            details: process.env.NODE_ENV === 'development' ? result.error : undefined
          },
          { status: 500 }
        )
      }
      
      if (!result.data?.user) {
        console.error('Usuário não retornado após criação no Auth')
        return NextResponse.json(
          { 
            error: 'Usuário não criado',
            message: 'O sistema de autenticação não retornou os dados do usuário criado'
          },
          { status: 500 }
        )
      }
      
      authData = result.data
    } catch (authException: any) {
      console.error('Exceção ao criar usuário no Auth:', authException)
      return NextResponse.json(
        { 
          error: 'Falha crítica ao criar usuário',
          message: authException.message || 'Erro inesperado ao comunicar com o sistema de autenticação',
          details: process.env.NODE_ENV === 'development' ? { 
            stack: authException.stack,
            ...authException 
          } : undefined
        },
        { status: 500 }
      )
    }

    // Criar registro na tabela users - tentar com campos opcionais primeiro
    const userData: any = {
      id: authData.user.id,
      email: email.toLowerCase(),
      role,
      company_id: companyId
    }

    // Tentar inserir com name e phone (podem não existir na tabela)
    try {
      if (name) userData.name = name
      if (phone) userData.phone = phone

      const { error: userError } = await supabase
        .from('users')
        .insert(userData)

      if (userError) {
        // Se erro por coluna não existir, tentar sem name/phone
        if (userError.message.includes('column') && userError.message.includes('does not exist')) {
          const { error: userError2 } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: email.toLowerCase(),
              role,
              company_id: companyId
            })

          if (userError2) {
            // Limpar usuário do auth se falhar
            await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
            console.error('Erro ao criar registro de usuário (sem campos opcionais):', userError2)
            return NextResponse.json(
              { 
                error: userError2.message || 'Erro ao criar registro de usuário',
                details: userError2
              },
              { status: 500 }
            )
          }
        } else {
          // Outro tipo de erro
          await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
          console.error('Erro ao criar registro de usuário:', userError)
          return NextResponse.json(
            { 
              error: userError.message || 'Erro ao criar registro de usuário',
              details: userError
            },
            { status: 500 }
          )
        }
      }
    } catch (e: any) {
      // Erro inesperado
      await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
      console.error('Erro inesperado ao criar funcionário:', e)
      return NextResponse.json(
        { 
          error: e.message || 'Erro desconhecido ao criar funcionário',
          details: e
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      userId: authData.user.id,
      created: true,
      email: email.toLowerCase(),
      role,
      companyId: companyId || undefined
    }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar funcionário:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Erro desconhecido',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

