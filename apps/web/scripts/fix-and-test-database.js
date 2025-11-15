/**
 * Script para corrigir problemas e testar o banco de dados
 */

const { Client } = require('pg');
const fs = require('path');

const DATABASE_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function runFullDiagnosticAndFix() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  console.log('🔧 DIAGNÓSTICO E CORREÇÃO COMPLETA\n');
  console.log('═══════════════════════════════════════\n');

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // PROBLEMA 1: Veículos sem company_id
    console.log('1️⃣  Verificando veículos sem company_id...');
    const vehiclesNoCompany = await client.query(`
      SELECT id, plate, model, company_id
      FROM vehicles
      WHERE is_active = true AND company_id IS NULL
    `);
    
    if (vehiclesNoCompany.rows.length > 0) {
      console.log(`❌ Encontrados ${vehiclesNoCompany.rows.length} veículos SEM company_id:`);
      vehiclesNoCompany.rows.forEach(v => {
        console.log(`   - ${v.plate} (${v.id})`);
      });
      
      console.log('\n📝 Corrigindo: Atribuindo veículos à primeira empresa...');
      
      const firstCompany = await client.query(`
        SELECT id, name FROM companies LIMIT 1
      `);
      
      if (firstCompany.rows.length > 0) {
        const companyId = firstCompany.rows[0].id;
        const companyName = firstCompany.rows[0].name;
        
        await client.query(`
          UPDATE vehicles
          SET company_id = $1
          WHERE is_active = true AND company_id IS NULL
        `, [companyId]);
        
        console.log(`✅ ${vehiclesNoCompany.rows.length} veículos atribuídos a "${companyName}"`);
      }
    } else {
      console.log('✅ Todos os veículos têm company_id');
    }
    console.log('');

    // PROBLEMA 2: Verificar RLS policies
    console.log('2️⃣  Verificando políticas RLS...');
    const policies = await client.query(`
      SELECT policyname, cmd
      FROM pg_policies
      WHERE tablename = 'vehicles'
    `);
    
    console.log(`${policies.rows.length > 0 ? '✅' : '❌'} Encontradas ${policies.rows.length} políticas RLS`);
    
    if (policies.rows.length === 0) {
      console.log('\n📝 AÇÃO NECESSÁRIA: Execute o script RLS no Supabase SQL Editor:');
      console.log('   database/migrations/v48_fix_vehicles_rls.sql');
      console.log('');
    } else {
      policies.rows.forEach(p => {
        console.log(`   - ${p.policyname} (${p.cmd})`);
      });
      console.log('');
    }

    // VERIFICAR se precisamos criar dados de teste
    console.log('3️⃣  Verificando necessidade de dados de teste...');
    const vehicleCount = await client.query(`
      SELECT COUNT(*) as total FROM vehicles WHERE is_active = true
    `);
    
    const count = parseInt(vehicleCount.rows[0].total);
    console.log(`✅ Total de veículos ativos: ${count}`);
    
    if (count < 3) {
      console.log('\n📝 RECOMENDAÇÃO: Criar mais veículos de teste');
      console.log('   Execute: database/CREATE_TEST_DATA.sql');
    }
    console.log('');

    // VERIFICAÇÃO FINAL: Testar query do mapa
    console.log('4️⃣  Testando query do mapa (simulando frontend)...');
    try {
      const mapQuery = await client.query(`
        SELECT 
          v.id,
          v.plate,
          v.model,
          v.year,
          v.prefix,
          v.capacity,
          v.is_active,
          v.photo_url,
          v.company_id,
          v.carrier_id,
          c.name as company_name
        FROM vehicles v
        LEFT JOIN companies c ON c.id = v.company_id
        WHERE v.is_active = true
        LIMIT 10
      `);
      
      console.log(`✅ Query do mapa retornou ${mapQuery.rows.length} veículos`);
      
      if (mapQuery.rows.length > 0) {
        console.log('\n   Veículos que aparecerão no mapa:');
        mapQuery.rows.forEach(v => {
          console.log(`   ✓ ${v.plate} (${v.model || 'Sem modelo'}) - ${v.company_name || 'Sem empresa'}`);
        });
      }
      console.log('');
      
    } catch (error) {
      console.error('❌ Erro na query do mapa:', error.message);
      console.log('');
    }

    // RESUMO FINAL E AÇÕES NECESSÁRIAS
    console.log('\n═══════════════════════════════════════');
    console.log('📊 RESUMO E PRÓXIMOS PASSOS\n');
    
    const vehiclesOk = count > 0;
    const rlsOk = policies.rows.length > 0;
    
    console.log(`${vehiclesOk ? '✅' : '❌'} Veículos: ${count} ativos`);
    console.log(`${rlsOk ? '✅' : '⚠️ '} RLS: ${policies.rows.length} políticas`);
    console.log('');

    if (vehiclesOk && rlsOk) {
      console.log('🎉 BANCO DE DADOS ESTÁ PRONTO!\n');
      console.log('PRÓXIMOS PASSOS:');
      console.log('1. No Supabase: Settings → API → "Reload schema cache"');
      console.log('2. Aguarde o deploy no Vercel completar (1-3 minutos)');
      console.log('3. Limpe o cache do navegador (Ctrl + Shift + Delete)');
      console.log('4. Teste em: https://golffox.vercel.app/admin/mapa');
      console.log('');
      console.log('🔍 PARA DEBUGAR NO NAVEGADOR:');
      console.log('   1. Abra F12 (Console)');
      console.log('   2. Cole e execute:');
      console.log('');
      console.log('   const { data, error } = await supabase');
      console.log('     .from("vehicles")');
      console.log('     .select("*")');
      console.log('     .eq("is_active", true);');
      console.log('   console.log("Veículos:", data?.length, data);');
      console.log('   console.log("Erro:", error);');
    } else {
      console.log('❌ AÇÕES NECESSÁRIAS:\n');
      
      if (!rlsOk) {
        console.log('1. Execute no Supabase SQL Editor:');
        console.log('   database/migrations/v48_fix_vehicles_rls.sql');
        console.log('');
      }
      
      if (!vehiclesOk) {
        console.log('2. Execute no Supabase SQL Editor:');
        console.log('   database/CREATE_TEST_DATA.sql');
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

runFullDiagnosticAndFix();

