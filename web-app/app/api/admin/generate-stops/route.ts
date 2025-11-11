import { NextRequest, NextResponse } from 'next/server'
import { validateBrazilianAddress } from '../../../../lib/address-validator'
import { geocodeAddress } from '../../../../lib/geocoding'
import { getEmployeesForRoute } from '../../../../lib/stops/employee-source'
import { sortStops } from '../../../../lib/stops/stop-sorting'
import { log, getLogs, clearLogs } from '../../../../lib/logger'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  clearLogs()
  const body = await req.json().catch(() => ({}))
  // Aceitar tanto route_id (snake_case - preferido) quanto routeId (camelCase - legado)
  const routeId = (body?.route_id || body?.routeId) as string
  const employeeDb = (body?.employee_db || body?.employeeDb) as string | undefined
  const origin = body?.origin as { lat: number; lng: number } | undefined
  const avgSpeedKmh = (body?.avg_speed_kmh || body?.avgSpeedKmh) as number | undefined
  const dbSave = (body?.db_save || body?.dbSave) as boolean | undefined
  const tableName = ((body?.table_name || body?.tableName) as string | undefined) || 'gf_route_plan'
  const itemsPerPage = ((body?.items_per_page || body?.itemsPerPage) as number | undefined) || undefined

  if (!routeId) {
    return new Response(JSON.stringify({ error: 'route_id ou routeId é obrigatório' }), { status: 400 })
  }

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
      passenger_id: s.id,
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
        // Limpeza opcional: apagar plano anterior da rota
        await supabaseAdmin.from(tableName).delete().eq('route_id', routeId)
        if (json.gfRoutePlan.length > 0) {
          const { error } = await supabaseAdmin.from(tableName).insert(json.gfRoutePlan)
          if (error) throw error
          log('info', 'Plano de rota salvo em banco', { tableName, count: json.gfRoutePlan.length })
        }
      } catch (e: any) {
        log('error', 'Falha ao salvar stops no banco', { message: e?.message })
      }
    }
  }

  return NextResponse.json(json)
}
