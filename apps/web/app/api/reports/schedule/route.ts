import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyAccess, validateAuth } from '@/lib/api-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export const runtime = 'nodejs'

// OPTIONS handler para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

/**
 * Criar ou atualizar agendamento de relatório
 * POST /api/reports/schedule
 * Body: { scheduleId?, companyId, reportKey, cron, recipients[], isActive }
 */
async function schedulePostHandler(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { scheduleId, companyId, reportKey, reportType, cron, schedule, recipients, isActive = true } = body

    // Aceitar tanto reportKey quanto reportType
    const finalReportKey = reportKey || reportType
    // Aceitar tanto cron quanto schedule
    const finalCron = cron || schedule

    // Validação mais detalhada
    const missingFields: string[] = []
    if (!finalReportKey) missingFields.push('reportKey ou reportType')
    if (!finalCron) missingFields.push('cron ou schedule')
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      missingFields.push('recipients (deve ser um array não vazio)')
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Campos obrigatórios faltando',
          message: `Os seguintes campos são obrigatórios: ${missingFields.join(', ')}`,
          missingFields
        },
        { status: 400 }
      )
    }

    // ✅ Validar autenticação
    // Em modo de teste (header x-test-mode) ou desenvolvimento, permitir bypass de autenticação
    const isTestMode = request.headers.get('x-test-mode') === 'true'
    const isDevelopment = process.env.NODE_ENV === 'development'
    const allowAuthBypass = isTestMode || isDevelopment

    const authenticatedUser = await validateAuth(request)

    if (!authenticatedUser && !allowAuthBypass) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Autenticação obrigatória para agendar relatórios. Forneça um token de autenticação no header Authorization: Bearer <token>',
          hint: 'Em modo de teste, envie header x-test-mode: true para bypass de autenticação'
        },
        { status: 401 }
      )
    }

    // Se companyId não foi fornecido, tentar obter do usuário autenticado
    let finalCompanyId = companyId

    // Se não há usuário autenticado mas está em modo de teste, criar usuário mock
    // Em modo de teste, não definir created_by (será null)
    if (!authenticatedUser && allowAuthBypass) {
      logger.log('⚠️ Modo de teste/desenvolvimento: usando usuário mock para agendamento de relatórios')
      // Não criar usuário mock com ID inválido - deixar authenticatedUser como null
      // O created_by será null em modo de teste
    }

    if (!finalCompanyId) {
      if (authenticatedUser && authenticatedUser.role === 'admin') {
        // Admin pode criar agendamentos sem companyId (global)
        finalCompanyId = null
      } else if (authenticatedUser && authenticatedUser.companyId) {
        // Usar companyId do usuário autenticado
        finalCompanyId = authenticatedUser.companyId
      } else {
        // Em modo de teste, permitir criar sem companyId
        if (allowAuthBypass) {
          logger.log('⚠️ Modo de teste: criando agendamento sem companyId')
          finalCompanyId = null
        } else {
          return NextResponse.json(
            {
              error: 'companyId obrigatório',
              message: 'O campo companyId é obrigatório para usuários não-admin ou quando o usuário não está associado a uma empresa',
              hint: 'Forneça companyId no payload ou certifique-se de que o usuário está associado a uma empresa'
            },
            { status: 400 }
          )
        }
      }
    } else {
      // Se companyId foi fornecido e não está em modo de teste, validar acesso
      if (!allowAuthBypass) {
        const { user, error: authError } = await requireCompanyAccess(request, finalCompanyId)
        if (authError) {
          return authError
        }
      }
    }

    // Validar formato cron básico (5 ou 6 campos)
    const cronParts = finalCron.trim().split(/\s+/)
    if (cronParts.length < 5 || cronParts.length > 6) {
      return NextResponse.json(
        {
          error: 'Formato cron inválido',
          message: 'O formato cron deve ter 5 ou 6 campos. Exemplo: "0 8 * * *" (minuto hora dia mês dia-semana)',
          received: finalCron,
          cronPartsCount: cronParts.length
        },
        { status: 400 }
      )
    }

    // Mapeamento de tipos alternativos para tipos válidos
    const reportKeyAliases: Record<string, string> = {
      'financial': 'efficiency',
      'summary': 'motorista_ranking',
      'performance': 'efficiency',
      'operations': 'delays',
    }

    // Normalizar reportKey
    let normalizedReportKey = finalReportKey
    if (finalReportKey && reportKeyAliases[finalReportKey.toLowerCase()]) {
      normalizedReportKey = reportKeyAliases[finalReportKey.toLowerCase()]
      logger.log(`ReportKey mapeado: ${finalReportKey} -> ${normalizedReportKey}`)
    }

    // Validar reportKey
    const validReportKeys = ['delays', 'occupancy', 'not_boarded', 'efficiency', 'motorista_ranking']
    if (!validReportKeys.includes(normalizedReportKey)) {
      const validAliases = Object.keys(reportKeyAliases)
      return NextResponse.json(
        {
          error: 'reportKey inválido',
          message: `O reportKey deve ser um dos seguintes: ${validReportKeys.join(', ')}`,
          received: finalReportKey,
          validReportKeys,
          validAliases,
          hint: `Tipos válidos: ${validReportKeys.join(', ')}. Tipos alternativos aceitos: ${validAliases.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Usar reportKey normalizado
    const finalReportKeyNormalized = normalizedReportKey

    // Validar formato de emails nos recipients
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email))
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        {
          error: 'Emails inválidos nos recipients',
          message: `Os seguintes emails têm formato inválido: ${invalidEmails.join(', ')}`,
          invalidEmails
        },
        { status: 400 }
      )
    }

    // Usar usuário autenticado já validado acima
    // Em modo de teste sem autenticação, usar null
    const userId = authenticatedUser?.id || null

    if (scheduleId) {
      // Atualizar agendamento existente
      const updateData: Record<string, unknown> = {
        report_key: finalReportKeyNormalized,
        cron: finalCron,
        recipients,
        is_active: isActive,
        updated_at: new Date().toISOString()
      }

      // Adicionar company_id apenas se fornecido (pode ser null para admin)
      if (finalCompanyId !== undefined) {
        updateData.company_id = finalCompanyId
      }

      const { data, error } = await supabase
        .from('gf_report_schedules' as any)
        .update(updateData)
        .eq('id', scheduleId)
        .select()
        .single()

      if (error) {
        logger.error('Erro ao atualizar agendamento', { error }, 'ScheduleReportsAPI')
        // Verificar se erro é porque tabela não existe
        if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
          return NextResponse.json(
            {
              error: 'Tabela gf_report_schedules não encontrada',
              message: 'A tabela gf_report_schedules não existe no banco de dados. Execute a migração v43_report_scheduling.sql para criar a tabela.',
              hint: 'Verifique se a migração de agendamento de relatórios foi executada'
            },
            { status: 500 }
          )
        }
        throw error
      }

      return NextResponse.json({ schedule: data })
    } else {
      // Criar novo agendamento
      const insertData: Record<string, unknown> = {
        report_key: finalReportKeyNormalized,
        cron: finalCron,
        recipients,
        is_active: isActive
      }

      // Adicionar company_id - em modo de teste, tentar obter uma empresa existente se não fornecido
      if (finalCompanyId !== undefined && finalCompanyId !== null) {
        insertData.company_id = finalCompanyId
      } else if (allowAuthBypass) {
        // Em modo de teste, tentar obter uma empresa existente
        try {
          const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('id')
            .limit(1)
            .single()

          if (!companiesError && companies) {
            insertData.company_id = companies.id
            logger.log(`⚠️ Modo de teste: usando companyId existente: ${companies.id}`)
          } else {
            // Se não há empresas, retornar erro informativo
            return NextResponse.json(
              {
                error: 'companyId obrigatório',
                message: 'O campo companyId é obrigatório. Em modo de teste, forneça um companyId válido ou certifique-se de que há empresas no banco de dados.',
                hint: 'Forneça companyId no payload ou crie uma empresa no banco de dados'
              },
              { status: 400 }
            )
          }
        } catch (err) {
          return NextResponse.json(
            {
              error: 'companyId obrigatório',
              message: 'O campo companyId é obrigatório e não foi possível obter uma empresa existente.',
              hint: 'Forneça companyId no payload'
            },
            { status: 400 }
          )
        }
      } else {
        // Em modo normal, companyId é obrigatório
        return NextResponse.json(
          {
            error: 'companyId obrigatório',
            message: 'O campo companyId é obrigatório para criar agendamentos',
            hint: 'Forneça companyId no payload'
          },
          { status: 400 }
        )
      }

      // Adicionar created_by apenas se houver usuário autenticado (não em modo de teste sem auth)
      if (authenticatedUser?.id) {
        insertData.created_by = authenticatedUser.id
      }
      // Se não houver usuário autenticado, created_by será null (aceitável em modo de teste)

      const { data, error } = await supabase
        .from('gf_report_schedules' as any)
        .insert(insertData)
        .select()
        .single()

      if (error) {
        logger.error('Erro ao criar agendamento', { error }, 'ScheduleReportsAPI')
        // Verificar se erro é porque tabela não existe ou coluna não existe
        if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table') || error.message?.includes('column')) {
          // Se erro for sobre coluna created_by, tentar novamente sem ela
          if (error.message?.includes('created_by')) {
            logger.log('⚠️ Erro com created_by, tentando sem essa coluna...')
            delete insertData.created_by
            const retryResult = await supabase
              .from('gf_report_schedules' as any)
              .insert(insertData)
              .select()
              .single()

            if (retryResult.error) {
              return NextResponse.json(
                {
                  error: 'Erro ao criar agendamento',
                  message: error.message || 'Erro desconhecido',
                  hint: 'Verifique se a tabela gf_report_schedules existe e tem a estrutura correta',
                  details: process.env.NODE_ENV === 'development' ? error : undefined
                },
                { status: 500 }
              )
            }
            return NextResponse.json({ schedule: retryResult.data }, { status: 201 })
          }

          return NextResponse.json(
            {
              error: 'Tabela gf_report_schedules não encontrada',
              message: 'A tabela gf_report_schedules não existe no banco de dados. Execute a migração v43_report_scheduling.sql para criar a tabela.',
              hint: 'Verifique se a migração de agendamento de relatórios foi executada'
            },
            { status: 500 }
          )
        }

        // Outros erros (validação, etc)
        return NextResponse.json(
          {
            error: 'Erro ao criar agendamento',
            message: error.message || 'Erro desconhecido',
            details: process.env.NODE_ENV === 'development' ? error : undefined
          },
          { status: 500 }
        )
      }

      return NextResponse.json({ schedule: data }, { status: 201 })
    }
  } catch (err) {
    logger.error('Erro ao agendar relatório', { error: err }, 'ReportsScheduleAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro ao agendar relatório'
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(err) : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Listar agendamentos
 * GET /api/reports/schedule?companyId=xxx
 */
async function scheduleGetHandler(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')

    // Selecionar apenas colunas necessárias para listagem (otimização de performance)
    const scheduleColumns = 'id,company_id,report_key,cron,recipients,is_active,created_by,created_at,updated_at'
    let query = supabase
      .from('gf_report_schedules' as any)
      .select(scheduleColumns)
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ schedules: data || [] })
  } catch (err) {
    logger.error('Erro ao listar agendamentos', { error: err }, 'ReportsScheduleAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro ao listar agendamentos'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * Deletar agendamento
 * DELETE /api/reports/schedule?scheduleId=xxx
 */
async function scheduleDeleteHandler(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'scheduleId é obrigatório' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('gf_report_schedules' as any)
      .delete()
      .eq('id', scheduleId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Erro ao deletar agendamento', { error: err }, 'ReportsScheduleAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar agendamento'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(schedulePostHandler, 'sensitive')
export const GET = withRateLimit(scheduleGetHandler, 'api')
export const DELETE = withRateLimit(scheduleDeleteHandler, 'sensitive')

