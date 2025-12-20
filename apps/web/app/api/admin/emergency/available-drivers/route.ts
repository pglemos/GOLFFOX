import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { logError } from '@/lib/logger'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(req, 'admin')
  if (authError) return authError

  try {
    const supabase = getSupabaseAdmin()

    // Buscar motoristas ativos
    const { data: drivers, error: driversError } = await supabase
      .from('users')
      .select('id, name, email, is_active, role')
      .eq('role', 'motorista')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (driversError) {
      throw driversError
    }

    // Buscar viagens em andamento para filtrar motoristas ocupados
    const { data: activeTrips, error: tripsError } = await supabase
      .from('trips')
      .select('driver_id')
      .eq('status', 'inProgress')

    if (tripsError) {
      logError('Erro ao buscar viagens ativas', { error: tripsError }, 'AvailableDriversAPI')
    }

    const activeDriverIds = new Set(
      (activeTrips || []).map((t: any) => t.driver_id).filter(Boolean)
    )

    // Filtrar motoristas disponíveis (não estão em viagem)
    const availableDrivers = (drivers || [])
      .filter(motorista => !activeDriverIds.has(motorista.id))
      .map(motorista => ({
        id: motorista.id,
        name: motorista.name || motorista.email?.split('@')[0] || 'Motorista',
        email: motorista.email,
        status: 'Ativo',
        displayName: `${motorista.name || motorista.email?.split('@')[0] || 'Motorista'} (Status: Ativo)`
      }))

    return NextResponse.json({
      success: true,
      drivers: availableDrivers
    })
  } catch (error: any) {
    logError('Erro ao buscar motoristas disponíveis', { error }, 'AvailableDriversAPI')
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar motoristas disponíveis',
        message: error.message
      },
      { status: 500 }
    )
  }
}

