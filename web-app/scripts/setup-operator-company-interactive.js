/**
 * Script Interativo: Configuração Inicial de Empresa para Operador
 * 
 * Este script facilita a configuração inicial de empresas e mapeamento de operadores.
 * Execute: node scripts/setup-operator-company-interactive.js
 */

const { Client } = require('pg')
const readline = require('readline')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function listCompanies(client) {
  console.log('\n📋 Listando empresas disponíveis...\n')
  const result = await client.query(`
    SELECT id, name, created_at
    FROM companies
    ORDER BY created_at DESC
    LIMIT 20
  `)
  
  if (result.rows.length === 0) {
    console.log('⚠️  Nenhuma empresa encontrada. Crie uma empresa primeiro no Supabase.\n')
    return []
  }
  
  result.rows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.name} (ID: ${row.id})`)
  })
  console.log('')
  return result.rows
}

async function listOperators(client) {
  console.log('\n👥 Listando operadores disponíveis...\n')
  const result = await client.query(`
    SELECT id, email, name, role
    FROM users
    WHERE role = 'operator' OR role = 'operador'
    ORDER BY created_at DESC
    LIMIT 20
  `)
  
  if (result.rows.length === 0) {
    console.log('⚠️  Nenhum operador encontrado. Crie um usuário com role "operator" primeiro.\n')
    return []
  }
  
  result.rows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.name || row.email} (${row.email}) - ID: ${row.id}`)
  })
  console.log('')
  return result.rows
}

async function setupBranding(client, companyId) {
  console.log('\n🎨 Configurando branding da empresa...\n')
  
  const companyName = await question('Nome da empresa (exibido no header): ')
  const logoUrl = await question('URL do logo (ou deixe vazio para usar padrão): ') || null
  const primaryHex = await question('Cor primária (hex, ex: #F97316): ') || '#F97316'
  const accentHex = await question('Cor de destaque (hex, ex: #2E7D32): ') || '#2E7D32'
  
  await client.query(`
    INSERT INTO gf_company_branding (
      company_id, 
      name, 
      logo_url, 
      primary_hex, 
      accent_hex
    )
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (company_id) 
    DO UPDATE SET 
      name = EXCLUDED.name,
      logo_url = EXCLUDED.logo_url,
      primary_hex = EXCLUDED.primary_hex,
      accent_hex = EXCLUDED.accent_hex,
      updated_at = now()
  `, [companyId, companyName, logoUrl, primaryHex, accentHex])
  
  console.log('✅ Branding configurado com sucesso!\n')
}

async function mapOperatorToCompany(client, userId, companyId) {
  console.log('\n🔗 Mapeando operador à empresa...\n')
  
  await client.query(`
    INSERT INTO gf_user_company_map (user_id, company_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, company_id) DO NOTHING
  `, [userId, companyId])
  
  console.log('✅ Operador mapeado com sucesso!\n')
}

async function refreshMaterializedView(client) {
  console.log('\n🔄 Populando materialized view de KPIs...\n')
  await client.query('REFRESH MATERIALIZED VIEW mv_operator_kpis;')
  console.log('✅ Materialized view atualizada!\n')
}

async function verifySetup(client, userId, companyId) {
  console.log('\n🔍 Verificando configuração...\n')
  
  // Verificar branding
  const brandingResult = await client.query(`
    SELECT * FROM gf_company_branding WHERE company_id = $1
  `, [companyId])
  
  if (brandingResult.rows.length > 0) {
    console.log('✅ Branding configurado:')
    console.log(`   Nome: ${brandingResult.rows[0].name}`)
    console.log(`   Logo: ${brandingResult.rows[0].logo_url || 'Não configurado'}`)
    console.log(`   Cores: ${brandingResult.rows[0].primary_hex} / ${brandingResult.rows[0].accent_hex}`)
  } else {
    console.log('⚠️  Branding não configurado')
  }
  
  // Verificar mapeamento
  const mappingResult = await client.query(`
    SELECT * FROM gf_user_company_map 
    WHERE user_id = $1 AND company_id = $2
  `, [userId, companyId])
  
  if (mappingResult.rows.length > 0) {
    console.log('✅ Operador mapeado à empresa')
  } else {
    console.log('⚠️  Operador não mapeado')
  }
  
  // Verificar KPIs
  const kpisResult = await client.query(`
    SELECT * FROM mv_operator_kpis WHERE company_id = $1
  `, [companyId])
  
  if (kpisResult.rows.length > 0) {
    console.log('✅ KPIs disponíveis para a empresa')
  } else {
    console.log('⚠️  KPIs ainda não disponíveis (pode ser normal se não houver dados)')
  }
  
  console.log('')
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('🔌 Conectando ao banco de dados...\n')
    await client.connect()
    console.log('✅ Conectado!\n')

    // Listar empresas
    const companies = await listCompanies(client)
    if (companies.length === 0) {
      console.log('❌ Nenhuma empresa disponível. Encerrando.')
      await client.end()
      rl.close()
      return
    }

    const companyIndex = await question(`Selecione o número da empresa (1-${companies.length}): `)
    const selectedCompany = companies[parseInt(companyIndex) - 1]
    
    if (!selectedCompany) {
      console.log('❌ Empresa inválida. Encerrando.')
      await client.end()
      rl.close()
      return
    }

    console.log(`\n✅ Empresa selecionada: ${selectedCompany.name}\n`)

    // Listar operadores
    const operators = await listOperators(client)
    if (operators.length === 0) {
      console.log('❌ Nenhum operador disponível. Encerrando.')
      await client.end()
      rl.close()
      return
    }

    const operatorIndex = await question(`Selecione o número do operador (1-${operators.length}): `)
    const selectedOperator = operators[parseInt(operatorIndex) - 1]
    
    if (!selectedOperator) {
      console.log('❌ Operador inválido. Encerrando.')
      await client.end()
      rl.close()
      return
    }

    console.log(`\n✅ Operador selecionado: ${selectedOperator.name || selectedOperator.email}\n`)

    // Configurar branding
    const setupBrandingAnswer = await question('Deseja configurar branding da empresa? (s/n): ')
    if (setupBrandingAnswer.toLowerCase() === 's') {
      await setupBranding(client, selectedCompany.id)
    }

    // Mapear operador
    const mapOperatorAnswer = await question('Deseja mapear operador à empresa? (s/n): ')
    if (mapOperatorAnswer.toLowerCase() === 's') {
      await mapOperatorToCompany(client, selectedOperator.id, selectedCompany.id)
    }

    // Atualizar materialized view
    const refreshAnswer = await question('Deseja atualizar materialized view de KPIs? (s/n): ')
    if (refreshAnswer.toLowerCase() === 's') {
      await refreshMaterializedView(client)
    }

    // Verificar setup
    await verifySetup(client, selectedOperator.id, selectedCompany.id)

    console.log('✅ Configuração concluída!\n')
    console.log('📝 Próximos passos:')
    console.log('   1. Faça login como operador no sistema')
    console.log('   2. Verifique se o seletor de empresas aparece no header')
    console.log('   3. Teste a troca de empresas e isolamento de dados\n')

  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    rl.close()
  }
}

main()

