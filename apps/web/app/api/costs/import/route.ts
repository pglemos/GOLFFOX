import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireCompanyAccess } from '@/lib/api-auth'
import { parseCSV } from '@/lib/costs/import-parser'
import { logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { getSupabaseAdmin } from '@/lib/supabase-client'

const importSchema = z.object({
  company_id: z.string().uuid(),
  data: z.array(z.object({
    date: z.string(),
    category: z.string(),
    subcategory: z.string().optional(),
    amount: z.number(),
    qty: z.number().optional(),
    unit: z.string().optional(),
    route_name: z.string().optional(),
    vehicle_plate: z.string().optional(),
    driver_email: z.string().optional(),
    notes: z.string().optional()
  })),
  mapping: z.record(z.string()).optional() // Mapeamento de colunas para campos
})

async function importHandler(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const companyId = formData.get('company_id') as string
    const mapping = formData.get('mapping') ? JSON.parse(formData.get('mapping') as string) : null

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      )
    }

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório' },
        { status: 400 }
      )
    }

    // ✅ Validar autenticação e acesso à empresa
    const { user, error: authError } = await requireCompanyAccess(request, companyId)
    if (authError) {
      return authError
    }

    // Parse do arquivo
    const buffer = await file.arrayBuffer()
    const text = new TextDecoder().decode(buffer)

    let parsedData
    if (file.name.endsWith('.csv')) {
      parsedData = await parseCSV(text, mapping)
    } else {
      return NextResponse.json(
        { error: 'Formato não suportado. Use CSV ou Excel' },
        { status: 400 }
      )
    }

    if (!parsedData || parsedData.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado válido encontrado no arquivo' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar categorias de custos
    const { data: categories } = await supabase
      .from('gf_cost_categories')
      .select('id, group_name, category, subcategory')
      .eq('is_active', true)

    const categoryMap = new Map()
    categories?.forEach((cat: any) => {
      const key = `${cat.group_name}|${cat.category}|${cat.subcategory || ''}`
      categoryMap.set(key, cat.id)
    })

    // Buscar rotas, veículos e motoristas para mapeamento
    const { data: routes } = await supabase
      .from('rotas')
      .select('id, name')
      .eq('company_id', companyId)

    const { data: veiculos } = await supabase
      .from('veiculos')
      .select('id, plate')

    const { data: motoristas } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'motorista')

    const routeMap = new Map(routes?.map((r: { id: string; name?: string }) => [r.name || '', r.id]) || [])
    const vehicleMap = new Map(veiculos?.map((v: { id: string; plate?: string }) => [v.plate || '', v.id]) || [])
    const driverMap = new Map(motoristas?.map((d: { id: string; email?: string }) => [d.email || '', d.id]) || [])

    // Processar e inserir custos
    const costsToInsert = []
    const errors = []

    for (const row of parsedData) {
      try {
        // Mapear categoria
        const categoryKey = `${row.category}|${row.subcategory || ''}`
        let categoryId = categoryMap.get(categoryKey)

        if (!categoryId) {
          // Tentar sem subcategoria
          for (const [key, id] of categoryMap.entries()) {
            if (key.startsWith(`${row.category}|`)) {
              categoryId = id
              break
            }
          }
        }

        if (!categoryId) {
          errors.push({
            row,
            error: `Categoria não encontrada: ${row.category}${row.subcategory ? ` / ${row.subcategory}` : ''}`
          })
          continue
        }

        // Mapear rota, veículo e motorista
        const routeId = row.route_name ? routeMap.get(row.route_name) : null
        const vehicleId = row.vehicle_plate ? vehicleMap.get(row.vehicle_plate) : null
        const driverId = row.driver_email ? driverMap.get(row.driver_email) : null

        costsToInsert.push({
          company_id: companyId,
          route_id: routeId,
          veiculo_id: vehicleId,
          motorista_id: driverId,
          cost_category_id: categoryId,
          date: row.date,
          amount: parseFloat(row.amount.toString()),
          qty: row.qty ? parseFloat(row.qty.toString()) : null,
          unit: row.unit || null,
          notes: row.notes || null,
          source: 'import',
          created_by: request.headers.get('x-user-id') || null
        })
      } catch (err: unknown) {
        const error = err as { message?: string }
        errors.push({
          row,
          error: err.message || 'Erro ao processar linha'
        })
      }
    }

    if (costsToInsert.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum custo válido para importar', errors },
        { status: 400 }
      )
    }

    // Inserir em lote
    const { data: inserted, error: insertError } = await supabase
      .from('gf_costs')
      .insert(costsToInsert as CostInsert[])
      .select()

    if (insertError) {
      logError('Erro ao inserir custos', { error: insertError, companyId }, 'CostsImportAPI')
      return NextResponse.json(
        { error: insertError.message, errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imported: inserted?.length || 0,
      errors: errors.length,
      errors_details: errors.slice(0, 10) // Limitar detalhes de erros
    })
  } catch (error: any) {
    logError('Erro ao importar custos', { error, companyId: request.formData ? (await request.formData()).get('company_id') : null }, 'CostsImportAPI')
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(importHandler, 'sensitive')

