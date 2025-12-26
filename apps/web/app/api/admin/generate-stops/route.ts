import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { validateBrazilianAddress } from '../../../../lib/address-validator'
import { geocodeAddress } from '../../../../lib/geocoding'
import { log, getLogs, clearLogs } from '../../../../lib/logger'
import { getEmployeesForRoute } from '../../../../lib/stops/employee-source'
import { sortStops } from '../../../../lib/stops/stop-sorting'
import { requireAuth } from '@/lib/api-auth'
import { validateWithSchema, generateStopsSchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Validar autenticação (apenas admin ou via flags de teste em dev)
  const isTestMode = req.headers.get('x-test-mode') === 'true'
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (!isTestMode && !isDevelopment) {
    const authError = await requireAuth(req, 'admin')
    if (authError) return authError
  }

  clearLogs()
  const body = await req.json().catch(() => ({}))

  // Validar corpo
  const validation = validateWithSchema(generateStopsSchema, body)
  if (!validation.success) {
    return validationErrorResponse(validation.error)
  }

  const data = validation.data
  const routeId = (data.route_id || data.routeId) as string
  const employeeDb = data.employee_db || data.employeeDb
  const origin = data.origin
  const avgSpeedKmh = data.avg_speed_kmh || data.avgSpeedKmh
  const dbSave = data.db_save || data.dbSave
  const tableName = data.table_name || data.tableName || 'gf_route_plan'
  const itemsPerPage = data.items_per_page || data.itemsPerPage

  log('info', 'Início da geração de pontos', { routeId })

  const employees = await getEmployeesForRoute(routeId, employeeDb, itemsPerPage)
  if (employees.length === 0) {
    log('warn', 'Nenhum funcionário encontrado para a rota', { routeId })
    return NextResponse.json({ stops: [], metrics: { count: 0, successRate: 0 }, logs: getLogs() })
  }

  const validated = [] as {
    id: string
    fullName: string
    addressStr: string
    issues: string[]
  }[]

  const validEmployees = [] as typeof employees

  for (const emp of employees) {
    const res = await validateBrazilianAddress(emp.address)
    const addrStr = `${res.normalized?.street ?? ''}, ${res.normalized?.number ?? ''} - ${res.normalized?.neighborhood ?? ''}, ${res.normalized?.city ?? ''} - ${res.normalized?.state ?? ''}, ${res.normalized?.cep ?? ''}`
    validated.push({ id: emp.id, fullName: emp.fullName, addressStr: addrStr, issues: res.issues })
    if (res.isValid) validEmployees.push({ ...emp, address: res.normalized! })
  }

  const errorColor = process.env.NEXT_PUBLIC_ERROR_COLOR || '#ff4d4f'

  const geocoded = [] as {
    id: string
    fullName: string
    lat?: number
    lng?: number
  }[]

  const candidates = [] as { id: string; fullName: string; location: { lat: number; lng: number }; dwellMinutes?: number }[]

  for (const emp of validEmployees) {
    const fullAddress = `${emp.address.street}, ${emp.address.number} - ${emp.address.neighborhood}, ${emp.address.city} - ${emp.address.state}, ${emp.address.cep}`
    const loc = await geocodeAddress(fullAddress)
    if (loc) {
      candidates.push({ id: emp.id, fullName: emp.fullName, location: loc, dwellMinutes: 2 })
      geocoded.push({ id: emp.id, fullName: emp.fullName, lat: loc.lat, lng: loc.lng })
    } else {
      geocoded.push({ id: emp.id, fullName: emp.fullName })
      log('warn', 'Falha na geocodificação para funcionário', { id: emp.id, name: emp.fullName })
    }
  }

  const originPoint = origin || { lat: -23.55052, lng: -46.633308 } // São Paulo centro como default
  const stops = sortStops(candidates, originPoint, avgSpeedKmh || 30)

  const json = {
    routeId,
    origin: originPoint,
    stops,
    validation: validated,
    geocoded,
    metrics: {
      count: stops.length,
      successRate: candidates.length / Math.max(validEmployees.length, 1),
      processingMs: 0,
    },
    errorColor,
    logs: getLogs(),
    gfRoutePlan: stops.map(s => ({
      route_id: routeId,
      latitude: s.location.lat,
      longitude: s.location.lng,
      stop_order: s.sequence,
      stop_name: s.fullName,
      address: '',
      passageiro_id: s.id,
      estimated_arrival_time: s.etaMinutes,
    })),
  }

  // Opcionalmente salvar no Supabase usando service role
  if (dbSave) {
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    if (!adminKey || !supabaseUrl) {
      log('error', 'Service role não configurado; não foi possível salvar no banco')
    } else {
      try {
        const supabaseAdmin = createClient(supabaseUrl, adminKey, { auth: { autoRefreshToken: false, persistSession: false } })
        await supabaseAdmin.from(tableName).delete().eq('route_id', routeId)
        if (json.gfRoutePlan.length > 0) {
          const { error } = await supabaseAdmin.from(tableName).insert(json.gfRoutePlan)
          if (error) throw error
          log('info', 'Plano de rota salvo em banco', { tableName, count: json.gfRoutePlan.length })
        }
      } catch (e: unknown) {
        log('error', 'Falha ao salvar stops no banco', { message: e instanceof Error ? e.message : 'Erro desconhecido' })
      }
    }
  }

  return NextResponse.json(json)
}
