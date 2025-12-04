/**
 * Factories e dados de teste consistentes
 */

export interface TestUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'operador' | 'transportadora' | 'motorista' | 'passageiro'
  company_id?: string
  transportadora_id?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface TestTransportadora {
  id: string
  name: string
  cnpj?: string
  email?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface TestVehicle {
  id: string
  plate: string
  model: string
  brand: string
  year: number
  transportadora_id: string
  created_at: string
  updated_at: string
}

export interface TestDriver {
  id: string
  name: string
  cpf: string
  cnh?: string
  transportadora_id: string
  created_at: string
  updated_at: string
}

export interface TestRoute {
  id: string
  name: string
  transportadora_id: string
  company_id?: string
  created_at: string
  updated_at: string
}

export interface TestCompany {
  id: string
  name: string
  cnpj?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TestTrip {
  id: string
  route_id: string
  vehicle_id?: string | null
  driver_id?: string | null
  status: string
  scheduled_date?: string
  scheduled_start_time?: string | null
  start_time?: string | null
  end_time?: string | null
  actual_start_time?: string | null
  actual_end_time?: string | null
  distance_km?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
}

/**
 * Factory para criar usuários de teste
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const role = overrides.role || 'admin'
  const id = overrides.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    email: overrides.email || `${role}@test.com`,
    name: overrides.name || `Test ${role}`,
    role,
    company_id: overrides.company_id,
    transportadora_id: overrides.transportadora_id,
    avatar_url: overrides.avatar_url || null,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Factory para criar transportadora de teste
 */
export function createTestTransportadora(overrides: Partial<TestTransportadora> = {}): TestTransportadora {
  const id = overrides.id || `transportadora-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    name: overrides.name || 'Test Transportadora',
    cnpj: overrides.cnpj || '12345678000190',
    email: overrides.email || 'transportadora@test.com',
    phone: overrides.phone || '+5511999999999',
    address: overrides.address || 'Rua Teste, 123',
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Factory para criar veículo de teste
 */
export function createTestVehicle(transportadoraId: string, overrides: Partial<TestVehicle> = {}): TestVehicle {
  const id = overrides.id || `vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    plate: overrides.plate || `ABC${Math.floor(Math.random() * 9000) + 1000}`,
    model: overrides.model || 'Modelo Teste',
    brand: overrides.brand || 'Marca Teste',
    year: overrides.year || 2020,
    transportadora_id: transportadoraId,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Factory para criar motorista de teste
 */
export function createTestDriver(transportadoraId: string, overrides: Partial<TestDriver> = {}): TestDriver {
  const id = overrides.id || `driver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    name: overrides.name || 'Motorista Teste',
    cpf: overrides.cpf || '12345678900',
    cnh: overrides.cnh || '12345678901',
    transportadora_id: transportadoraId,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Factory para criar rota de teste
 */
export function createTestRoute(transportadoraId: string, overrides: Partial<TestRoute> = {}): TestRoute {
  const id = overrides.id || `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    name: overrides.name || 'Rota Teste',
    transportadora_id: transportadoraId,
    company_id: overrides.company_id,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Factory para criar empresa de teste
 */
export function createTestCompany(overrides: Partial<TestCompany> = {}): TestCompany {
  const id = overrides.id || `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    name: overrides.name || 'Empresa Teste',
    cnpj: overrides.cnpj || '12345678000190',
    is_active: overrides.is_active !== undefined ? overrides.is_active : true,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Factory para criar viagem de teste
 */
export function createTestTrip(
  routeId: string,
  vehicleId?: string | null,
  driverId?: string | null,
  overrides: Partial<TestTrip> = {}
): TestTrip {
  const id = overrides.id || `trip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    route_id: routeId,
    vehicle_id: vehicleId || overrides.vehicle_id || null,
    driver_id: driverId || overrides.driver_id || null,
    status: overrides.status || 'scheduled',
    scheduled_date: overrides.scheduled_date || new Date().toISOString().split('T')[0],
    scheduled_start_time: overrides.scheduled_start_time || null,
    start_time: overrides.start_time || null,
    end_time: overrides.end_time || null,
    actual_start_time: overrides.actual_start_time || null,
    actual_end_time: overrides.actual_end_time || null,
    distance_km: overrides.distance_km || null,
    notes: overrides.notes || null,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Seeders para diferentes cenários
 */
export const seeders = {
  /**
   * Cria dados básicos para testes de admin
   */
  admin: () => {
    const transportadora = createTestTransportadora()
    const company = createTestCompany()
    const admin = createTestUser({ role: 'admin' })
    const operator = createTestUser({ role: 'operador', company_id: company.id })
    const vehicle = createTestVehicle(transportadora.id)
    const driver = createTestDriver(transportadora.id)
    const route = createTestRoute(transportadora.id, { company_id: company.id })

    return {
      transportadora,
      company,
      admin,
      operator,
      vehicle,
      driver,
      route,
    }
  },

  /**
   * Cria dados básicos para testes de operador
   */
  operator: () => {
    const company = createTestCompany()
    const operator = createTestUser({ role: 'operador', company_id: company.id })
    const transportadora = createTestTransportadora()
    const route = createTestRoute(transportadora.id, { company_id: company.id })

    return {
      company,
      operator,
      transportadora,
      route,
    }
  },

  /**
   * Cria dados básicos para testes de transportadora
   */
  transportadora: () => {
    const transportadora = createTestTransportadora()
    const user = createTestUser({ role: 'transportadora', transportadora_id: transportadora.id })
    const vehicle = createTestVehicle(transportadora.id)
    const driver = createTestDriver(transportadora.id)
    const route = createTestRoute(transportadora.id)

    return {
      transportadora,
      user,
      vehicle,
      driver,
      route,
    }
  },
}

