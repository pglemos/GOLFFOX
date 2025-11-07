/**
 * Script para executar a migração v48 - Correção de RLS para vehicles
 * Uso: node run_v48_migration.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// URL de conexão do Supabase
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function runMigration() {
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

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', 'v48_fix_vehicles_rls.sql');
    console.log(`📄 Lendo arquivo: ${sqlPath}`);
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📝 Executando migração v48...');

    // Executar o SQL
    await client.query(sql);
    
    console.log('✅ Migração v48 executada com sucesso!');
    console.log('📋 Políticas RLS atualizadas para vehicles:');
    console.log('   - Admin: acesso total');
    console.log('   - Operator: gerenciar veículos da sua empresa');
    console.log('   - Carrier: gerenciar veículos do seu carrier');
    console.log('   - Driver: visualizar veículos atribuídos');
    console.log('   - Passenger: visualizar veículos das rotas ativas');

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada');
  }
}

runMigration();

