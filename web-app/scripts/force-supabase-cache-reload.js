/**
 * Script para forçar reload do cache do Supabase via SQL
 */

const { Client } = require('pg');
const DB_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function forceReload() {
  const client = new Client({ connectionString: DB_URL });
  
  console.log('🔄 FORÇANDO RELOAD DO CACHE DO SUPABASE\n');
  console.log('═══════════════════════════════════════\n');

  try {
    await client.connect();
    console.log('✅ Conectado ao banco\n');

    // 1. Notificar mudanças no schema (pode ajudar)
    console.log('1️⃣  Enviando notificação de mudança...');
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('   ✓ Notificação enviada\n');

    // 2. Executar ANALYZE nas tabelas principais (força atualização de estatísticas)
    console.log('2️⃣  Atualizando estatísticas das tabelas...');
    const tables = ['vehicles', 'trips', 'driver_positions', 'routes', 'route_stops'];
    for (const table of tables) {
      await client.query(`ANALYZE ${table}`);
      console.log(`   ✓ ${table}`);
    }
    console.log('');

    // 3. Verificar que os dados estão acessíveis
    console.log('3️⃣  Verificando acesso aos dados...\n');
    
    const { rows: [vehicleCount] } = await client.query(`
      SELECT COUNT(*) as count FROM vehicles WHERE is_active = true
    `);
    console.log(`   ✓ Veículos ativos: ${vehicleCount.count}`);

    const { rows: [tripCount] } = await client.query(`
      SELECT COUNT(*) as count FROM trips WHERE status = 'inProgress'
    `);
    console.log(`   ✓ Trips ativas: ${tripCount.count}`);

    const { rows: [gpsCount] } = await client.query(`
      SELECT COUNT(*) as count FROM driver_positions 
      WHERE timestamp > NOW() - INTERVAL '1 hour'
    `);
    console.log(`   ✓ GPS (última hora): ${gpsCount.count}`);

    console.log('\n═══════════════════════════════════════');
    console.log('\n✅ SCRIPT CONCLUÍDO\n');
    console.log('⚠️  IMPORTANTE: Isso pode NÃO ser suficiente!\n');
    console.log('O cache do Supabase é gerenciado pelo PostgREST e');
    console.log('pode precisar de reload manual via dashboard.\n');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

forceReload();

