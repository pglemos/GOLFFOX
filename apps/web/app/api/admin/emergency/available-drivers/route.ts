import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Buscar motoristas ativos
    const { data: drivers, error: driversError } = await supabase
      .from('users')
      .select('id, name, email, is_active, role')
      .eq('role', 'driver')
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
      console.error('Erro ao buscar viagens ativas:', tripsError)
    }

    const activeDriverIds = new Set(
      (activeTrips || []).map((t: any) => t.driver_id).filter(Boolean)
    )

    // Filtrar motoristas disponíveis (não estão em viagem)
    const availableDrivers = (drivers || [])
      .filter(driver => !activeDriverIds.has(driver.id))
      .map(driver => ({
        id: driver.id,
        name: driver.name || driver.email?.split('@')[0] || 'Motorista',
        email: driver.email,
        status: 'Ativo',
        displayName: `${driver.name || driver.email?.split('@')[0] || 'Motorista'} (Status: Ativo)`
      }))

    return NextResponse.json({
      success: true,
      drivers: availableDrivers
    })
  } catch (error: any) {
    console.error('Erro ao buscar motoristas disponíveis:', error)
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

