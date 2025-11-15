/**
 * Script de Seed - Dados Específicos para Operador
 * Cria dados mínimos realistas para testar painel do operador
 * 
 * Uso: node scripts/seed-operator-data.js [--companies=auto|2|3] [--routes=12] [--employees=40]
 */

const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

// Parse arguments
const args = process.argv.slice(2)
const getArg = (key, defaultValue) => {
  const arg = args.find(a => a.startsWith(`--${key}=`))
  return arg ? arg.split('=')[1] : defaultValue
}

const COMPANIES_COUNT = getArg('companies', 'auto') === 'auto' ? null : parseInt(getArg('companies', '2'))
const ROUTES_PER_COMPANY = parseInt(getArg('routes', '12'))
const EMPLOYEES_COUNT = parseInt(getArg('employees', '40'))
const DRIVERS_COUNT = 10
const VEHICLES_COUNT = 8
const TRIPS_TODAY = 4
const ALERTS_COUNT = 25

// Endereços reais de Belo Horizonte para geocodificação
const BH_ADDRESSES = [
  { name: 'Av. Afonso Pena, 1000 - Centro', lat: -19.9167, lng: -43.9345 },
  { name: 'Rua da Bahia, 500 - Centro', lat: -19.9192, lng: -43.9378 },
  { name: 'Av. do Contorno, 8000 - Funcionários', lat: -19.9278, lng: -43.9375 },
  { name: 'Rua dos Tupis, 300 - Centro', lat: -19.9222, lng: -43.9394 },
  { name: 'Av. Olegário Maciel, 2000 - Lourdes', lat: -19.9308, lng: -43.9417 },
  { name: 'Rua Cláudio Manuel, 100 - Centro', lat: -19.9181, lng: -43.9367 },
  { name: 'Av. Getúlio Vargas, 1500 - Funcionários', lat: -19.9244, lng: -43.9389 },
  { name: 'Rua Espírito Santo, 500 - Centro', lat: -19.9206, lng: -43.9356 },
  { name: 'Av. Brasil, 3000 - Santa Efigênia', lat: -19.9156, lng: -43.9422 },
  { name: 'Rua Álvares Cabral, 200 - Centro', lat: -19.9217, lng: -43.9383 },
  { name: 'Av. João Pinheiro, 1200 - Centro', lat: -19.9233, lng: -43.9400 },
  { name: 'Rua dos Carijós, 400 - Centro', lat: -19.9194, lng: -43.9361 },
  { name: 'Av. Assis Chateaubriand, 500 - Barro Preto', lat: -19.9289, lng: -43.9433 },
  { name: 'Rua da Bahia, 1200 - Centro', lat: -19.9200, lng: -43.9381 },
  { name: 'Av. do Contorno, 9000 - Lourdes', lat: -19.9294, lng: -43.9406 },
  { name: 'Rua Tamoios, 300 - Centro', lat: -19.9189, lng: -43.9372 },
  { name: 'Av. Antônio Carlos, 6000 - Pampulha', lat: -19.8564, lng: -43.9686 },
  { name: 'Rua Gonçalves Dias, 200 - Centro', lat: -19.9211, lng: -43.9392 },
  { name: 'Av. do Contorno, 7000 - Funcionários', lat: -19.9261, lng: -43.9361 },
  { name: 'Rua da Carioca, 400 - Centro', lat: -19.9203, lng: -43.9375 },
]

// Tipos de alertas
const ALERT_TYPES = ['route_delayed', 'bus_stopped', 'deviation', 'passenger_not_embarked', 'checklist_missing']
const ALERT_SEVERITIES = ['info', 'warning', 'critical']

// Gerar CPF aleatório (apenas para teste)
function generateCPF() {
  const nums = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  const d1 = nums.reduce((sum, num, idx) => sum + num * (10 - idx), 0) % 11
  const d2 = (nums.reduce((sum, num, idx) => sum + num * (11 - idx), 0) + d1 * 2) % 11
  return nums.join('') + (d1 < 2 ? '0' : String(11 - d1)) + (d2 < 2 ? '0' : String(11 - d2))
}

async function getOrCreateCompanies(client) {
  console.log('\n🏢 Buscando/criando empresas...')
  
  let companies = []
  
  if (COMPANIES_COUNT === null) {
    // Auto: buscar empresas existentes com role='operator'
    const { rows } = await client.query(`
      SELECT id, name FROM public.companies 
      WHERE role = 'operator' OR role = 'company'
      ORDER BY created_at DESC
      LIMIT 3
    `)
    
    if (rows.length > 0) {
      console.log(`   ✅ Reutilizando ${rows.length} empresas existentes`)
      companies = rows
      return companies
    }
  }
  
  // Criar empresas se necessário
  const targetCount = COMPANIES_COUNT || 2
  const companyNames = ['Transporte Expresso', 'Logística Rápida', 'Fretamento Premium']
  
  for (let i = 0; i < targetCount && i < companyNames.length; i++) {
    const name = companyNames[i]
    
    // Verificar se existe
    const { rows: existing } = await client.query(
      `SELECT id FROM public.companies WHERE name = $1`,
      [name]
    )
    
    if (existing.length > 0) {
      console.log(`   ✅ ${name} já existe`)
      companies.push(existing[0])
    } else {
      // Criar empresa
      const { rows } = await client.query(
        `INSERT INTO public.companies (name, role, is_active, created_at)
         VALUES ($1, 'operator', true, NOW())
         RETURNING id, name`,
        [name]
      )
      console.log(`   ✅ ${name} criada`)
      companies.push(rows[0])
    }
  }
  
  return companies
}

async function seedRoutes(client, companies) {
  console.log(`\n🛣️  Criando ${ROUTES_PER_COMPANY} rotas por empresa...`)
  const routes = []
  
  const shifts = ['manha', 'tarde', 'noite']
  
  for (const company of companies) {
    for (let i = 0; i < ROUTES_PER_COMPANY; i++) {
      const routeName = `Rota ${company.name.substring(0, 3).toUpperCase()}${String(i + 1).padStart(2, '0')}`
      const shift = shifts[i % shifts.length]
      
      // Verificar se existe
      const { rows: existing } = await client.query(
        `SELECT id FROM public.routes WHERE name = $1 AND company_id = $2`,
        [routeName, company.id]
      )
      
      if (existing.length > 0) {
        routes.push(existing[0])
        continue
      }
      
      // Criar rota (tentar NULL primeiro, depois buscar/criar carrier)
      let carrierId = null
      
      // Tentar buscar carrier existente da empresa
      const { rows: carriers } = await client.query(
        `SELECT id FROM public.carriers WHERE id IN (
          SELECT carrier_id FROM public.gf_assigned_carriers WHERE empresa_id = $1
        ) LIMIT 1`,
        [company.id]
      )
      
      if (carriers.length > 0) {
        carrierId = carriers[0].id
      } else {
        // Criar carrier se não existir
        const { rows: newCarrier } = await client.query(
          `INSERT INTO public.carriers (name, created_at)
           VALUES ($1, NOW())
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [`Carrier ${company.name}`]
        )
        if (newCarrier.length > 0) {
          carrierId = newCarrier[0].id
        }
      }
      
      // Se ainda não tem carrier, usar NULL (se permitido) ou a própria company
      const { rows } = await client.query(
        `INSERT INTO public.routes (
          name, company_id, carrier_id, created_at
        ) VALUES ($1, $2, $3, NOW())
        RETURNING id, name`,
        [
          routeName,
          company.id,
          carrierId
        ]
      )
      
      routes.push({ ...rows[0], company_id: company.id, shift: shift }) // Adicionar shift para uso posterior
    }
  }
  
  console.log(`   ✅ ${routes.length} rotas criadas/verificadas`)
  return routes
}

async function seedEmployees(client, companies) {
  console.log(`\n👥 Criando ${EMPLOYEES_COUNT} funcionários...`)
  const employees = []
  
  const employeesPerCompany = Math.floor(EMPLOYEES_COUNT / companies.length)
  let created = 0
  let skipped = 0
  
  for (const company of companies) {
    for (let i = 0; i < employeesPerCompany; i++) {
      const cpf = generateCPF()
      const address = BH_ADDRESSES[i % BH_ADDRESSES.length]
      const firstName = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Roberto', 'Fernanda'][i % 8]
      const lastName = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida'][i % 8]
      const name = `${firstName} ${lastName}`
      
      // Verificar se existe por CPF
      const { rows: existing } = await client.query(
        `SELECT id FROM public.gf_employee_company WHERE cpf = $1`,
        [cpf]
      )
      
      if (existing.length > 0) {
        skipped++
        employees.push(existing[0])
        continue
      }
      
      // Criar funcionário
      try {
        const { rows } = await client.query(
          `INSERT INTO public.gf_employee_company (
            company_id, name, cpf, address, latitude, longitude, 
            phone, email, login_cpf, is_active, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW())
          RETURNING id, name`,
          [
            company.id,
            name,
            cpf,
            address.name,
            address.lat,
            address.lng,
            `(31) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
            `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
            cpf,
          ]
        )
        employees.push(rows[0])
        created++
      } catch (error) {
        if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
          console.warn(`   ⚠️  Erro ao criar funcionário ${name}: ${error.message}`)
        }
        skipped++
      }
    }
  }
  
  console.log(`   ✅ ${created} criados, ${skipped} já existiam`)
  return employees
}

async function seedDrivers(client, companies) {
  console.log(`\n🚗 Criando ${DRIVERS_COUNT} motoristas...`)
  const drivers = []
  
  const driversPerCompany = Math.floor(DRIVERS_COUNT / companies.length)
  let created = 0
  let skipped = 0
  
  for (const company of companies) {
    for (let i = 0; i < driversPerCompany; i++) {
      const driverName = `Motorista ${company.name.substring(0, 3)} ${i + 1}`
      const driverEmail = `driver${company.id.substring(0, 8)}${i}@demo.golffox.com`
      
      // Verificar se existe
      const { rows: existing } = await client.query(
        `SELECT id FROM public.users WHERE email = $1`,
        [driverEmail]
      )
      
      if (existing.length > 0) {
        drivers.push(existing[0])
        skipped++
        continue
      }
      
      // Criar motorista
      try {
        const { rows } = await client.query(
          `INSERT INTO public.users (
            email, name, role, company_id, is_active, created_at
          ) VALUES ($1, $2, 'driver', $3, true, NOW())
          RETURNING id, name, email`,
          [driverEmail, driverName, company.id]
        )
        drivers.push(rows[0])
        created++
      } catch (error) {
        if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
          console.warn(`   ⚠️  Erro ao criar motorista: ${error.message}`)
        }
        skipped++
      }
    }
  }
  
  console.log(`   ✅ ${created} criados, ${skipped} já existiam`)
  return drivers
}

async function seedVehicles(client, companies) {
  console.log(`\n🚌 Criando ${VEHICLES_COUNT} veículos...`)
  const vehicles = []
  
  const vehiclesPerCompany = Math.floor(VEHICLES_COUNT / companies.length)
  let created = 0
  let skipped = 0
  
  for (const company of companies) {
    for (let i = 0; i < vehiclesPerCompany; i++) {
      const plate = `ABC${String(company.id.charCodeAt(0) % 10)}${String(i + 1).padStart(2, '0')}`
      const model = ['Mercedes Sprinter', 'Volkswagen Kombi', 'Fiat Ducato', 'Iveco Daily'][i % 4]
      
      // Verificar se existe
      const { rows: existing } = await client.query(
        `SELECT id FROM public.vehicles WHERE plate = $1`,
        [plate]
      )
      
      if (existing.length > 0) {
        vehicles.push(existing[0])
        skipped++
        continue
      }
      
      // Criar veículo
      try {
        const { rows } = await client.query(
          `INSERT INTO public.vehicles (
            plate, model, company_id, is_active, capacity, created_at
          ) VALUES ($1, $2, $3, true, $4, NOW())
          RETURNING id, plate, model`,
          [plate, model, company.id, 40 + Math.floor(Math.random() * 20)]
        )
        vehicles.push(rows[0])
        created++
      } catch (error) {
        if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
          console.warn(`   ⚠️  Erro ao criar veículo: ${error.message}`)
        }
        skipped++
      }
    }
  }
  
  console.log(`   ✅ ${created} criados, ${skipped} já existiam`)
  return vehicles
}

async function seedTripsToday(client, routes, vehicles, drivers) {
  console.log(`\n🚌 Criando ${TRIPS_TODAY} trips para hoje...`)
  const trips = []
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Filtrar rotas e criar trips apenas para hoje
  const routesForTrips = routes.slice(0, Math.min(TRIPS_TODAY, routes.length))
  
  for (const route of routesForTrips) {
    // Selecionar veículo e motorista da mesma empresa
    const routeCompanyId = route.company_id
    const availableVehicles = vehicles.filter(v => v.company_id === routeCompanyId)
    const availableDrivers = drivers.filter(d => d.company_id === routeCompanyId)
    
    if (availableVehicles.length === 0 || availableDrivers.length === 0) continue
    
    const vehicle = availableVehicles[Math.floor(Math.random() * availableVehicles.length)]
    const driver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)]
    
    // Horário agendado baseado no índice da rota (simular shift)
    const scheduledTime = new Date(today)
    const routeIndex = routes.indexOf(route)
    const shiftType = routeIndex % 3 // 0=manha, 1=tarde, 2=noite
    if (shiftType === 0) {
      scheduledTime.setHours(7 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60))
    } else if (shiftType === 1) {
      scheduledTime.setHours(13 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60))
    } else {
      scheduledTime.setHours(18 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60))
    }
    
    // Status: algumas inProgress, algumas scheduled
    const statuses = ['scheduled', 'inProgress', 'completed']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    // Verificar se já existe
    const { rows: existing } = await client.query(
      `SELECT id FROM public.trips 
       WHERE route_id = $1 AND vehicle_id = $2 
       AND DATE(scheduled_at) = $3`,
      [route.id, vehicle.id, today.toISOString().split('T')[0]]
    )
    
    if (existing.length > 0) {
      trips.push(existing[0])
      continue
    }
    
    // Criar trip
    try {
      const { rows } = await client.query(
        `INSERT INTO public.trips (
          route_id, vehicle_id, driver_id, status, scheduled_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id`,
        [route.id, vehicle.id, driver.id, status, scheduledTime.toISOString()]
      )
      trips.push(rows[0])
    } catch (error) {
      if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
        console.warn(`   ⚠️  Erro ao criar trip: ${error.message}`)
      }
    }
  }
  
  console.log(`   ✅ ${trips.length} trips criadas/verificadas`)
  return trips
}

async function seedAlerts(client, routes, trips, companies) {
  console.log(`\n🚨 Criando ${ALERTS_COUNT} alertas...`)
  let created = 0
  let skipped = 0
  
  for (let i = 0; i < ALERTS_COUNT; i++) {
    const alertType = ALERT_TYPES[i % ALERT_TYPES.length]
    const severity = ALERT_SEVERITIES[i % ALERT_SEVERITIES.length]
    const route = routes[Math.floor(Math.random() * routes.length)]
    const trip = trips.length > 0 ? trips[Math.floor(Math.random() * trips.length)] : null
    
    const messages = {
      'route_delayed': `Rota ${route.name} atrasada em ${15 + Math.floor(Math.random() * 30)} minutos`,
      'bus_stopped': `Ônibus parado há mais de 5 minutos na rota ${route.name}`,
      'deviation': `Desvio detectado na rota ${route.name}`,
      'passenger_not_embarked': `Passageiro não embarcou na rota ${route.name}`,
      'checklist_missing': `Checklist não realizado para rota ${route.name}`
    }
    
    const message = messages[alertType] || `Alerta na rota ${route.name}`
    const isResolved = Math.random() > 0.6 // 40% resolvidos
    
    try {
      await client.query(
        `INSERT INTO public.gf_alerts (
          alert_type, severity, route_id, trip_id, company_id, 
          message, is_resolved, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT DO NOTHING`,
        [
          alertType,
          severity,
          route.id,
          trip?.id || null,
          route.company_id,
          message,
          isResolved
        ]
      )
      created++
    } catch (error) {
      if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
        console.warn(`   ⚠️  Erro ao criar alerta: ${error.message}`)
      }
      skipped++
    }
  }
  
  console.log(`   ✅ ${created} criados, ${skipped} já existiam/erros`)
}

async function refreshMaterializedViews(client) {
  console.log('\n🔄 Atualizando materialized views...')
  
  try {
    await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_operator_kpis')
    console.log('   ✅ mv_operator_kpis atualizado')
  } catch (error) {
    console.warn(`   ⚠️  Erro ao atualizar mv_operator_kpis: ${error.message}`)
  }
  
  try {
    await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_admin_kpis')
    console.log('   ✅ mv_admin_kpis atualizado')
  } catch (error) {
    // Ignorar se não existir
    if (!error.message.includes('does not exist')) {
      console.warn(`   ⚠️  Erro ao atualizar mv_admin_kpis: ${error.message}`)
    }
  }
}

async function seedOperatorData() {
  console.log('🌱 Iniciando seed de dados do operador...\n')
  
  const client = new Client({
    connectionString: DATABASE_URL,
  })
  
  try {
    console.log('Conectando ao banco de dados...')
    await client.connect()
    console.log('✅ Conectado!\n')
    
    // Executar seeds
    const companies = await getOrCreateCompanies(client)
    const routes = await seedRoutes(client, companies)
    const employees = await seedEmployees(client, companies)
    const drivers = await seedDrivers(client, companies)
    const vehicles = await seedVehicles(client, companies)
    const trips = await seedTripsToday(client, routes, vehicles, drivers)
    await seedAlerts(client, routes, trips, companies)
    await refreshMaterializedViews(client)
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ SEED OPERADOR CONCLUÍDO!')
    console.log('='.repeat(60))
    console.log(`Empresas: ${companies.length}`)
    console.log(`Rotas: ${routes.length}`)
    console.log(`Funcionários: ${employees.length}`)
    console.log(`Motoristas: ${drivers.length}`)
    console.log(`Veículos: ${vehicles.length}`)
    console.log(`Trips hoje: ${trips.length}`)
    console.log('='.repeat(60))
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erro durante seed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedOperatorData().catch(console.error)
}

module.exports = { seedOperatorData }

