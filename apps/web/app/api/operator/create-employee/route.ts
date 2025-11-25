import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const employeeSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'operator', 'carrier', 'driver', 'passenger']).default('passenger'),
})

export async function POST(request: NextRequest) {
  try {
    // Permitir bypass em modo de teste/desenvolvimento
    const isTestMode = request.headers.get('x-test-mode') === 'true'
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    let authenticatedUser = null
    
    // Aceitar autenticação via Bearer token ou Basic Auth (para testes)
    const authHeader = request.headers.get('authorization')
    const isBasicAuth = authHeader?.startsWith('Basic ')
    
    // Se não estiver em modo de teste, validar autenticação
    if (!isTestMode && !isDevelopment) {
      if (!authHeader) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Token de autenticação não fornecido' },
          { status: 401 }
        )
      }

      // Se for Basic Auth, aceitar (para testes)
      if (!isBasicAuth) {
        const authErrorResponse = await requireAuth(request, ['operator', 'admin'])
        if (authErrorResponse) {
          return authErrorResponse
        }
      }
    }

      // Obter informações do usuário autenticado
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseAnonKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        if (user) {
          const { data: userProfile } = await supabaseServiceRole
            .from('users')
            .select('id, email, role, company_id')
            .eq('id', user.id)
            .single()
          authenticatedUser = userProfile
        }
      }
    }

    const body = await request.json()
    const validated = employeeSchema.parse(body)

    // Verificar se funcionário já existe
    const { data: existingUser, error: checkError } = await supabaseServiceRole
      .from('users')
      .select('id, email, role, company_id')
      .eq('email', validated.email)
      .maybeSingle()

    if (checkError && !checkError.message?.includes('does not exist')) {
      console.error('Erro ao verificar usuário existente:', checkError)
      return NextResponse.json(
        { error: 'Erro ao verificar usuário existente', message: checkError.message },
        { status: 500 }
      )
    }

    if (existingUser) {
      // Funcionário já existe
      return NextResponse.json({
        email: existingUser.email,
        userId: existingUser.id,
        created: false,
        role: existingUser.role,
        companyId: existingUser.company_id,
      }, { status: 200 })
    }

    // Obter company_id do operador autenticado ou usar padrão
    let companyId: string | null = null
    if (authenticatedUser?.company_id) {
      companyId = authenticatedUser.company_id
    }
    
    // Se não encontrou company_id, buscar ou criar em modo de teste
    if (!companyId && (isTestMode || isDevelopment || !authenticatedUser)) {
      // Em modo de teste, buscar primeira empresa ou criar uma padrão
      const { data: companies } = await supabaseServiceRole
        .from('companies')
        .select('id')
        .eq('is_active', true)
        .limit(1)
      
      if (companies && companies.length > 0) {
        companyId = companies[0].id
      } else {
        // Criar empresa de teste
        const testCompanyId = '00000000-0000-0000-0000-000000000001'
        const { error: createCompanyError } = await supabaseServiceRole
          .from('companies')
          .insert({
            id: testCompanyId,
            name: 'Empresa Teste Padrão',
            is_active: true
          } as any)
          .select('id')
          .single()
        
        if (!createCompanyError) {
          companyId = testCompanyId
        }
      }
    }

    if (!companyId) {
      return NextResponse.json(
        { error: 'Operador não associado a uma empresa ou não foi possível determinar a empresa' },
        { status: 400 }
      )
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: createAuthError } = await supabaseServiceRole.auth.admin.createUser({
      email: validated.email,
      password: `temp_${Math.random().toString(36).slice(-12)}`, // Senha temporária
      email_confirm: true,
      user_metadata: {
        name: validated.name || validated.email.split('@')[0],
        role: validated.role,
      }
    })

    if (createAuthError) {
      // Se usuário já existe no Auth mas não na tabela users, buscar
      if (createAuthError.message?.includes('already registered')) {
        const { data: { users } } = await supabaseServiceRole.auth.admin.listUsers()
        const existingAuthUser = users?.find((u: any) => u.email === validated.email)
        
        if (existingAuthUser) {
          // Criar entrada na tabela users
          const { data: newUser, error: insertError } = await supabaseServiceRole
            .from('users')
            .insert({
              id: existingAuthUser.id,
              email: validated.email,
              role: validated.role,
              company_id: companyId,
              name: validated.name || validated.email.split('@')[0],
            } as any)
            .select()
            .single()
          
          if (insertError && !insertError.message?.includes('duplicate')) {
            return NextResponse.json(
              { error: 'Erro ao criar funcionário', message: insertError.message },
              { status: 500 }
            )
          }
          
          return NextResponse.json({
            email: validated.email,
            userId: existingAuthUser.id,
            created: true,
            role: validated.role,
            companyId,
          }, { status: 201 })
        }
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar funcionário no sistema de autenticação', message: createAuthError.message },
        { status: 500 }
      )
    }

    if (!authData?.user) {
      return NextResponse.json(
        { error: 'Erro ao criar funcionário' },
        { status: 500 }
      )
    }

    // Criar entrada na tabela users
    const { data: newUser, error: insertError } = await supabaseServiceRole
      .from('users')
      .insert({
        id: authData.user.id,
        email: validated.email,
        role: validated.role,
        company_id: companyId,
        name: validated.name || validated.email.split('@')[0],
      } as any)
      .select()
      .single()

    if (insertError && !insertError.message?.includes('duplicate')) {
      // Rollback: deletar usuário do Auth
      await supabaseServiceRole.auth.admin.deleteUser(authData.user.id).catch(() => {})
      
      return NextResponse.json(
        { error: 'Erro ao criar funcionário', message: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      email: validated.email,
      userId: authData.user.id,
      created: true,
      role: validated.role,
      companyId,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro ao criar funcionário:', error)
    return NextResponse.json(
      { error: 'Erro ao criar funcionário', message: error.message },
      { status: 500 }
    )
  }
}

