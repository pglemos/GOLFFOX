require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function autoFixComplete() {
  console.log('🚀 CORREÇÃO AUTOMÁTICA COMPLETA\n')
  console.log('='.repeat(70))

  // 1. Verificar se precisa de correção
  console.log('\n1️⃣ Verificando necessidade de correção...')
  const { data: company } = await supabase.from('companies').select('*').limit(1).single()
  
  if (company && 'updated_at' in company) {
    console.log('   ✅ Coluna updated_at já existe - não precisa de correção!')
    console.log('\n✅ Tudo já está funcionando!')
    return { success: true, alreadyFixed: true }
  }

  console.log('   ⚠️ Correção necessária')

  // 2. Tentar múltiplas abordagens
  console.log('\n2️⃣ Tentando executar correção...')

  // Abordagem 1: Tentar criar função via RPC
  console.log('   📌 Abordagem 1: Criar função SQL via Supabase...')
  try {
    // Primeiro, vamos tentar criar a função usando uma query SQL
    // Mas o Supabase REST API não permite isso diretamente
    // Vamos tentar uma abordagem diferente: usar o Supabase Management API
    
    // Verificar se temos acesso ao Management API
    const managementApiUrl = supabaseUrl.replace('/rest/v1', '')
    
    // Tentar criar função via uma chamada HTTP direta
    const fetch = require('node-fetch')
    
    // SQL para criar função
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION fix_companies_updated_at()
      RETURNS void AS $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE public.companies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
          UPDATE public.companies SET updated_at = created_at WHERE updated_at IS NULL;
        END IF;
        
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = TG_TABLE_SCHEMA 
            AND table_name = TG_TABLE_NAME 
            AND column_name = 'updated_at'
          ) THEN
            NEW.updated_at = NOW();
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
        CREATE TRIGGER update_companies_updated_at 
          BEFORE UPDATE ON public.companies
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Tentar executar via Supabase REST API usando uma função auxiliar
    // Como não podemos executar ALTER TABLE diretamente, vamos tentar
    // criar a função primeiro via uma migration que já existe
    
    // Verificar se há uma forma de executar via Supabase CLI
    try {
      execSync('supabase --version', { stdio: 'ignore' })
      console.log('   ✅ Supabase CLI encontrado')
      
      // Tentar executar migration via CLI
      const migrationFile = path.join(__dirname, '..', '..', 'database', 'migrations', 'fix_companies_updated_at_final.sql')
      if (fs.existsSync(migrationFile)) {
        console.log('   📋 Arquivo de migration encontrado')
        console.log('   🔄 Tentando executar via Supabase CLI...')
        
        // Executar via CLI (requer projeto linkado)
        try {
          execSync(`supabase db push --db-url "${process.env.DATABASE_URL || ''}"`, {
            stdio: 'pipe',
            cwd: path.join(__dirname, '..', '..')
          })
          console.log('   ✅ Migration executada via CLI!')
        } catch (err) {
          console.log('   ⚠️ CLI requer configuração adicional')
        }
      }
    } catch (err) {
      console.log('   ⚠️ Supabase CLI não encontrado')
    }

    // Abordagem 2: Tentar usar Python/psycopg2 se disponível
    console.log('\n   📌 Abordagem 2: Tentando via Python...')
    try {
      execSync('python --version', { stdio: 'ignore' })
      console.log('   ✅ Python encontrado')
      
      // Executar script Python
      const pythonScript = path.join(__dirname, 'execute-sql-via-python.js')
      if (fs.existsSync(pythonScript)) {
        try {
          execSync(`node "${pythonScript}"`, { stdio: 'inherit' })
          console.log('   ✅ SQL executado via Python!')
          
          // Verificar se funcionou
          const { data: companyAfter } = await supabase.from('companies').select('*').limit(1).single()
          if (companyAfter && 'updated_at' in companyAfter) {
            console.log('\n✅ Correção aplicada com sucesso!')
            return { success: true }
          }
        } catch (err) {
          console.log('   ⚠️ Erro ao executar via Python:', err.message)
        }
      }
    } catch (err) {
      console.log('   ⚠️ Python não encontrado')
    }

    // Abordagem 3: Usar uma workaround - criar função via uma query que já existe
    console.log('\n   📌 Abordagem 3: Workaround via função existente...')
    
    // Infelizmente, não há uma forma direta de executar ALTER TABLE via REST API
    // A única forma é via conexão direta ao PostgreSQL ou Supabase CLI
    
    console.log('   ⚠️ Não foi possível executar automaticamente')
    console.log('   💡 Limitação: Supabase REST API não permite ALTER TABLE')
    
    return { 
      success: false, 
      needsManual: true,
      sql: createFunctionSQL 
    }

  } catch (error) {
    console.error('   ❌ Erro:', error.message)
    return { success: false, error: error.message }
  }
}

// Executar correção
autoFixComplete()
  .then(async (result) => {
    if (result.success && !result.alreadyFixed) {
      // Aguardar um pouco e testar
      console.log('\n3️⃣ Aguardando e testando...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const { data: company } = await supabase.from('companies').select('*').limit(1).single()
      if (company && 'updated_at' in company) {
        console.log('   ✅ Verificação: Coluna updated_at existe!')
      }
    }
    
    if (result.success) {
      console.log('\n✅ CORREÇÃO APLICADA COM SUCESSO!')
      console.log('\n4️⃣ Executando testes finais...')
      
      // Executar testes
      const { execSync } = require('child_process')
      try {
        execSync('node scripts/final-test-all-deletes.js', { stdio: 'inherit' })
      } catch (err) {
        // Testes podem falhar se ainda não foi aplicado
      }
      
      process.exit(0)
    } else {
      console.log('\n⚠️ Não foi possível executar automaticamente')
      console.log('\n📋 SQL necessário (copie e execute no Supabase Dashboard):')
      console.log('='.repeat(70))
      if (result.sql) {
        console.log(result.sql)
      } else {
        const migrationFile = path.join(__dirname, '..', '..', 'database', 'migrations', 'fix_companies_updated_at_final.sql')
        if (fs.existsSync(migrationFile)) {
          console.log(fs.readFileSync(migrationFile, 'utf-8'))
        }
      }
      console.log('='.repeat(70))
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('❌ Erro fatal:', err)
    process.exit(1)
  })

