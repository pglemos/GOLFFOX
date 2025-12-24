import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

import { requireCompanyAccess } from '@/lib/api-auth'
import { logger } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { getSupabaseAdmin } from '@/lib/supabase-client'

// Usar getSupabaseAdmin de supabase-client.ts (importado acima)

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@golffox.com'

interface ReportData {
  headers: string[]
  rows: unknown[][]
}

/**
 * Formata dados de relatório de atrasos
 */
function formatDelaysReport(data: Record<string, unknown>[]): ReportData {
  return {
    headers: ['Data', 'Rota', 'Viagem', 'Atraso (min)', 'Motivo'],
    rows: data.map(row => [
      row.date || '-',
      row.route_name || '-',
      row.trip_id || '-',
      row.delay_minutes || 0,
      row.reason || '-'
    ])
  }
}

/**
 * Formata dados de relatório de ocupação
 */
function formatOccupancyReport(data: Record<string, unknown>[]): ReportData {
  return {
    headers: ['Data', 'Horário', 'Rota', 'Ocupação Média', 'Capacidade'],
    rows: data.map(row => [
      row.date || '-',
      row.hour || '-',
      row.route_name || '-',
      row.avg_occupancy || 0,
      row.capacity || 0
    ])
  }
}

/**
 * Formata dados de relatório de não embarcados
 */
function formatNotBoardedReport(data: Record<string, unknown>[]): ReportData {
  return {
    headers: ['Data', 'Passageiro', 'Rota', 'Motivo', 'Frequência'],
    rows: data.map(row => [
      row.date || '-',
      row.passenger_name || '-',
      row.route_name || '-',
      row.reason || '-',
      row.frequency || 0
    ])
  }
}

/**
 * Gera CSV a partir de dados do relatório
 */
function generateCSV(reportData: ReportData): string {
  const lines = [
    reportData.headers.join(','),
    ...reportData.rows.map(row =>
      row.map(cell => {
        const str = String(cell || '')
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(',')
    )
  ]
  return lines.join('\n')
}

/**
 * Envia email via Resend
 */
async function sendEmailResend(
  to: string[],
  subject: string,
  body: string,
  attachment?: { filename: string; content: string; contentType: string }
) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY não configurada')
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: SMTP_FROM,
      to,
      subject,
      html: body.replace(/\n/g, '<br>'),
      attachments: attachment ? [{
        filename: attachment.filename,
        content: Buffer.from(attachment.content).toString('base64'),
        content_type: attachment.contentType
      }] : undefined
    })
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Resend API error: ${error}`)
  }

  return await res.json()
}

/**
 * Envia email via SMTP (simplificado - usar biblioteca nodemailer em produção)
 */
async function sendEmailSMTP(
  to: string[],
  subject: string,
  body: string,
  attachment?: { filename: string; content: string; contentType: string }
) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return { success: false, error: 'smtp_not_configured' }
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  const mail = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html: body.replace(/\n/g, '<br>'),
    attachments: attachment ? [{
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    }] : undefined,
  })
  return { success: true, id: mail.messageId }
}

/**
 * POST /api/reports/dispatch
 * Dispatch de relatórios agendados (chamado via Vercel Cron ou manual)
 */
async function dispatchPostHandler(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { companyId, reportKey, format = 'csv' } = body

    if (!companyId || !reportKey) {
      return NextResponse.json(
        { error: 'companyId e reportKey são obrigatórios' },
        { status: 400 }
      )
    }

    // ✅ Validar autenticação e acesso à empresa
    const { user, error: authError } = await requireCompanyAccess(request, companyId)
    if (authError) {
      return authError
    }

    // Buscar configuração do schedule (se houver) - selecionar apenas colunas necessárias
    const scheduleColumns = 'id,empresa_id,report_key,cron,recipients,is_active'
    const { data: schedule } = await supabase
      .from('gf_report_schedules')
      .select(scheduleColumns)
      .eq('empresa_id', companyId)
      .eq('report_key', reportKey)
      .eq('is_active', true)
      .maybeSingle()

    // Determinar view segura baseada no reportKey
    const viewMap: Record<string, string> = {
      'delays': 'v_reports_delays_secure',
      'occupancy': 'v_reports_occupancy_secure',
      'not_boarded': 'v_reports_not_boarded_secure',
      'efficiency': 'v_reports_efficiency_secure',
      'roi_sla': 'v_reports_roi_sla_secure'
    }

    const viewName = viewMap[reportKey]
    if (!viewName) {
      return NextResponse.json(
        { error: `Report key inválido: ${reportKey}` },
        { status: 400 }
      )
    }

    // Buscar dados da view segura (view materializada - selecionar todas as colunas dinamicamente)
    // Para views de relatórios, selecionamos todas as colunas pois são agregadas e variam por tipo
    // Mas podemos otimizar limitando a quantidade de dados retornados
    const { data, error } = await supabase
      .from(viewName as 'v_reports_delays_secure' | 'v_reports_occupancy_secure' | 'v_reports_not_boarded_secure' | 'v_reports_efficiency_secure' | 'v_reports_roi_sla_secure')
      .select('*')
      .eq('empresa_id', companyId)
      .limit(1000)

    if (error) throw error

    // Formatar dados
    const formatters: Record<string, (data: Record<string, unknown>[]) => ReportData> = {
      'delays': formatDelaysReport,
      'occupancy': formatOccupancyReport,
      'not_boarded': formatNotBoardedReport,
      'efficiency': (d) => ({
        headers: Object.keys(d[0] || {}),
        rows: d.map(r => Object.values(r))
      }),
      'roi_sla': (d) => ({
        headers: Object.keys(d[0] || {}),
        rows: d.map(r => Object.values(r))
      })
    }

    const formatter = formatters[reportKey] || ((d) => ({
      headers: Object.keys(d[0] || {}),
      rows: d.map(r => Object.values(r))
    }))

    const reportData = formatter((data || []) as unknown as Record<string, unknown>[])

    // Gerar CSV (formato mais comum)
    const csvContent = generateCSV(reportData)
    const filename = `${reportKey}_${companyId}_${new Date().toISOString().split('T')[0]}.csv`

    // Determinar destinatários
    const recipients = Array.isArray(schedule?.recipients) ? schedule.recipients as string[] : (schedule?.recipients ? [schedule.recipients as string] : [])

    // Enviar email se houver destinatários
    if (recipients.length > 0) {
      try {
        if (RESEND_API_KEY) {
          await sendEmailResend(
            recipients,
            `Relatório ${reportKey} - ${new Date().toLocaleDateString('pt-BR')}`,
            `Segue em anexo o relatório ${reportKey} gerado em ${new Date().toLocaleString('pt-BR')}.`,
            {
              filename,
              content: csvContent,
              contentType: 'text/csv'
            }
          )
        } else if (SMTP_HOST) {
          await sendEmailSMTP(
            recipients,
            `Relatório ${reportKey} - ${new Date().toLocaleDateString('pt-BR')}`,
            `Segue em anexo o relatório ${reportKey} gerado em ${new Date().toLocaleString('pt-BR')}.`,
            {
              filename,
              content: csvContent,
              contentType: 'text/csv'
            }
          )
        }
      } catch (emailError) {
        logger.error('Erro ao enviar email', { error: emailError }, 'DispatchReportsAPI')
        // Não falhar a operação se email falhar
      }
    }

    // Registrar no histórico
    await supabase
      .from('gf_report_history')
      .insert({
        empresa_id: companyId,
        report_key: reportKey,
        format,
        recipients: recipients,
        status: 'completed',
        generated_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      filename,
      rows: reportData.rows.length,
      recipients_sent: recipients.length,
      generated_at: new Date().toISOString()
    })
  } catch (err) {
    logger.error('Erro ao gerar/dispatch relatório', { error: err }, 'ReportsDispatchAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar relatório'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reports/dispatch
 * Listar relatórios agendados (para debug/admin)
 */
async function dispatchGetHandler(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    let query = supabase
      .from('gf_report_schedules')
      .select('*, gf_report_history(*)')
      .eq('is_active', true)

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ schedules: data || [] })
  } catch (err) {
    logger.error('Erro ao listar schedules', { error: err }, 'DispatchReportsAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro ao listar schedules'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(dispatchPostHandler, 'sensitive')
export const GET = withRateLimit(dispatchGetHandler, 'api')
