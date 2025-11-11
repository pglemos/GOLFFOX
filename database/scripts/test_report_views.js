const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function testReportViews() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    const viewsToTest = [
      'v_reports_delays',
      'v_reports_occupancy',
      'v_reports_not_boarded',
      'v_reports_efficiency',
      'v_reports_driver_ranking'
    ];

    console.log('\n📊 Testando views...');
    for (const viewName of viewsToTest) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${viewName}`);
        const count = parseInt(result.rows[0].count);
        console.log(`  ${viewName}: ${count} registros`);
        
        // Se há dados, mostrar alguns exemplos
        if (count > 0) {
          const sampleResult = await client.query(`SELECT * FROM ${viewName} LIMIT 3`);
          console.log(`    Exemplo de dados:`);
          sampleResult.rows.forEach((row, idx) => {
            console.log(`      ${idx + 1}. ${JSON.stringify(row).substring(0, 100)}...`);
          });
        } else {
          console.log(`    ⚠️  View vazia (sem dados de teste)`);
        }
      } catch (error) {
        console.log(`  ❌ Erro ao testar ${viewName}: ${error.message}`);
      }
    }

    // Verificar colunas esperadas pelo endpoint
    console.log('\n📋 Verificando colunas esperadas...');
    const expectedColumns = {
      'v_reports_delays': ['company_id', 'route_id', 'route_name', 'driver_id', 'driver_name', 'trip_date', 'scheduled_time', 'actual_time', 'delay_minutes', 'status'],
      'v_reports_occupancy': ['company_id', 'route_id', 'route_name', 'trip_date', 'time_slot', 'total_passengers', 'capacity', 'occupancy_rate'],
      'v_reports_not_boarded': ['company_id', 'route_id', 'route_name', 'passenger_id', 'passenger_name', 'trip_date', 'scheduled_time', 'reason'],
      'v_reports_efficiency': ['company_id', 'route_id', 'route_name', 'period_start', 'period_end', 'total_trips', 'completed_trips', 'efficiency_rate', 'avg_delay'],
      'v_reports_driver_ranking': ['company_id', 'driver_id', 'driver_name', 'routes_completed', 'punctuality_score', 'efficiency_score', 'total_score', 'ranking']
    };

    for (const [viewName, expectedCols] of Object.entries(expectedColumns)) {
      try {
        const result = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position
        `, [viewName]);
        
        const actualCols = result.rows.map(r => r.column_name);
        const missingCols = expectedCols.filter(col => !actualCols.includes(col));
        const extraCols = actualCols.filter(col => !expectedCols.includes(col));
        
        if (missingCols.length === 0 && extraCols.length === 0) {
          console.log(`  ✅ ${viewName}: Todas as colunas esperadas estão presentes`);
        } else {
          if (missingCols.length > 0) {
            console.log(`  ⚠️  ${viewName}: Colunas faltantes: ${missingCols.join(', ')}`);
          }
          if (extraCols.length > 0) {
            console.log(`  ℹ️  ${viewName}: Colunas extras: ${extraCols.join(', ')}`);
          }
        }
      } catch (error) {
        console.log(`  ❌ Erro ao verificar colunas de ${viewName}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

testReportViews();

