/**
 * Script para corrigir os problemas identificados no diagnóstico
 * 1. Corrigir role das empresas para 'operator'
 * 2. Criar funcionários para empresa de teste
 * 3. Garantir mapeamentos user→empresa corretos
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

async function fix() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined
  })

  try {
    console.log('🔧 CORRIGINDO PROBLEMAS - Página de Funcionários\n')
    console.log('=' .repeat(80))
    
    await client.connect()
    console.log('✅ Conectado ao banco\n')

    // 1. Verificar e corrigir role das empresas
    console.log('📊 1. CORRIGINDO ROLE DAS EMPRESAS\n')
    
    // Buscar empresas que deveriam ser 'operator' mas não são
    const companiesCheck = await client.query(`
      SELECT id, name, role 
      FROM companies 
      WHERE id IN (
        '11111111-1111-4111-8111-1111111111c1',
        '11111111-1111-4111-8111-1111111111c2'
      )
    `)
    
    console.log(`   Encontradas ${companiesCheck.rows.length} empresas de teste`)
    
    for (const company of companiesCheck.rows) {
      console.log(`   - ${company.name}: role atual = ${company.role}`)
      
      if (company.role !== 'operator') {
        console.log(`     → Corrigindo para 'operator'...`)
        await client.query(`
          UPDATE companies 
          SET role = 'operator' 
          WHERE id = $1
        `, [company.id])
        console.log(`     ✅ Corrigido`)
      } else {
        console.log(`     ✅ Já está correto`)
      }
    }

    // 2. Verificar usuários operadores
    console.log('\n👤 2. VERIFICANDO USUÁRIOS OPERADORES\n')
    
    const operators = await client.query(`
      SELECT id, email, role 
      FROM users 
      WHERE role = 'operator'
      LIMIT 5
    `)
    
    console.log(`   Encontrados ${operators.rows.length} usuários operadores:`)
    operators.rows.forEach(op => {
      console.log(`      - ${op.email} (${op.id})`)
    })

    // 3. Garantir mapeamentos user→empresa
    console.log('\n🔗 3. GARANTINDO MAPEAMENTOS USER→EMPRESA\n')
    
    if (operators.rows.length > 0) {
      const operatorId = operators.rows[0].id
      const companyId = '11111111-1111-4111-8111-1111111111c1'
      
      // Verificar se mapeamento existe
      const mappingCheck = await client.query(`
        SELECT * FROM gf_user_company_map 
        WHERE user_id = $1 AND company_id = $2
      `, [operatorId, companyId])
      
      if (mappingCheck.rows.length === 0) {
        console.log(`   Criando mapeamento: ${operators.rows[0].email} → Empresa de teste`)
        await client.query(`
          INSERT INTO gf_user_company_map (user_id, company_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, company_id) DO NOTHING
        `, [operatorId, companyId])
        console.log(`   ✅ Mapeamento criado`)
      } else {
        console.log(`   ✅ Mapeamento já existe`)
      }
      
      // Verificar se segunda empresa existe antes de mapear
      const company2Check = await client.query(`
        SELECT id FROM companies WHERE id = '11111111-1111-4111-8111-1111111111c2'
      `)
      
      if (company2Check.rows.length > 0) {
        const companyId2 = '11111111-1111-4111-8111-1111111111c2'
        await client.query(`
          INSERT INTO gf_user_company_map (user_id, company_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, company_id) DO NOTHING
        `, [operatorId, companyId2])
        console.log(`   ✅ Mapeado para segunda empresa também`)
      }
    }

    // 4. Criar funcionários de teste
    console.log('\n👥 4. CRIANDO FUNCIONÁRIOS DE TESTE\n')
    
    const testCompanyId = '11111111-1111-4111-8111-1111111111c1'
    
    // Verificar quantos funcionários já existem
    const existingCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM gf_employee_company 
      WHERE company_id = $1
    `, [testCompanyId])
    
    console.log(`   Funcionários existentes: ${existingCount.rows[0].count}`)
    
    if (existingCount.rows[0].count === 0) {
      console.log(`   Criando 5 funcionários de teste...`)
      
      const funcionarios = [
        { name: 'João Silva', cpf: '111.111.111-11', email: 'joao.silva@empresa.com', phone: '(11) 98765-4321', address: 'São Paulo, SP' },
        { name: 'Maria Santos', cpf: '222.222.222-22', email: 'maria.santos@empresa.com', phone: '(11) 98765-4322', address: 'São Paulo, SP' },
        { name: 'Pedro Oliveira', cpf: '333.333.333-33', email: 'pedro.oliveira@empresa.com', phone: '(11) 98765-4323', address: 'São Paulo, SP' },
        { name: 'Ana Costa', cpf: '444.444.444-44', email: 'ana.costa@empresa.com', phone: '(11) 98765-4324', address: 'São Paulo, SP' },
        { name: 'Carlos Ferreira', cpf: '555.555.555-55', email: 'carlos.ferreira@empresa.com', phone: '(11) 98765-4325', address: 'São Paulo, SP' }
      ]
      
      for (const func of funcionarios) {
        try {
          await client.query(`
            INSERT INTO gf_employee_company (
              company_id, name, cpf, email, phone, address, login_cpf, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            ON CONFLICT (cpf) DO NOTHING
          `, [testCompanyId, func.name, func.cpf, func.email, func.phone, func.address, func.cpf])
          
          console.log(`      ✅ ${func.name}`)
        } catch (err) {
          console.log(`      ⚠️  ${func.name}: ${err.message}`)
        }
      }
      
      console.log(`   ✅ Funcionários criados`)
    } else {
      console.log(`   ✅ Já existem funcionários cadastrados`)
    }

    // 5. Testar views após correções
    console.log('\n🧪 5. TESTANDO VIEWS APÓS CORREÇÕES\n')
    
    // Testar v_operator_employees
    const testView1 = await client.query(`
      SELECT COUNT(*) as count 
      FROM v_operator_employees 
      WHERE empresa_id = $1
    `, [testCompanyId])
    console.log(`   v_operator_employees: ${testView1.rows[0].count} registros`)
    
    // Testar v_operator_employees_secure (pode retornar 0 se não houver sessão)
    const testView2 = await client.query(`
      SELECT COUNT(*) as count 
      FROM v_operator_employees_secure 
      WHERE company_id = $1
    `, [testCompanyId])
    console.log(`   v_operator_employees_secure: ${testView2.rows[0].count} registros`)
    console.log(`   (Nota: view secure pode retornar 0 sem contexto de sessão)`)
    
    // Testar query direta
    const testDirect = await client.query(`
      SELECT COUNT(*) as count 
      FROM gf_employee_company 
      WHERE company_id = $1
    `, [testCompanyId])
    console.log(`   gf_employee_company (direto): ${testDirect.rows[0].count} registros`)

    // 6. Verificar company_ownership para o usuário operador
    console.log('\n🔐 6. TESTANDO company_ownership\n')
    
    if (operators.rows.length > 0) {
      // Nota: company_ownership depende de auth.uid(), que não está disponível nesta sessão
      console.log(`   company_ownership depende de auth.uid()`)
      console.log(`   Será testado automaticamente quando o usuário fizer login`)
      console.log(`   Usuário de teste: ${operators.rows[0].email}`)
    }

    // Resumo final
    console.log('\n' + '='.repeat(80))
    console.log('\n✅ CORREÇÕES CONCLUÍDAS!\n')
    console.log('📋 Próximos passos:')
    console.log('   1. Acesse a aplicação como usuário operador')
    console.log(`   2. URL: https://golffox.vercel.app/operator/funcionarios?company=${testCompanyId}`)
    console.log('   3. Verifique se os funcionários aparecem')
    console.log('   4. Verifique o console do navegador para logs de debug\n')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

fix().catch(console.error)

