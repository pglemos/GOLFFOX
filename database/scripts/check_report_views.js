const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function checkReportViews() {
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

    // Verificar quais views existem
    console.log('\n📋 Verificando views de relatórios...');
    const viewsToCheck = [
      'v_reports_delays',
      'v_reports_occupancy',
      'v_reports_not_boarded',
      'v_reports_efficiency',
      'v_reports_driver_ranking'
    ];

    const viewStatus = {};
    for (const viewName of viewsToCheck) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.views 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists
      `, [viewName]);
      
      viewStatus[viewName] = result.rows[0].exists;
      console.log(`  ${viewStatus[viewName] ? '✅' : '❌'} ${viewName}: ${viewStatus[viewName] ? 'EXISTE' : 'NÃO EXISTE'}`);
    }

    // Verificar quantos registros existem em cada view
    console.log('\n📊 Verificando dados nas views...');
    for (const viewName of viewsToCheck) {
      if (viewStatus[viewName]) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${viewName}`);
          const count = parseInt(countResult.rows[0].count);
          console.log(`  ${viewName}: ${count} registros`);
          
          if (count === 0) {
            console.log(`  ⚠️  A view ${viewName} está vazia`);
          }
        } catch (error) {
          console.log(`  ❌ Erro ao contar registros em ${viewName}: ${error.message}`);
        }
      }
    }

    // Se alguma view não existe, executar script SQL
    const missingViews = viewsToCheck.filter(view => !viewStatus[view]);
    if (missingViews.length > 0) {
      console.log(`\n🔧 Criando views faltantes: ${missingViews.join(', ')}`);
      
      const sqlFile = path.join(__dirname, 'create_report_views_fixed.sql');
      const sql = fs.readFileSync(sqlFile, 'utf8');
      
      console.log('📝 Executando script SQL...');
      await client.query(sql);
      console.log('✅ Views criadas com sucesso!');
      
      // Verificar novamente
      console.log('\n📋 Verificando views após criação...');
      for (const viewName of viewsToCheck) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name = $1
          ) as exists
        `, [viewName]);
        
        const exists = result.rows[0].exists;
        console.log(`  ${exists ? '✅' : '❌'} ${viewName}: ${exists ? 'EXISTE' : 'NÃO EXISTE'}`);
      }
    } else {
      console.log('\n✅ Todas as views existem!');
    }

    // Verificar se há dados nas tabelas base
    console.log('\n📊 Verificando dados nas tabelas base...');
    const baseTables = ['trips', 'routes', 'trip_passengers', 'vehicles', 'users'];
    for (const tableName of baseTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = parseInt(result.rows[0].count);
        console.log(`  ${tableName}: ${count} registros`);
      } catch (error) {
        console.log(`  ⚠️  Tabela ${tableName} não encontrada ou erro ao contar: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao verificar views:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

checkReportViews();

