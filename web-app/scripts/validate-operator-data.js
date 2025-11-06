/**
 * Script: Validar Dados do Operador
 * Verifica se os dados criados estão acessíveis via views seguras
 */

const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

async function validateOperatorData() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  const results = {
    timestamp: new Date().toISOString(),
    raw_data: {},
    views_secure: {},
    recommendations: []
  }

  try {
    console.log('🔍 Validando dados do operador...\n')
    await client.connect()
    console.log('✅ Conectado!\n')

    // 1. Verificar dados brutos
    console.log('📊 Verificando dados brutos...')
    
    const rawChecks = [
      { name: 'Empresas', query: 'SELECT COUNT(*) as count FROM companies WHERE role = \'operator\' OR role = \'company\'' },
      { name: 'Rotas', query: 'SELECT COUNT(*) as count FROM routes' },
      { name: 'Funcionários', query: 'SELECT COUNT(*) as count FROM gf_employee_company' },
      { name: 'Alertas', query: 'SELECT COUNT(*) as count FROM gf_alerts' },
      { name: 'Branding', query: 'SELECT COUNT(*) as count FROM gf_company_branding' },
      { name: 'Mapeamentos', query: 'SELECT COUNT(*) as count FROM gf_user_company_map' }
    ]

    for (const check of rawChecks) {
      try {
        const result = await client.query(check.query)
        results.raw_data[check.name] = parseInt(result.rows[0].count)
        console.log(`   ${check.name}: ${results.raw_data[check.name]}`)
      } catch (error) {
        results.raw_data[check.name] = 0
        console.log(`   ${check.name}: Erro - ${error.message}`)
      }
    }

    // 2. Verificar views seguras (simulando como operador)
    console.log('\n👁️  Verificando views seguras...')
    console.log('   ⚠️  Nota: Views seguras retornam 0 sem autenticação RLS\n')

    const viewChecks = [
      { name: 'v_operator_dashboard_kpis_secure', query: 'SELECT COUNT(*) as count FROM v_operator_dashboard_kpis_secure' },
      { name: 'v_operator_routes_secure', query: 'SELECT COUNT(*) as count FROM v_operator_routes_secure' },
      { name: 'v_operator_alerts_secure', query: 'SELECT COUNT(*) as count FROM v_operator_alerts_secure' },
      { name: 'v_operator_costs_secure', query: 'SELECT COUNT(*) as count FROM v_operator_costs_secure' },
      { name: 'v_my_companies', query: 'SELECT COUNT(*) as count FROM v_my_companies' }
    ]

    for (const check of viewChecks) {
      try {
        const result = await client.query(check.query)
        results.views_secure[check.name] = parseInt(result.rows[0].count)
        const status = results.views_secure[check.name] > 0 ? '✅' : '⚠️'
        console.log(`   ${status} ${check.name}: ${results.views_secure[check.name]}`)
      } catch (error) {
        results.views_secure[check.name] = 0
        console.log(`   ❌ ${check.name}: Erro - ${error.message}`)
      }
    }

    // 3. Verificar materialized view
    console.log('\n📊 Verificando materialized view...')
    try {
      const result = await client.query('SELECT COUNT(*) as count FROM mv_operator_kpis')
      results.views_secure['mv_operator_kpis'] = parseInt(result.rows[0].count)
      const status = results.views_secure['mv_operator_kpis'] > 0 ? '✅' : '⚠️'
      console.log(`   ${status} mv_operator_kpis: ${results.views_secure['mv_operator_kpis']}`)
    } catch (error) {
      results.views_secure['mv_operator_kpis'] = 0
      console.log(`   ❌ mv_operator_kpis: Erro - ${error.message}`)
    }

    // 4. Recomendações
    console.log('\n💡 Recomendações:')
    
    if (results.raw_data['Mapeamentos'] === 0) {
      console.log('   ⚠️  Nenhum mapeamento operador → empresa encontrado')
      console.log('      → Execute: node scripts/seed-operator-mappings.js')
      results.recommendations.push('Executar seed-operator-mappings.js')
    }

    if (results.raw_data['Rotas'] > 0 && results.views_secure['v_operator_routes_secure'] === 0) {
      console.log('   ⚠️  Rotas existem mas views seguras retornam 0')
      console.log('      → Isso é normal sem autenticação RLS')
      console.log('      → Teste fazendo login como operador')
      results.recommendations.push('Testar views com login de operador')
    }

    if (results.raw_data['Branding'] === 0) {
      console.log('   ⚠️  Nenhum branding configurado')
      console.log('      → Execute: node scripts/seed-company-branding.js')
      results.recommendations.push('Executar seed-company-branding.js')
    }

    if (results.views_secure['mv_operator_kpis'] === 0) {
      console.log('   ⚠️  Materialized view vazia')
      console.log('      → Execute: REFRESH MATERIALIZED VIEW mv_operator_kpis;')
      results.recommendations.push('Refresh materialized view')
    }

    if (results.recommendations.length === 0) {
      console.log('   ✅ Tudo parece estar configurado corretamente!')
    }

    // Salvar resultado
    const fs = require('fs')
    const path = require('path')
    const outputPath = path.join(__dirname, '..', 'VALIDATION_RESULT.json')
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
    console.log(`\n📄 Resultado salvo em: ${outputPath}`)

  } catch (error) {
    console.error('❌ Erro:', error.message)
    throw error
  } finally {
    await client.end()
    console.log('\n🔌 Conexão fechada.')
  }
}

validateOperatorData()
  .then(() => {
    console.log('\n✅ Validação concluída!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })

