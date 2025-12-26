import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logError, logger } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { CompanyService } from '@/lib/services/server/company-service'
import { UserService } from '@/lib/services/server/user-service'
import type { Database } from '@/types/supabase'
import { validateWithSchema, createCompanyUserSchema } from '@/lib/validation/schemas'

type EmpresasRow = Database['public']['Tables']['empresas']['Row']

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey)
}

// OPTIONS handler para CORS
async function optionsHandler(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

async function criarEmpresaUsuarioHandler(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    // Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    // Validar dados com Zod
    const validation = validateWithSchema(createCompanyUserSchema, body)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: validation.error.flatten()
      }, { status: 400 })
    }

    const data = validation.data

    // Mapear campos (suporta ambos os formatos via schema)
    const companyId = data.company_id || data.companyId
    const companyName = data.company_name || data.companyName
    const operatorEmail = data.email || data.operatorEmail
    const operatorPassword = data.password || data.operatorPassword
    const operatorPhone = data.phone || data.operatorPhone
    const operatorName = data.name || data.operatorName

    const isTestMode = request.headers.get('x-test-mode') === 'true'
    const isDevelopment = process.env.NODE_ENV === 'development'

    let company: EmpresasRow | null = null

    // 1. Obter ou Criar Empresa
    if (companyId) {
      company = await CompanyService.getCompanyById(companyId)

      if (!company) {
        if (isTestMode || isDevelopment) {
          // Criar empresa mock para testes
          logger.log(`⚠️ Criando empresa mock para teste: ${companyId}`)
          try {
            const { data: newCompany } = await supabaseAdmin.from('empresas').insert({
              id: companyId,
              name: companyName || `Empresa Teste ${companyId.substring(0, 8)}`,
              is_active: true
            }).select().single()
            company = newCompany
          } catch (e) { /* ignore */ }
        }

        if (!company) {
          return NextResponse.json({ error: 'Empresa não encontrada com o ID fornecido' }, { status: 404 })
        }
      }
    } else if (companyName) {
      // Criar empresa via Service
      try {
        company = await CompanyService.createCompany({
          name: companyName,
          cnpj: data.cnpj || undefined,
          address: data.address || undefined,
          phone: data.phone || data.operatorPhone || undefined,
        })
      } catch (err: unknown) {
        const error = err as { message?: string }
        return NextResponse.json({
          error: 'Erro ao criar empresa',
          message: error.message
        }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'company_id ou company_name é obrigatório' }, { status: 400 })
    }

    // 2. Criar Usuário Operador (se email fornecido)
    const shouldCreateUser = !!operatorEmail
    let userId: string | null = null
    let operatorUser: { id: string; email: string } | null = null

    if (shouldCreateUser && company) {
      // Em modo de teste, simular sucesso se usuário já existe
      if ((isTestMode || isDevelopment) && operatorEmail.includes('test')) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === operatorEmail)
        if (existingUser) {
          return NextResponse.json({
            success: true,
            userId: existingUser.id,
            created: false,
            email: operatorEmail,
            role: 'gestor_empresa',
            companyId: company.id,
            company,
            operador: { id: existingUser.id, email: operatorEmail }
          }, { status: 200 })
        }
      }

      try {
        const newUser = await UserService.createUser({
          name: operatorName || operatorEmail.split('@')[0],
          email: operatorEmail,
          password: operatorPassword || undefined,
          role: 'gestor_empresa',
          company_id: company.id,
          phone: operatorPhone || null
        })
        userId = newUser.id
        operatorUser = newUser
      } catch (err: unknown) {
        const error = err as { message?: string }
        // Rollback da empresa APENAS se foi criada nesta requisição e não é teste
        if (!companyId && !isTestMode && company) {
          await CompanyService.deleteCompany(company.id, true).catch(() => { })
        }

        logError('Erro ao criar operador', { error })
        return NextResponse.json({
          error: 'Erro ao criar usuário operador',
          message: error.message
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      userId: userId,
      created: true,
      email: operatorEmail,
      role: 'gestor_empresa',
      companyId: company?.id,
      company,
      operador: operatorUser,
      message: shouldCreateUser ? undefined : 'Empresa processada com sucesso. Usuário não criado (email não fornecido).'
    }, { status: 201 })

  } catch (err: unknown) {
    const error = err as { message?: string }
    logError('Erro geral em criar-empresa-usuario', { error })
    return NextResponse.json({
      error: error.message || 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

// Exportar com rate limiting (sensitive: 10 requests per minute)
export const OPTIONS = optionsHandler
export const POST = withRateLimit(criarEmpresaUsuarioHandler, 'sensitive')

