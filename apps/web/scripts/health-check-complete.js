require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkSupabase() {
  console.log('\n🔍 Verificando Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('  ❌ Erro:', error.message);
      return false;
    }
    
    console.log('  ✅ Supabase conectado');
    return true;
  } catch (err) {
    console.error('  ❌ Erro:', err.message);
    return false;
  }
}

async function checkAppHealth() {
  console.log('\n🔍 Verificando aplicação...');
  
  return new Promise((resolve) => {
    const url = new URL('/api/health', appUrl);
    
    http.get(url.toString(), (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('  ✅ Aplicação respondendo');
          resolve(true);
        } else {
          console.error(`  ❌ Status: ${res.statusCode}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error('  ⚠️  Aplicação não está rodando:', err.message);
      console.log('  💡 Execute: npm run dev');
      resolve(false);
    });
  });
}

async function checkCriticalTables() {
  console.log('\n🔍 Verificando tabelas críticas...');
  
  const tables = ['companies', 'users', 'routes', 'vehicles', 'trips'];
  let allOk = true;
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        console.error(`  ❌ ${table}:`, error.message);
        allOk = false;
      } else {
        console.log(`  ✅ ${table}`);
      }
    } catch (err) {
      console.error(`  ❌ ${table}:`, err.message);
      allOk = false;
    }
  }
  
  return allOk;
}

async function main() {
  console.log('🏥 HEALTH CHECK COMPLETO');
  console.log('========================\n');
  
  const results = {
    supabase: await checkSupabase(),
    app: await checkAppHealth(),
    tables: await checkCriticalTables()
  };
  
  console.log('\n========================');
  console.log('📊 RESUMO:');
  console.log('========================\n');
  
  Object.entries(results).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`${status} ${key}`);
  });
  
  const allOk = Object.values(results).every(v => v);
  
  if (allOk) {
    console.log('\n✅ Sistema saudável!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Alguns problemas encontrados');
    process.exit(1);
  }
}

main();

