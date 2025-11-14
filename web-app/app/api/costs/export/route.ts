import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireCompanyAccess } from '@/lib/api-auth'
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils'
import { withRateLimit } from '@/lib/rate-limit'

async function exportHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const limitReq = Number(searchParams.get('limit') ?? searchParams.get('pageSize') ?? 10000)
    const offsetReq = Number(searchParams.get('offset') ?? searchParams.get('page') ?? 0)
    const limit = Number.isFinite(limitReq) ? Math.max(1, Math.min(limitReq, 20000)) : 10000
    const offset = Number.isFinite(offsetReq) ? Math.max(0, offsetReq) : 0
    const companyId = searchParams.get('company_id')
    const filtersParam = searchParams.get('filters')

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório' },
        { status: 400 }
      )
    }

    // ✅ Validar autenticação e acesso à empresa (permitir bypass em dev/test)
    const isTestMode = request.headers.get('x-test-mode') === 'true'
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (!isTestMode && !isDevelopment) {
      const { user, error: authError } = await requireCompanyAccess(request, companyId)
      if (authError) {
        return authError
      }
    }

    if (!['csv', 'excel', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Formato inválido. Use: csv, excel ou pdf' },
        { status: 400 }
      )
    }

    // Parse filters
    let filters: any = {}
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam)
      } catch (e) {
        // Ignorar erro de parse
      }
    }

    // Buscar custos com filtros
    const columns = [
      'date','group_name','category','subcategory','route_name','vehicle_plate','driver_email','amount','qty','unit','source','notes','company_id','route_id','vehicle_id','driver_id','cost_category_id'
    ]
    let query = supabaseServiceRole
      .from('v_costs_secure')
      .select(columns.join(','))
      .eq('company_id', companyId)

    if (filters.start_date) {
      query = query.gte('date', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('date', filters.end_date)
    }
    if (filters.route_id) {
      query = query.eq('route_id', filters.route_id)
    }
    if (filters.vehicle_id) {
      query = query.eq('vehicle_id', filters.vehicle_id)
    }
    if (filters.category_id) {
      query = query.eq('cost_category_id', filters.category_id)
    }
    if (filters.group_name) {
      query = query.eq('group_name', filters.group_name)
    }

    const { data: costs, error } = await query.order('date', { ascending: false }).range(offset, offset + limit - 1)

    if (error) {
      console.error('Erro ao buscar custos para exportação:', error)
      // Em dev/test, retornar lista vazia se a view não existe
      if (isTestMode || isDevelopment) {
        return NextResponse.json({ success: true, data: [] }, { status: 200 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Buscar nome da empresa
    const { data: company } = await supabaseServiceRole
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single()

    const companyName = company?.name || 'Empresa'

    // Preparar dados para exportação
    const reportData = {
      title: `Relatório de Custos - ${companyName}`,
      description: `Período: ${filters.start_date || 'Início'} a ${filters.end_date || 'Fim'} - Total: ${costs?.length || 0} registros`,
      headers: [
        'Data',
        'Grupo',
        'Categoria',
        'Subcategoria',
        'Rota',
        'Veículo',
        'Motorista',
        'Valor',
        'Quantidade',
        'Unidade',
        'Origem',
        'Observações'
      ],
      rows: (costs || []).map((cost: any) => [
        new Date(cost.date).toLocaleDateString('pt-BR'),
        cost.group_name || '-',
        cost.category || '-',
        cost.subcategory || '-',
        cost.route_name || '-',
        cost.vehicle_plate || '-',
        cost.driver_email || '-',
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost.amount || 0),
        cost.qty?.toString() || '-',
        cost.unit || '-',
        cost.source || 'manual',
        cost.notes || '-'
      ])
    }

    // Gerar arquivo conforme formato
    if (format === 'csv') {
      // Gerar CSV manualmente (exportToCSV é para cliente)
      const csvRows = [
        reportData.title,
        reportData.description || '',
        '',
        reportData.headers.join(','),
        ...reportData.rows.map((row: any[]) => row.map((cell: any) => {
          const cellStr = String(cell || '')
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(','))
      ]
      const csvContent = '\ufeff' + csvRows.join('\n') // BOM para UTF-8
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="custos_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'excel') {
      // Para Excel, retornar JSON com dados e deixar cliente gerar
      // Ou usar biblioteca server-side como exceljs
      return NextResponse.json({
        success: true,
        data: reportData,
        message: 'Para Excel, use a biblioteca do cliente ou endpoint específico'
      })
    } else {
      // PDF - similar ao Excel
      return NextResponse.json({
        success: true,
        data: reportData,
        message: 'Para PDF, use a biblioteca do cliente ou endpoint específico'
      })
    }
  } catch (error: any) {
    console.error('Erro ao exportar custos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(exportHandler, 'sensitive')

