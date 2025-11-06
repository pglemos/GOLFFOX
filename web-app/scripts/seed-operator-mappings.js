/**
 * Script: Seed de Mapeamentos Operador  Empresa
 * Mapeia usuários operadores existentes para suas empresas via users.company_id
 */

const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

async function seedOperatorMappings() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('Conectando ao banco de dados...')
    await client.connect()
    console.log('Conectado!\n')

    // 1. Verificar se a tabela existe
    console.log('Verificando se gf_user_company_map existe...')
    const tableCheck = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_user_company_map')`)

    if (!tableCheck.rows[0].exists) {
      console.log('Tabela gf_user_company_map não existe. Execute as migrações primeiro!')
      process.exit(1)
    }

    // 2. Buscar operadores com company_id
    console.log('Buscando operadores com company_id...')
    const operatorsResult = await client.query(`SELECT id, email, company_id, role FROM public.users WHERE (role = 'operator' OR role = 'operador') AND company_id IS NOT NULL ORDER BY created_at DESC`)

    console.log(`   Encontrados ${operatorsResult.rows.length} operadores com company_id\n`)

    if (operatorsResult.rows.length === 0) {
      console.log('Nenhum operador encontrado. Nada para mapear.')
      process.exit(0)
    }

    // 3. Inserir mapeamentos (idempotente)
    console.log('Criando mapeamentos...')
    let created = 0
    let skipped = 0

    for (const operator of operatorsResult.rows) {
      try {
        const result = await client.query(`INSERT INTO public.gf_user_company_map (user_id, company_id) VALUES ($1, $2) ON CONFLICT (user_id, company_id) DO NOTHING RETURNING user_id, company_id`, [operator.id, operator.company_id])

        if (result.rows.length > 0) {
          created++
          console.log(`   ${operator.email} → Empresa ${operator.company_id}`)
        } else {
          skipped++
          console.log(`   ${operator.email} → Já mapeado`)
        }
      } catch (error) {
        console.error(`   Erro ao mapear ${operator.email}: ${error.message}`)
      }
    }

    console.log(`\nConcluído!`)
    console.log(`   Criados: ${created}`)
    console.log(`   Já existiam: ${skipped}`)
    console.log(`   Total: ${operatorsResult.rows.length}`)

    // 4. Verificar resultado final
    const finalCheck = await client.query(`SELECT COUNT(*) as total_mappings, COUNT(DISTINCT user_id) as unique_users, COUNT(DISTINCT company_id) as unique_companies FROM public.gf_user_company_map`)

    console.log(`\nEstatísticas finais:`)
    console.log(`   Total de mapeamentos: ${finalCheck.rows[0].total_mappings}`)
    console.log(`   Usuários únicos: ${finalCheck.rows[0].unique_users}`)
    console.log(`   Empresas únicas: ${finalCheck.rows[0].unique_companies}`)

  } catch (error) {
    console.error('Erro:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\nConexão fechada.')
  }
}

seedOperatorMappings()
