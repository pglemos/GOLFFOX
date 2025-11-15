require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSQLDirect() {
  console.log('🚀 Executando correção SQL automaticamente...\n')

  // SQL para criar função que pode ser executada via RPC
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION fix_companies_updated_at()
    RETURNS void AS $$
    BEGIN
      -- Adicionar coluna se não existir
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'companies' 
        AND column_name = 'updated_at'
      ) THEN
        ALTER TABLE public.companies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        UPDATE public.companies SET updated_at = created_at WHERE updated_at IS NULL;
      END IF;

      -- Corrigir função do trigger
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

      -- Recriar trigger
      DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
      CREATE TRIGGER update_companies_updated_at 
        BEFORE UPDATE ON public.companies
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  try {
    // Tentar executar via RPC usando uma abordagem alternativa
    // Vamos tentar criar a função primeiro via uma query SQL direta
    console.log('1️⃣ Tentando criar função SQL via Supabase...')
    
    // Como não podemos executar ALTER TABLE diretamente via REST API,
    // vamos tentar usar o Supabase Management API ou uma conexão direta
    // Por enquanto, vamos verificar se já existe e tentar uma abordagem diferente
    
    // Verificar se a coluna já existe
    const { data: company } = await supabase.from('companies').select('*').limit(1).single()
    
    if (company && 'updated_at' in company) {
      console.log('   ✅ Coluna updated_at já existe!')
      return { success: true, message: 'Já corrigido' }
    }

    // Tentar usar uma função RPC se existir
    console.log('2️⃣ Tentando executar via RPC...')
    try {
      const { data, error } = await supabase.rpc('fix_companies_updated_at')
      if (!error) {
        console.log('   ✅ Função executada com sucesso!')
        return { success: true }
      }
    } catch (err) {
      console.log('   ⚠️ Função RPC não existe ainda')
    }

    // Se não funcionar, vamos tentar criar a função primeiro
    // Mas isso também requer SQL direto...
    console.log('3️⃣ Tentando abordagem alternativa...')
    
    // Infelizmente, o Supabase REST API não permite executar ALTER TABLE
    // Vamos tentar usar o Supabase CLI ou Management API se disponível
    console.log('   ⚠️ Não é possível executar ALTER TABLE via REST API')
    console.log('   💡 Tentando criar função via migration...')
    
    // Vamos criar um arquivo de migration que pode ser executado
    // e tentar usar o Supabase CLI se disponível
    const fs = require('fs')
    const path = require('path')
    
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'fix_companies_updated_at_final.sql')
    if (fs.existsSync(migrationPath)) {
      console.log('   ✅ Arquivo de migration encontrado')
      console.log('   📋 Tentando executar via Supabase CLI...')
      
      // Tentar executar via Supabase CLI se disponível
      const { execSync } = require('child_process')
      try {
        // Verificar se supabase CLI está disponível
        execSync('supabase --version', { stdio: 'ignore' })
        console.log('   ✅ Supabase CLI encontrado')
        console.log('   🔄 Executando migration...')
        
        // Tentar executar via CLI
        const sql = fs.readFileSync(migrationPath, 'utf-8')
        // Infelizmente, precisamos das credenciais de conexão direta
        console.log('   ⚠️ Requer conexão direta ao PostgreSQL')
      } catch (err) {
        console.log('   ⚠️ Supabase CLI não encontrado')
      }
    }

    return { 
      success: false, 
      needsManual: true,
      sql: createFunctionSQL 
    }
  } catch (error) {
    console.error('❌ Erro:', error.message)
    return { success: false, error: error.message }
  }
}

// Executar
executeSQLDirect()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Correção aplicada com sucesso!')
      process.exit(0)
    } else {
      console.log('\n⚠️ Não foi possível executar automaticamente')
      console.log('📋 SQL necessário:')
      console.log(result.sql || 'Ver database/migrations/fix_companies_updated_at_final.sql')
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('❌ Erro fatal:', err)
    process.exit(1)
  })

