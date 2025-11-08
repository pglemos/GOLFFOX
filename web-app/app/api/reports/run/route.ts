import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireCompanyAccess, requireAuth } from '@/lib/api-auth'
import Papa from 'papaparse'

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

// Report configurations
const REPORT_CONFIGS: Record<string, { viewName: string; columns: string[] }> = {
  delays: {
    viewName: 'v_reports_delays',
    columns: ['company_id', 'route_id', 'route_name', 'driver_id', 'driver_name', 'trip_date', 'scheduled_time', 'actual_time', 'delay_minutes', 'status']
  },
  occupancy: {
    viewName: 'v_reports_occupancy',
    columns: ['company_id', 'route_id', 'route_name', 'trip_date', 'time_slot', 'total_passengers', 'capacity', 'occupancy_rate']
  },
  not_boarded: {
    viewName: 'v_reports_not_boarded',
    columns: ['company_id', 'route_id', 'route_name', 'passenger_id', 'passenger_name', 'trip_date', 'scheduled_time', 'reason']
  },
  efficiency: {
    viewName: 'v_reports_efficiency',
    columns: ['company_id', 'route_id', 'route_name', 'period_start', 'period_end', 'total_trips', 'completed_trips', 'efficiency_rate', 'avg_delay']
  },
  driver_ranking: {
    viewName: 'v_reports_driver_ranking',
    columns: ['company_id', 'driver_id', 'driver_name', 'routes_completed', 'punctuality_score', 'efficiency_score', 'total_score', 'ranking']
  }
}

/**
 * Gera e retorna relatório em formato CSV, Excel ou PDF
 * POST /api/reports/run
 * Body: { reportKey, format, filters: { companyId, periodStart, periodEnd } }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { reportKey, format = 'csv', filters = {} } = body

    if (!reportKey || !REPORT_CONFIGS[reportKey]) {
      return NextResponse.json(
        { error: 'Relatório inválido' },
        { status: 400 }
      )
    }

    // ✅ Validar autenticação e acesso à empresa (se companyId fornecido)
    if (filters.companyId) {
      const { user, error: authError } = await requireCompanyAccess(request, filters.companyId)
      if (authError) {
        return authError
      }
    } else {
      // Se não há companyId, validar apenas autenticação
      const authError = await requireAuth(request, ['admin', 'operator'])
      if (authError) {
        return authError
      }
    }

    const config = REPORT_CONFIGS[reportKey]
    
    // Buscar dados da view
    let query = supabase.from(config.viewName).select('*')

    if (filters.companyId) {
      query = query.eq('company_id', filters.companyId)
    }
    if (filters.periodStart) {
      query = query.gte('period_start', filters.periodStart)
    }
    if (filters.periodEnd) {
      query = query.lte('period_end', filters.periodEnd)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar dados do relatório:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar dados do relatório' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado encontrado para o período selecionado' },
        { status: 404 }
      )
    }

    // Gerar arquivo conforme formato
    switch (format) {
      case 'csv':
        return generateCSV(data, config.columns, reportKey)
      
      case 'excel':
        return generateExcel(data, config.columns, reportKey)
      
      case 'pdf':
        return generatePDF(data, config.columns, reportKey)
      
      default:
        return NextResponse.json(
          { error: 'Formato não suportado' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}

// Formatar número para separador decimal BR (vírgula)
function formatNumberBR(value: any): string {
  if (value === null || value === undefined) return ''
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return String(value)
  // Formatar com vírgula como separador decimal
  return num.toFixed(2).replace('.', ',')
}

function generateCSV(data: any[], columns: string[], reportKey: string) {
  // Filtrar apenas colunas válidas e formatar números
  const filteredData = data.map(row => {
    const filtered: any = {}
    columns.forEach(col => {
      if (row[col] !== undefined) {
        // Formatar números com vírgula decimal
        const value = row[col]
        if (typeof value === 'number') {
          filtered[col] = formatNumberBR(value)
        } else {
          // Tentar converter strings numéricas
          const numMatch = String(value).match(/^(\d+\.?\d*)$/)
          if (numMatch) {
            filtered[col] = formatNumberBR(parseFloat(value))
          } else {
            filtered[col] = value
          }
        }
      }
    })
    return filtered
  })

  // Gerar CSV com BOM para UTF-8
  const csv = Papa.unparse(filteredData, {
    header: true,
    delimiter: ','
    // encoding não é suportado em UnparseConfig - BOM será adicionado manualmente
  })

  const filename = `relatorio_${reportKey}_${new Date().toISOString().split('T')[0]}.csv`

  // Adicionar BOM para Excel reconhecer UTF-8
  const csvWithBOM = '\ufeff' + csv

  return new NextResponse(csvWithBOM, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

async function generateExcel(data: any[], columns: string[], reportKey: string) {
  try {
    // Dynamic import para evitar bundle no client
    const XLSX = await import('xlsx')
    
    // Filtrar apenas colunas válidas
    const filteredData = data.map(row => {
      const filtered: any = {}
      columns.forEach(col => {
        if (row[col] !== undefined) {
          filtered[col] = row[col]
        }
      })
      return filtered
    })

    const worksheet = XLSX.utils.json_to_sheet(filteredData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório')

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const filename = `relatorio_${reportKey}_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Erro ao gerar Excel:', error)
    // Fallback para CSV
    return generateCSV(data, columns, reportKey)
  }
}

async function generatePDF(data: any[], columns: string[], reportKey: string) {
  try {
    // Dynamic import para PDFKit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PDFDocument = await import('pdfkit')
    
    // Criar documento PDF
    const chunks: Buffer[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = new (PDFDocument as any).default({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    })

    // Header
    doc.fontSize(18).text(`Relatório: ${reportKey}`, { align: 'center' })
    doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' })
    doc.moveDown()

    // Tabela
    const tableTop = doc.y
    const rowHeight = 20
    const colWidths = [150, 200, 150, 150] // Ajustar conforme necessário

    // Headers
    doc.fontSize(10).font('Helvetica-Bold')
    let x = 50
    columns.slice(0, 4).forEach((col, i) => {
      doc.text(col, x, tableTop, { width: colWidths[i] })
      x += colWidths[i]
    })
    doc.moveDown()

    // Rows
    doc.font('Helvetica')
    data.slice(0, 50).forEach((row, idx) => {
      if (doc.y > 750) {
        doc.addPage()
      }
      x = 50
      columns.slice(0, 4).forEach((col, i) => {
        const value = String(row[col] || '')
        doc.text(value.substring(0, 30), x, doc.y, { width: colWidths[i] })
        x += colWidths[i]
      })
      doc.moveDown(rowHeight)
    })

    // Footer
    doc.fontSize(8).text(`Total de registros: ${data.length}`, { align: 'center' })

    doc.end()

    // Coletar chunks
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    
    return new Promise<NextResponse>((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        const filename = `relatorio_${reportKey}_${new Date().toISOString().split('T')[0]}.pdf`

        resolve(new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`
          }
        }))
      })
    })
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    // Fallback para CSV
    return generateCSV(data, columns, reportKey)
  }
}

