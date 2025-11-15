/**
 * Script de diagnóstico usando DATABASE_URL
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function runDiagnostic() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  console.log('🔍 DIAGNÓSTICO COMPLETO DO BANCO DE DADOS\n');
  console.log('═══════════════════════════════════════\n');

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Verificar veículos ativos
    console.log('1️⃣  Verificando veículos ativos...');
    const vehiclesResult = await client.query(`
      SELECT id, plate, model, is_active, company_id, created_at
      FROM vehicles
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`✅ Encontrados ${vehiclesResult.rows.length} veículos ativos`);
    if (vehiclesResult.rows.length > 0) {
      console.log('   Primeiros veículos:');
      vehiclesResult.rows.slice(0, 3).forEach(v => {
        console.log(`   - ${v.plate} (${v.model}) - Company: ${v.company_id || 'null'}`);
      });
    } else {
      console.log('⚠️  ATENÇÃO: Não há veículos ativos no banco!');
      console.log('   📝 Ação necessária: Execute CREATE_TEST_DATA.sql');
    }
    console.log('');

    // 2. Contar veículos por status
    console.log('2️⃣  Contando veículos por status...');
    const countResult = await client.query(`
      SELECT is_active, COUNT(*) as total
      FROM vehicles
      GROUP BY is_active
    `);
    
    countResult.rows.forEach(row => {
      console.log(`   - is_active = ${row.is_active}: ${row.total} veículos`);
    });
    console.log('');

    // 3. Verificar empresas
    console.log('3️⃣  Verificando empresas...');
    const companiesResult = await client.query(`
      SELECT id, name
      FROM companies
      ORDER BY name
      LIMIT 5
    `);
    
    console.log(`✅ Encontradas ${companiesResult.rows.length} empresas`);
    companiesResult.rows.forEach(c => {
      console.log(`   - ${c.name} (${c.id})`);
    });
    console.log('');

    // 4. Verificar trips ativas
    console.log('4️⃣  Verificando trips ativas...');
    const tripsResult = await client.query(`
      SELECT COUNT(*) as total
      FROM trips
      WHERE status = 'inProgress'
    `);
    
    const tripCount = parseInt(tripsResult.rows[0].total);
    console.log(`✅ Encontradas ${tripCount} trips ativas`);
    if (tripCount === 0) {
      console.log('⚠️  ATENÇÃO: Nenhuma trip ativa (veículos aparecerão como "na garagem")');
    }
    console.log('');

    // 5. Verificar posições GPS recentes
    console.log('5️⃣  Verificando posições GPS (última hora)...');
    const positionsResult = await client.query(`
      SELECT COUNT(*) as total
      FROM driver_positions
      WHERE timestamp > NOW() - INTERVAL '1 hour'
    `);
    
    const posCount = parseInt(positionsResult.rows[0].total);
    console.log(`✅ Encontradas ${posCount} posições GPS na última hora`);
    if (posCount === 0) {
      console.log('⚠️  ATENÇÃO: Nenhuma posição GPS recente (veículos não aparecerão no mapa)');
    }
    console.log('');

    // 6. Verificar rotas ativas
    console.log('6️⃣  Verificando rotas ativas...');
    const routesResult = await client.query(`
      SELECT COUNT(*) as total
      FROM routes
      WHERE is_active = true
    `);
    
    console.log(`✅ Encontradas ${routesResult.rows[0].total} rotas ativas`);
    console.log('');

    // 7. Verificar políticas RLS
    console.log('7️⃣  Verificando políticas RLS da tabela vehicles...');
    const rlsResult = await client.query(`
      SELECT policyname, cmd, roles
      FROM pg_policies
      WHERE tablename = 'vehicles'
      ORDER BY policyname
    `);
    
    console.log(`✅ Encontradas ${rlsResult.rows.length} políticas RLS`);
    if (rlsResult.rows.length > 0) {
      console.log('   Políticas:');
      rlsResult.rows.forEach(p => {
        console.log(`   - ${p.policyname} (${p.cmd})`);
      });
    } else {
      console.log('⚠️  ATENÇÃO: Nenhuma política RLS encontrada!');
      console.log('   📝 Ação necessária: Execute v48_fix_vehicles_rls.sql');
    }
    console.log('');

    // 8. Verificar se RLS está habilitado
    console.log('8️⃣  Verificando se RLS está habilitado...');
    const rlsEnabledResult = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE tablename = 'vehicles'
    `);
    
    const rlsEnabled = rlsEnabledResult.rows[0]?.rowsecurity;
    console.log(`${rlsEnabled ? '✅' : '❌'} RLS está ${rlsEnabled ? 'habilitado' : 'desabilitado'}`);
    console.log('');

    // 9. Verificar colunas da tabela vehicles
    console.log('9️⃣  Verificando colunas da tabela vehicles...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'vehicles'
      ORDER BY ordinal_position
    `);
    
    console.log(`✅ Tabela vehicles tem ${columnsResult.rows.length} colunas:`);
    const columnNames = columnsResult.rows.map(c => c.column_name);
    console.log('   ', columnNames.join(', '));
    console.log('');

    // 10. Verificar veículos sem company_id
    console.log('🔟 Verificando veículos sem company_id...');
    const noCompanyResult = await client.query(`
      SELECT COUNT(*) as total
      FROM vehicles
      WHERE company_id IS NULL AND is_active = true
    `);
    
    const noCompanyCount = parseInt(noCompanyResult.rows[0].total);
    if (noCompanyCount > 0) {
      console.log(`⚠️  ATENÇÃO: ${noCompanyCount} veículos ativos sem company_id`);
      console.log('   Isso pode causar problemas com RLS!');
    } else {
      console.log(`✅ Todos os veículos ativos têm company_id`);
    }
    console.log('');

    // RESUMO FINAL
    console.log('\n📊 RESUMO DO DIAGNÓSTICO\n');
    console.log('═══════════════════════════════════════\n');
    
    const issues = [];
    const warnings = [];
    
    if (vehiclesResult.rows.length === 0) {
      issues.push('🔴 CRÍTICO: Não há veículos ativos no banco');
    }
    
    if (rlsResult.rows.length === 0) {
      issues.push('🔴 CRÍTICO: Não há políticas RLS configuradas');
    }
    
    if (tripCount === 0) {
      warnings.push('⚠️  AVISO: Não há trips ativas');
    }
    
    if (posCount === 0) {
      warnings.push('⚠️  AVISO: Não há posições GPS recentes');
    }
    
    if (noCompanyCount > 0) {
      warnings.push(`⚠️  AVISO: ${noCompanyCount} veículos sem company_id`);
    }

    if (issues.length > 0) {
      console.log('PROBLEMAS CRÍTICOS:\n');
      issues.forEach(issue => console.log(issue));
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log('AVISOS:\n');
      warnings.forEach(warning => console.log(warning));
      console.log('');
    }
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ TUDO OK! O banco está configurado corretamente\n');
    }

    console.log('💡 PRÓXIMOS PASSOS:\n');
    
    if (vehiclesResult.rows.length === 0) {
      console.log('1. Execute: database/CREATE_TEST_DATA.sql no Supabase SQL Editor');
    }
    
    if (rlsResult.rows.length === 0) {
      console.log('2. Execute: database/migrations/v48_fix_vehicles_rls.sql no Supabase SQL Editor');
    }
    
    if (vehiclesResult.rows.length > 0 && rlsResult.rows.length > 0) {
      console.log('1. Limpe o cache do Supabase (Settings → API → Reload schema cache)');
      console.log('2. Aguarde o deploy no Vercel completar');
      console.log('3. Limpe o cache do navegador (Ctrl + Shift + Delete)');
      console.log('4. Teste o mapa em: https://golffox.vercel.app/admin/mapa');
    }

    console.log('\n═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

runDiagnostic();

