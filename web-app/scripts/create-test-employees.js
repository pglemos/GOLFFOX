/**
 * Script para criar funcionários de teste para a empresa específica
 */

const { Client } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

// Construir DATABASE_URL
let DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

if (!DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  
  if (projectRef) {
    const password = process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'Guigui1309@'
    DATABASE_URL = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
  }
}

if (!DATABASE_URL) {
  DATABASE_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'
}

async function createEmployees() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined
  })

  try {
    console.log('👥 CRIANDO FUNCIONÁRIOS DE TESTE\n')
    
    await client.connect()
    console.log('✅ Conectado ao banco\n')

    const testCompanyId = '11111111-1111-4111-8111-1111111111c1'
    
    // Verificar se a empresa existe
    const companyCheck = await client.query(`
      SELECT id, name, role FROM companies WHERE id = $1
    `, [testCompanyId])
    
    if (companyCheck.rows.length === 0) {
      console.error(`❌ Empresa ${testCompanyId} não encontrada!`)
      console.log('\n   Empresas disponíveis:')
      const companies = await client.query(`
        SELECT id, name, role FROM companies LIMIT 10
      `)
      companies.rows.forEach(c => {
        console.log(`      - ${c.name} (${c.id}) - role: ${c.role}`)
      })
      process.exit(1)
    }
    
    console.log(`📊 Empresa: ${companyCheck.rows[0].name} (role: ${companyCheck.rows[0].role})\n`)
    
    // Verificar funcionários existentes
    const existing = await client.query(`
      SELECT COUNT(*) as count FROM gf_employee_company WHERE company_id = $1
    `, [testCompanyId])
    
    console.log(`   Funcionários existentes: ${existing.rows[0].count}\n`)
    
    // Criar funcionários de teste
    const funcionarios = [
      { name: 'João Silva', cpf: '11111111111', email: 'joao.silva@acme.com', phone: '(11) 98765-4321', address: 'Av. Paulista, 1000, São Paulo, SP', latitude: -23.561414, longitude: -46.656178 },
      { name: 'Maria Santos', cpf: '22222222222', email: 'maria.santos@acme.com', phone: '(11) 98765-4322', address: 'Rua Augusta, 500, São Paulo, SP', latitude: -23.556127, longitude: -46.660814 },
      { name: 'Pedro Oliveira', cpf: '33333333333', email: 'pedro.oliveira@acme.com', phone: '(11) 98765-4323', address: 'Rua da Consolação, 2000, São Paulo, SP', latitude: -23.553849, longitude: -46.662663 },
      { name: 'Ana Costa', cpf: '44444444444', email: 'ana.costa@acme.com', phone: '(11) 98765-4324', address: 'Av. Faria Lima, 3000, São Paulo, SP', latitude: -23.578516, longitude: -46.687056 },
      { name: 'Carlos Ferreira', cpf: '55555555555', email: 'carlos.ferreira@acme.com', phone: '(11) 98765-4325', address: 'Av. Rebouças, 1500, São Paulo, SP', latitude: -23.561700, longitude: -46.669800 },
      { name: 'Juliana Alves', cpf: '66666666666', email: 'juliana.alves@acme.com', phone: '(11) 98765-4326', address: 'Rua dos Pinheiros, 800, São Paulo, SP', latitude: -23.560500, longitude: -46.683100 },
      { name: 'Roberto Lima', cpf: '77777777777', email: 'roberto.lima@acme.com', phone: '(11) 98765-4327', address: 'Av. Brigadeiro Faria Lima, 2000, São Paulo, SP', latitude: -23.574900, longitude: -46.685300 },
      { name: 'Patricia Mendes', cpf: '88888888888', email: 'patricia.mendes@acme.com', phone: '(11) 98765-4328', address: 'Rua Haddock Lobo, 600, São Paulo, SP', latitude: -23.561200, longitude: -46.665100 },
      { name: 'Fernando Souza', cpf: '99999999999', email: 'fernando.souza@acme.com', phone: '(11) 98765-4329', address: 'Av. Ipiranga, 900, São Paulo, SP', latitude: -23.547800, longitude: -46.645000 },
      { name: 'Camila Rodrigues', cpf: '10101010101', email: 'camila.rodrigues@acme.com', phone: '(11) 98765-4330', address: 'Rua Oscar Freire, 1200, São Paulo, SP', latitude: -23.562400, longitude: -46.669900 }
    ]
    
    let created = 0
    let skipped = 0
    
    console.log('   Criando funcionários...\n')
    
    for (const func of funcionarios) {
      try {
        const result = await client.query(`
          INSERT INTO gf_employee_company (
            company_id, name, cpf, email, phone, address, 
            latitude, longitude, login_cpf, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
          ON CONFLICT (cpf) DO NOTHING
          RETURNING id
        `, [
          testCompanyId, 
          func.name, 
          func.cpf, 
          func.email, 
          func.phone, 
          func.address,
          func.latitude,
          func.longitude,
          func.cpf
        ])
        
        if (result.rowCount > 0) {
          console.log(`      ✅ ${func.name} (${func.email})`)
          created++
        } else {
          console.log(`      ⚠️  ${func.name} - já existe`)
          skipped++
        }
      } catch (err) {
        console.log(`      ❌ ${func.name}: ${err.message}`)
      }
    }
    
    console.log(`\n   ✅ Criados: ${created}`)
    console.log(`   ⚠️  Já existiam: ${skipped}`)
    
    // Verificar total final
    const final = await client.query(`
      SELECT COUNT(*) as count FROM gf_employee_company WHERE company_id = $1
    `, [testCompanyId])
    
    console.log(`   📊 Total de funcionários na empresa: ${final.rows[0].count}`)
    
    // Listar funcionários criados
    if (final.rows[0].count > 0) {
      console.log('\n   📋 Funcionários cadastrados:')
      const list = await client.query(`
        SELECT name, email, is_active 
        FROM gf_employee_company 
        WHERE company_id = $1 
        ORDER BY name 
        LIMIT 10
      `, [testCompanyId])
      
      list.rows.forEach(f => {
        console.log(`      - ${f.name} (${f.email}) - ${f.is_active ? 'Ativo' : 'Inativo'}`)
      })
    }
    
    console.log('\n✅ CONCLUÍDO!\n')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

createEmployees().catch(console.error)

