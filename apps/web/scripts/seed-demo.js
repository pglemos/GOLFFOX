/**
 * Script de Seed Demo - Dados Realistas para Teste
 * Cria 3 empresas, 12 rotas, 40 motoristas, 10 veículos, 30 dias de posições
 * Idempotente: pode rodar múltiplas vezes sem duplicar
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || ''

// Dados de seed
const COMPANIES = [
  { name: 'Transporte Expresso', role: 'operador' },
  { name: 'Logística Rápida', role: 'operador' },
  { name: 'Fretamento Premium', role: 'transportadora' },
]

const ROUTES_PER_COMPANY = 4
const DRIVERS_PER_COMPANY = [15, 15, 10] // Distribuição
const VEHICLES_PER_COMPANY = [4, 4, 2] // Distribuição
const DAYS_OF_HISTORY = 30
const POSITIONS_PER_DAY = 20 // Amostradas

async function seedCompanies(client) {
  console.log('\n🏢 Criando empresas...')
  const companies = []
  
  for (const companyData of COMPANIES) {
    // Verificar se empresa já existe
    const { rows: existing } = await client.query(
      `SELECT id FROM public.companies WHERE name = $1`,
      [companyData.name]
    )
    
    if (existing.length > 0) {
      console.log(`   ✅ ${companyData.name} já existe`)
      companies.push(existing[0])
      continue
    }
    
    // Criar empresa
    const { rows } = await client.query(
      `INSERT INTO public.companies (name, role, is_active, created_at)
       VALUES ($1, $2, true, NOW())
       RETURNING id, name`,
      [companyData.name, companyData.role]
    )
    
    console.log(`   ✅ ${companyData.name} criada`)
    companies.push(rows[0])
  }
  
  return companies
}

async function seedRoutes(client, companies) {
  console.log('\n🛣️  Criando rotas...')
  const routes = []
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]
    
    for (let j = 0; j < ROUTES_PER_COMPANY; j++) {
      const routeName = `Rota ${String.fromCharCode(65 + i)}${j + 1}`
      
      // Verificar se rota já existe
      const { rows: existing } = await client.query(
        `SELECT id FROM public.routes WHERE name = $1 AND company_id = $2`,
        [routeName, company.id]
      )
      
      if (existing.length > 0) {
        routes.push(existing[0])
        continue
      }
      
      // Criar rota
      const { rows } = await client.query(
        `INSERT INTO public.routes (
          name, company_id, description, is_active, shift, created_at
        ) VALUES ($1, $2, $3, true, $4, NOW())
        RETURNING id, name`,
        [
          routeName,
          company.id,
          `Rota ${routeName} para ${company.name}`,
          j % 2 === 0 ? 'manha' : 'tarde'
        ]
      )
      
      routes.push(rows[0])
    }
  }
  
  console.log(`   ✅ ${routes.length} rotas criadas`)
  return routes
}

async function seedDrivers(client, companies) {
  console.log('\n👥 Criando motoristas...')
  const drivers = []
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]
    const driverCount = DRIVERS_PER_COMPANY[i]
    
    for (let j = 0; j < driverCount; j++) {
      const driverName = `Motorista ${company.name} ${j + 1}`
      const driverEmail = `motorista${i}_${j}@demo.golffox.com`
      
      // Verificar se motorista já existe
      const { rows: existing } = await client.query(
        `SELECT id FROM public.users WHERE email = $1`,
        [driverEmail]
      )
      
      if (existing.length > 0) {
        drivers.push(existing[0])
        continue
      }
      
      // Criar motorista
      const { rows } = await client.query(
        `INSERT INTO public.users (
          email, name, role, company_id, is_active, created_at
        ) VALUES ($1, $2, 'motorista', $3, true, NOW())
        RETURNING id, name, email`,
        [driverEmail, driverName, company.id]
      )
      
      drivers.push(rows[0])
    }
  }
  
  console.log(`   ✅ ${drivers.length} motoristas criados`)
  return drivers
}

async function seedVehicles(client, companies) {
  console.log('\n🚗 Criando veículos...')
  const vehicles = []
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]
    const vehicleCount = VEHICLES_PER_COMPANY[i]
    
    for (let j = 0; j < vehicleCount; j++) {
      const plate = `ABC${String(i + 1).padStart(2, '0')}${String(j + 1).padStart(2, '0')}`
      const model = `Modelo ${j + 1}`
      
      // Verificar se veículo já existe
      const { rows: existing } = await client.query(
        `SELECT id FROM public.vehicles WHERE plate = $1`,
        [plate]
      )
      
      if (existing.length > 0) {
        vehicles.push(existing[0])
        continue
      }
      
      // Criar veículo
      const { rows } = await client.query(
        `INSERT INTO public.vehicles (
          plate, model, company_id, is_active, capacity, created_at
        ) VALUES ($1, $2, $3, true, $4, NOW())
        RETURNING id, plate, model`,
        [plate, model, company.id, 40 + Math.floor(Math.random() * 20)]
      )
      
      vehicles.push(rows[0])
    }
  }
  
  console.log(`   ✅ ${vehicles.length} veículos criados`)
  return vehicles
}

async function seedTrips(client, routes, vehicles, drivers) {
  console.log('\n🚌 Criando viagens...')
  const trips = []
  
  // Criar viagens para os últimos 30 dias
  for (let day = DAYS_OF_HISTORY; day >= 0; day--) {
    const date = new Date()
    date.setDate(date.getDate() - day)
    
    for (const route of routes) {
      // 1-3 viagens por rota por dia
      const tripCount = 1 + Math.floor(Math.random() * 3)
      
      for (let t = 0; t < tripCount; t++) {
        // Selecionar veículo e motorista aleatórios da mesma empresa
        const routeCompanyId = route.company_id
        const availableVehicles = vehicles.filter(v => v.company_id === routeCompanyId)
        const availableDrivers = drivers.filter(d => d.company_id === routeCompanyId)
        
        if (availableVehicles.length === 0 || availableDrivers.length === 0) continue
        
        const veiculo = availableVehicles[Math.floor(Math.random() * availableVehicles.length)]
        const motorista = availableDrivers[Math.floor(Math.random() * availableDrivers.length)]
        
        // Horário agendado (manhã ou tarde)
        const scheduledTime = new Date(date)
        scheduledTime.setHours(route.shift === 'manha' ? 7 + Math.floor(Math.random() * 4) : 13 + Math.floor(Math.random() * 4))
        scheduledTime.setMinutes(Math.floor(Math.random() * 60))
        
        // Status aleatório
        const statuses = ['scheduled', 'inProgress', 'completed', 'cancelled']
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        
        // Verificar se viagem já existe
        const { rows: existing } = await client.query(
          `SELECT id FROM public.trips 
           WHERE route_id = $1 AND vehicle_id = $2 
           AND DATE(scheduled_at) = $3`,
          [route.id, veiculo.id, date.toISOString().split('T')[0]]
        )
        
        if (existing.length > 0) {
          trips.push(existing[0])
          continue
        }
        
        // Criar viagem
        const { rows } = await client.query(
          `INSERT INTO public.trips (
            route_id, vehicle_id, driver_id, status, scheduled_at, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id`,
          [route.id, veiculo.id, motorista.id, status, scheduledTime.toISOString()]
        )
        
        trips.push(rows[0])
        
        // Se status for inProgress ou completed, criar posições
        if (status === 'inProgress' || status === 'completed') {
          await seedPositions(client, rows[0].id, veiculo.id, motorista.id, scheduledTime)
        }
      }
    }
  }
  
  console.log(`   ✅ ${trips.length} viagens criadas`)
  return trips
}

async function seedPositions(client, tripId, vehicleId, driverId, scheduledTime) {
  // Criar algumas posições amostradas para a viagem
  const positionCount = POSITIONS_PER_DAY
  
  for (let i = 0; i < positionCount; i++) {
    // Posição aleatória no Brasil (centro)
    const lat = -19.916681 + (Math.random() - 0.5) * 0.1
    const lng = -43.934493 + (Math.random() - 0.5) * 0.1
    
    // Timestamp progressivo
    const timestamp = new Date(scheduledTime)
    timestamp.setMinutes(timestamp.getMinutes() + i * 5)
    
    // Velocidade aleatória (0-60 km/h)
    const speed = Math.random() * 60
    
    try {
      await client.query(
        `INSERT INTO public.driver_positions (
          trip_id, vehicle_id, driver_id, lat, lng, speed, timestamp, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT DO NOTHING`,
        [tripId, vehicleId, driverId, lat, lng, speed, timestamp.toISOString()]
      )
    } catch (error) {
      // Ignorar erros de duplicação
      if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
        console.warn(`   ⚠️  Erro ao criar posição: ${error.message}`)
      }
    }
  }
}

async function seedCosts(client, companies, routes, vehicles) {
  console.log('\n💰 Criando custos...')
  let costCount = 0
  
  // Criar custos para os últimos 30 dias
  for (let day = DAYS_OF_HISTORY; day >= 0; day--) {
    const date = new Date()
    date.setDate(date.getDate() - day)
    
    for (const route of routes) {
      // Verificar se custo já existe
      const { rows: existing } = await client.query(
        `SELECT id FROM public.gf_vehicle_costs 
         WHERE route_id = $1 AND DATE(date) = $2`,
        [route.id, date.toISOString().split('T')[0]]
      )
      
      if (existing.length > 0) continue
      
      // Selecionar veículo da mesma empresa
      const routeCompanyId = route.company_id
      const availableVehicles = vehicles.filter(v => v.company_id === routeCompanyId)
      if (availableVehicles.length === 0) continue
      
      const veiculo = availableVehicles[Math.floor(Math.random() * availableVehicles.length)]
      
      // Criar custo
      const km = 50 + Math.floor(Math.random() * 100)
      const total = km * 2.5 // R$ 2,50 por km
      
      try {
        await client.query(
          `INSERT INTO public.gf_vehicle_costs (
            route_id, vehicle_id, date, km, total, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT DO NOTHING`,
          [route.id, veiculo.id, date.toISOString().split('T')[0], km, total]
        )
        costCount++
      } catch (error) {
        // Ignorar erros de duplicação
        if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
          console.warn(`   ⚠️  Erro ao criar custo: ${error.message}`)
        }
      }
    }
  }
  
  console.log(`   ✅ ${costCount} custos criados`)
}

async function seedDemo() {
  console.log('🌱 Iniciando seed demo...\n')
  
  if (!DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não configurada')
    console.error('Configure DATABASE_URL ou SUPABASE_DB_URL no .env')
    process.exit(1)
  }
  
  const client = new Client({
    connectionString: DATABASE_URL,
  })
  
  try {
    console.log('Conectando ao banco de dados...')
    await client.connect()
    console.log('✅ Conectado!\n')
    
    // Executar seeds
    const companies = await seedCompanies(client)
    const routes = await seedRoutes(client, companies)
    const drivers = await seedDrivers(client, companies)
    const vehicles = await seedVehicles(client, companies)
    await seedTrips(client, routes, vehicles, drivers)
    await seedCosts(client, companies, routes, vehicles)
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ SEED DEMO CONCLUÍDO!')
    console.log('='.repeat(60))
    console.log(`Empresas: ${companies.length}`)
    console.log(`Rotas: ${routes.length}`)
    console.log(`Motoristas: ${drivers.length}`)
    console.log(`Veículos: ${vehicles.length}`)
    console.log('='.repeat(60))
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erro durante seed demo:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedDemo().catch(console.error)
}

module.exports = { seedDemo }

