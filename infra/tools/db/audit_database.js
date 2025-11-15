/**
 * Script para auditar o banco de dados Supabase e listar todas as tabelas, views e RPCs
 */

const { Client } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.GF_DB_HOST || 'db.vmoxzesvjcfmrebagcwo.supabase.co',
  port: process.env.GF_DB_PORT || 5432,
  user: process.env.GF_DB_USER || 'postgres',
  password: process.env.GF_DB_PASSWORD || 'Guigui1309@',
  database: process.env.GF_DB_NAME || 'postgres',
  ssl: { rejectUnauthorized: false }
};

async function auditDatabase() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // Listar tabelas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    const tables = tablesResult.rows.map(r => r.table_name);

    // Listar views
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    const views = viewsResult.rows.map(r => r.table_name);

    // Listar RPCs
    const rpcsResult = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `);
    const rpcs = rpcsResult.rows.map(r => r.routine_name);

    console.log('=== TABELAS ===');
    tables.forEach(t => console.log(`  - ${t}`));

    console.log(`\n=== VIEWS (${views.length}) ===`);
    views.forEach(v => console.log(`  - ${v}`));

    console.log(`\n=== RPCs/FUNÇÕES (${rpcs.length}) ===`);
    rpcs.forEach(r => console.log(`  - ${r}`));

    // Verificar tabelas gf_
    const gfTables = tables.filter(t => t.startsWith('gf_'));
    console.log(`\n=== TABELAS gf_ (${gfTables.length}) ===`);
    gfTables.forEach(t => console.log(`  - ${t}`));

    // Verificar views esperadas
    const expectedViews = [
      'v_dashboard_kpis',
      'v_driver_last_position',
      'v_active_trips',
      'v_route_costs',
      'v_driver_last_status'
    ];
    console.log(`\n=== VIEWS ESPERADAS ===`);
    expectedViews.forEach(v => {
      const exists = views.includes(v);
      console.log(`  ${exists ? '✅' : '❌'} ${v}`);
    });

    // Verificar RPCs esperadas
    const expectedRpcs = [
      'rpc_generate_route_stops',
      'rpc_optimize_route_google',
      'rpc_validate_boarding',
      'gf_map_snapshot_full'
    ];
    console.log(`\n=== RPCs ESPERADAS ===`);
    expectedRpcs.forEach(r => {
      const exists = rpcs.includes(r);
      console.log(`  ${exists ? '✅' : '❌'} ${r}`);
    });

    // Tabelas esperadas gf_
    const expectedGfTables = [
      'gf_notifications',
      'gf_assistance_requests',
      'gf_gamification_scores',
      'gf_vehicle_costs',
      'gf_boarding_tokens',
      'gf_boarding_events',
      'gf_employee_company'
    ];
    console.log(`\n=== TABELAS gf_ ESPERADAS ===`);
    expectedGfTables.forEach(t => {
      const exists = tables.includes(t);
      console.log(`  ${exists ? '✅' : '❌'} ${t}`);
    });

    // JSON de auditoria
    const audit = {
      web: {
        stack: "next14",
        tem_12_abas: true,
        tem_mapa_google: true,
        usa_app_router: true
      },
      mobile: {
        stack: "flutter3.24",
        features: ["driver", "passenger", "operator", "admin"],
        tem_tracking_service: false // verificar depois
      },
      db: {
        schema: "v7.4",
        tabelas: tables,
        views: views,
        rpcs: rpcs,
        faltando: {
          views: expectedViews.filter(v => !views.includes(v)),
          rpcs: expectedRpcs.filter(r => !rpcs.includes(r)),
          tabelas_gf: expectedGfTables.filter(t => !tables.includes(t))
        }
      }
    };

    console.log(`\n=== JSON AUDITORIA ===`);
    console.log(JSON.stringify(audit, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

auditDatabase();

