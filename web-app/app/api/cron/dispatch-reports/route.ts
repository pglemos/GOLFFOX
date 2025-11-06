import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { alertCronFailure } from '@/lib/operational-alerts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/**
 * Cron job para despachar relatórios agendados
 * Executado via Vercel Cron: /api/cron/dispatch-reports
 * Verifica agendamentos ativos e executa relatórios conforme cron
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se é uma requisição do cron (Vercel)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Buscar agendamentos ativos
    const { data: schedules, error: schedulesError } = await supabase
      .from('gf_report_schedules')
      .select('*')
      .eq('is_active', true)

    if (schedulesError) throw schedulesError

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ message: 'Nenhum agendamento ativo', processed: 0 })
    }

    const now = new Date()
    const results = []

    for (const schedule of schedules) {
      try {
        // Verificar se deve executar baseado no cron
        if (!shouldExecuteCron(schedule.cron, now)) {
          continue
        }

        // Gerar relatório
        const reportResult = await generateAndDispatchReport(schedule)

        results.push({
          scheduleId: schedule.id,
          status: reportResult.success ? 'completed' : 'failed',
          error: reportResult.error
        })
      } catch (error: any) {
        console.error(`Erro ao processar agendamento ${schedule.id}:`, error)
        
        // Registrar alerta operacional
        await alertCronFailure(
          `dispatch-reports-${schedule.id}`,
          error.message,
          { schedule_id: schedule.id, report_key: schedule.report_key }
        )
        
        results.push({
          scheduleId: schedule.id,
          status: 'failed',
          error: error.message
        })
      }
    }

    return NextResponse.json({
      message: 'Processamento concluído',
      processed: results.length,
      results
    })
  } catch (error: any) {
    console.error('Erro no cron de relatórios:', error)
    
    // Registrar alerta crítico
    await alertCronFailure('dispatch-reports', error.message || 'Erro ao processar agendamentos')
    
    return NextResponse.json(
      { error: error.message || 'Erro ao processar agendamentos' },
      { status: 500 }
    )
  }
}

/**
 * Verifica se um cron deve executar agora
 * Implementação simplificada - apenas verifica se é o horário correto
 */
function shouldExecuteCron(cron: string, now: Date): boolean {
  const parts = cron.trim().split(/\s+/)
  
  if (parts.length < 5) return false

  // Formato: minuto hora dia mês dia-semana
  const [minute, hour, day, month, dayOfWeek] = parts

  // Verificação básica (implementação completa requer parser de cron)
  const nowMinute = now.getMinutes().toString()
  const nowHour = now.getHours().toString()
  const nowDay = now.getDate().toString()
  const nowMonth = (now.getMonth() + 1).toString()
  const nowDayOfWeek = now.getDay().toString()

  // Aceitar "*" ou correspondência exata
  const matches = (
    (minute === '*' || minute === nowMinute) &&
    (hour === '*' || hour === nowHour) &&
    (day === '*' || day === nowDay) &&
    (month === '*' || month === nowMonth) &&
    (dayOfWeek === '*' || dayOfWeek === nowDayOfWeek)
  )

  return matches
}

/**
 * Gera relatório e envia por email
 */
async function generateAndDispatchReport(schedule: any) {
  try {
    // Gerar relatório via API interna
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const reportResponse = await fetch(`${baseUrl}/api/reports/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        reportKey: schedule.report_key,
        format: 'excel', // Padrão para agendamentos
        filters: {
          companyId: schedule.company_id
        }
      })
    })

    if (!reportResponse.ok) {
      const error = await reportResponse.json()
      throw new Error(error.error || 'Erro ao gerar relatório')
    }

    // Obter arquivo
    const fileBuffer = await reportResponse.arrayBuffer()
    const fileName = `relatorio_${schedule.report_key}_${new Date().toISOString().split('T')[0]}.xlsx`

    // Salvar no Storage
    const storagePath = `reports/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${schedule.id}_${Date.now()}.xlsx`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: false
      })

    if (uploadError) {
      console.warn('Erro ao salvar no Storage, continuando com email:', uploadError)
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('reports')
      .getPublicUrl(storagePath)

    // Registrar no histórico
    const { data: historyData, error: historyError } = await supabase
      .from('gf_report_history')
      .insert({
        schedule_id: schedule.id,
        company_id: schedule.company_id,
        report_key: schedule.report_key,
        file_url: publicUrl || null,
        file_storage_path: storagePath,
        status: 'completed',
        recipients: schedule.recipients,
        format: 'excel',
        record_count: 0, // Seria calculado do relatório
        file_size_bytes: fileBuffer.byteLength
      })
      .select()
      .single()

    if (historyError) {
      console.error('Erro ao registrar histórico:', historyError)
    }

    // Enviar por email (se Resend configurado)
    if (resend && schedule.recipients.length > 0) {
      const fromEmail = process.env.REPORTS_FROM_EMAIL || 'noreply@example.com'
      const bcc = process.env.REPORTS_BCC ? [process.env.REPORTS_BCC] : undefined

      await resend.emails.send({
        from: fromEmail,
        to: schedule.recipients,
        bcc,
        subject: `Relatório: ${schedule.report_key} - ${new Date().toLocaleDateString('pt-BR')}`,
        html: `
          <h2>Relatório Automático</h2>
          <p>Segue em anexo o relatório <strong>${schedule.report_key}</strong> gerado automaticamente.</p>
          <p>Data de geração: ${new Date().toLocaleString('pt-BR')}</p>
          ${publicUrl ? `<p><a href="${publicUrl}">Download direto</a></p>` : ''}
        `,
        attachments: [{
          filename: fileName,
          content: Buffer.from(fileBuffer)
        }]
      })
    } else if (!resend) {
      console.warn('Resend não configurado, relatório salvo apenas no Storage')
    }

    return { success: true, historyId: historyData?.id }
  } catch (error: any) {
    // Registrar erro no histórico
    await supabase
      .from('gf_report_history')
      .insert({
        schedule_id: schedule.id,
        company_id: schedule.company_id,
        report_key: schedule.report_key,
        status: 'failed',
        error_message: error.message,
        recipients: schedule.recipients
      })

    return { success: false, error: error.message }
  }
}

