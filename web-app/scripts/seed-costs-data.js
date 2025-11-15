const { Client } = require('pg')
const path = require('path')
const fs = require('fs')

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || ''

// Configurações de seed
const COSTS_PER_COMPANY = 50 // Custos por empresa
const DAYS_BACK = 90 // Últimos 90 dias

async function seedCostsData() {
  console.log('🌱 Iniciando seed de dados de custos...\n')

  if (!DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não configurada')
    console.error('Configure DATABASE_URL ou SUPABASE_DB_URL no .env')
    process.exit(1)
  }

  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('🔌 Conectando ao banco de dados...')
    await client.connect()
    console.log('✅ Conectado!\n')

    // 1. Buscar empresas existentes
    console.log('🏢 Buscando empresas...')
    const { rows: companies } = await client.query(`
      SELECT id, name FROM public.companies 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 5
    `)

    if (companies.length === 0) {
      console.log('⚠️  Nenhuma empresa encontrada. Crie empresas primeiro.')
      process.exit(0)
    }

    console.log(`   ✅ ${companies.length} empresas encontradas\n`)

    // 2. Buscar categorias de custos
    console.log('📋 Buscando categorias de custos...')
    const { rows: categories } = await client.query(`
      SELECT id, group_name, category, subcategory 
      FROM public.gf_cost_categories 
      WHERE is_active = true 
      ORDER BY group_name, category
    `)

    if (categories.length === 0) {
      console.log('⚠️  Nenhuma categoria encontrada. Execute v44_seed_cost_categories.sql primeiro.')
      process.exit(0)
    }

    console.log(`   ✅ ${categories.length} categorias encontradas\n`)

    // 3. Buscar rotas, veículos e motoristas
    console.log('🔍 Buscando rotas, veículos e motoristas...')
    const { rows: routes } = await client.query(`
      SELECT id, name, company_id FROM public.routes 
      WHERE company_id IN (${companies.map(c => `'${c.id}'`).join(',')})
      LIMIT 20
    `)

    const { rows: vehicles } = await client.query(`
      SELECT id, plate FROM public.vehicles LIMIT 10
    `)

    const { rows: drivers } = await client.query(`
      SELECT id, email FROM public.users 
      WHERE role = 'driver' 
      LIMIT 10
    `)

    console.log(`   ✅ ${routes.length} rotas, ${vehicles.length} veículos, ${drivers.length} motoristas\n`)

    // 4. Criar custos
    console.log(`💰 Criando ${COSTS_PER_COMPANY} custos por empresa...`)
    let totalCreated = 0
    const sources = ['manual', 'import', 'invoice', 'calc']
    const units = ['litro', 'km', 'hora', 'mes', 'unidade', 'servico']

    for (const company of companies) {
      const companyRoutes = routes.filter(r => r.company_id === company.id)
      
      for (let i = 0; i < COSTS_PER_COMPANY; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)]
        const route = companyRoutes.length > 0 
          ? companyRoutes[Math.floor(Math.random() * companyRoutes.length)] 
          : null
        const vehicle = vehicles.length > 0 
          ? vehicles[Math.floor(Math.random() * vehicles.length)] 
          : null
        const driver = drivers.length > 0 
          ? drivers[Math.floor(Math.random() * drivers.length)] 
          : null

        // Data aleatória nos últimos 90 dias
        const daysAgo = Math.floor(Math.random() * DAYS_BACK)
        const date = new Date()
        date.setDate(date.getDate() - daysAgo)
        const dateStr = date.toISOString().split('T')[0]

        // Valores aleatórios
        const amount = Math.random() * 5000 + 100 // Entre R$ 100 e R$ 5.100
        const qty = category.unit ? Math.random() * 100 + 1 : null
        const source = sources[Math.floor(Math.random() * sources.length)]
        const unit = category.unit || (units[Math.floor(Math.random() * units.length)])

        try {
          const { rows } = await client.query(`
            INSERT INTO public.gf_costs (
              company_id, 
              route_id, 
              vehicle_id, 
              driver_id,
              cost_category_id,
              date,
              cost_date,
              amount,
              qty,
              unit,
              source,
              notes,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            RETURNING id
          `, [
            company.id,
            route?.id || null,
            vehicle?.id || null,
            driver?.id || null,
            category.id,
            dateStr,
            dateStr,
            amount,
            qty,
            unit,
            source,
            `Custo de teste - ${category.group_name} > ${category.category}`
          ])

          totalCreated++
        } catch (error) {
          console.warn(`   ⚠️  Erro ao criar custo ${i + 1} para ${company.name}: ${error.message}`)
        }
      }
      console.log(`   ✅ ${COSTS_PER_COMPANY} custos criados para ${company.name}`)
    }

    // 5. Criar alguns orçamentos de exemplo
    console.log('\n📊 Criando orçamentos de exemplo...')
    let budgetsCreated = 0

    for (const company of companies) {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      // Orçamento geral do mês atual
      try {
        await client.query(`
          INSERT INTO public.gf_budgets (
            company_id,
            period_month,
            period_year,
            category_id,
            amount_budgeted,
            notes,
            created_at
          ) VALUES ($1, $2, $3, NULL, $4, $5, NOW())
          ON CONFLICT (company_id, period_month, period_year, category_id) DO NOTHING
        `, [
          company.id,
          currentMonth,
          currentYear,
          Math.random() * 100000 + 50000, // Entre R$ 50k e R$ 150k
          'Orçamento mensal geral'
        ])
        budgetsCreated++
      } catch (error) {
        // Ignorar erros de conflito
      }

      // Orçamentos por categoria (algumas categorias principais)
      const mainCategories = categories
        .filter(c => ['operacionais', 'pessoal_operacional', 'contratuais'].includes(c.group_name))
        .slice(0, 3)

      for (const category of mainCategories) {
        try {
          await client.query(`
            INSERT INTO public.gf_budgets (
              company_id,
              period_month,
              period_year,
              category_id,
              amount_budgeted,
              notes,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (company_id, period_month, period_year, category_id) DO NOTHING
          `, [
            company.id,
            currentMonth,
            currentYear,
            category.id,
            Math.random() * 20000 + 5000, // Entre R$ 5k e R$ 25k
            `Orçamento para ${category.category}`
          ])
          budgetsCreated++
        } catch (error) {
          // Ignorar erros
        }
      }
    }

    console.log(`   ✅ ${budgetsCreated} orçamentos criados\n`)

    // 6. Refresh materialized views
    console.log('🔄 Atualizando materialized views...')
    try {
      await client.query('REFRESH MATERIALIZED VIEW mv_costs_monthly;')
      console.log('   ✅ mv_costs_monthly atualizado')
    } catch (error) {
      console.warn(`   ⚠️  Aviso ao atualizar mv_costs_monthly: ${error.message}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ SEED DE CUSTOS CONCLUÍDO!')
    console.log('='.repeat(60))
    console.log(`Empresas: ${companies.length}`)
    console.log(`Custos criados: ${totalCreated}`)
    console.log(`Orçamentos criados: ${budgetsCreated}`)
    console.log(`Categorias disponíveis: ${categories.length}`)
    console.log('='.repeat(60))

    // Validação rápida
    const r1 = await client.query('SELECT COUNT(*) FROM v_costs_secure')
    const r2 = await client.query('SELECT COUNT(*) FROM v_costs_kpis')
    const r3 = await client.query('SELECT COUNT(*) FROM gf_budgets')
    console.log('\n📊 Validação:')
    console.log(`Custos (secure view): ${r1.rows[0].count}`)
    console.log(`KPIs disponíveis: ${r2.rows[0].count}`)
    console.log(`Orçamentos: ${r3.rows[0].count}`)

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erro durante seed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await client.end()
  }
}

if (require.main === module) {
  seedCostsData().catch(console.error)
}

module.exports = { seedCostsData }

