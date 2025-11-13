require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixMissingColumns() {
  console.log('\n🔧 CORRIGINDO COLUNAS FALTANTES...\n');
  
  const fixes = [];
  
  // Verificar e adicionar is_active em routes
  const { data: routesSample } = await supabase
    .from('routes')
    .select('*')
    .limit(1);
  
  if (routesSample && routesSample.length > 0 && routesSample[0].is_active === undefined) {
    console.log('  ⚠️ Tabela routes não tem coluna is_active');
    console.log('  💡 Nota: Esta coluna será adicionada via migração SQL');
    fixes.push({
      table: 'routes',
      column: 'is_active',
      action: 'add_column',
      sql: `ALTER TABLE routes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`
    });
  }
  
  // Verificar e adicionar is_active em users
  const { data: usersSample } = await supabase
    .from('users')
    .select('*')
    .limit(1);
  
  if (usersSample && usersSample.length > 0 && usersSample[0].is_active === undefined) {
    console.log('  ⚠️ Tabela users não tem coluna is_active');
    console.log('  💡 Nota: Esta coluna será adicionada via migração SQL');
    fixes.push({
      table: 'users',
      column: 'is_active',
      action: 'add_column',
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`
    });
  }
  
  return fixes;
}

async function fixDuplicateCompanies() {
  console.log('\n🔧 CORRIGINDO EMPRESAS DUPLICADAS...\n');
  
  const fixes = [];
  
  // Buscar todas as empresas
  const { data: allCompanies, error } = await supabase
    .from('companies')
    .select('id, name, created_at')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('  ❌ Erro ao buscar empresas:', error.message);
    return fixes;
  }
  
  // Agrupar por nome
  const companiesByName = {};
  allCompanies.forEach(company => {
    if (company.name) {
      if (!companiesByName[company.name]) {
        companiesByName[company.name] = [];
      }
      companiesByName[company.name].push(company);
    }
  });
  
  // Processar duplicatas
  for (const [name, companies] of Object.entries(companiesByName)) {
    if (companies.length > 1) {
      console.log(`  🔍 Encontradas ${companies.length} empresas com nome "${name}"`);
      
      // Manter a mais antiga (primeira criada)
      const keepCompany = companies[0];
      const duplicateIds = companies.slice(1).map(c => c.id);
      
      console.log(`  ✅ Mantendo empresa: ${keepCompany.id} (criada em ${keepCompany.created_at})`);
      console.log(`  🗑️ Empresas duplicadas a serem mescladas: ${duplicateIds.join(', ')}`);
      
      // Para cada duplicata, atualizar referências e depois excluir
      for (const duplicateId of duplicateIds) {
        // Atualizar routes
        const { count: routesCount } = await supabase
          .from('routes')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', duplicateId);
        
        if (routesCount > 0) {
          const { error: routesError } = await supabase
            .from('routes')
            .update({ company_id: keepCompany.id })
            .eq('company_id', duplicateId);
          
          if (routesError) {
            console.error(`    ❌ Erro ao atualizar routes: ${routesError.message}`);
          } else {
            console.log(`    ✅ ${routesCount} rota(s) atualizada(s)`);
            fixes.push({
              type: 'update_references',
              table: 'routes',
              from: duplicateId,
              to: keepCompany.id,
              count: routesCount
            });
          }
        }
        
        // Atualizar users
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', duplicateId);
        
        if (usersCount > 0) {
          const { error: usersError } = await supabase
            .from('users')
            .update({ company_id: keepCompany.id })
            .eq('company_id', duplicateId);
          
          if (usersError) {
            console.error(`    ❌ Erro ao atualizar users: ${usersError.message}`);
          } else {
            console.log(`    ✅ ${usersCount} usuário(s) atualizado(s)`);
            fixes.push({
              type: 'update_references',
              table: 'users',
              from: duplicateId,
              to: keepCompany.id,
              count: usersCount
            });
          }
        }
        
        // Atualizar gf_employee_company
        const { count: employeesCount } = await supabase
          .from('gf_employee_company')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', duplicateId);
        
        if (employeesCount > 0) {
          const { error: employeesError } = await supabase
            .from('gf_employee_company')
            .update({ company_id: keepCompany.id })
            .eq('company_id', duplicateId);
          
          if (employeesError) {
            console.error(`    ❌ Erro ao atualizar gf_employee_company: ${employeesError.message}`);
          } else {
            console.log(`    ✅ ${employeesCount} funcionário(s) atualizado(s)`);
            fixes.push({
              type: 'update_references',
              table: 'gf_employee_company',
              from: duplicateId,
              to: keepCompany.id,
              count: employeesCount
            });
          }
        }
        
        // Excluir empresa duplicada
        const { error: deleteError } = await supabase
          .from('companies')
          .delete()
          .eq('id', duplicateId);
        
        if (deleteError) {
          console.error(`    ❌ Erro ao excluir empresa duplicada: ${deleteError.message}`);
        } else {
          console.log(`    ✅ Empresa duplicada ${duplicateId} excluída`);
          fixes.push({
            type: 'delete_duplicate',
            table: 'companies',
            id: duplicateId
          });
        }
      }
    }
  }
  
  return fixes;
}

async function generateSQLMigrations() {
  console.log('\n📝 GERANDO MIGRAÇÕES SQL...\n');
  
  const sqlMigrations = [];
  
  // Migração para adicionar is_active em routes
  sqlMigrations.push({
    name: 'add_is_active_to_routes',
    sql: `
-- Adicionar coluna is_active em routes
ALTER TABLE routes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Atualizar registros existentes
UPDATE routes SET is_active = true WHERE is_active IS NULL;
    `.trim()
  });
  
  // Migração para adicionar is_active em users
  sqlMigrations.push({
    name: 'add_is_active_to_users',
    sql: `
-- Adicionar coluna is_active em users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Atualizar registros existentes
UPDATE users SET is_active = true WHERE is_active IS NULL;
    `.trim()
  });
  
  return sqlMigrations;
}

async function main() {
  console.log('🔧 CORREÇÃO DE PROBLEMAS DO SUPABASE');
  console.log('===================================\n');
  
  const allFixes = [];
  
  // Corrigir colunas faltantes
  const columnFixes = await fixMissingColumns();
  allFixes.push(...columnFixes);
  
  // Corrigir empresas duplicadas
  const duplicateFixes = await fixDuplicateCompanies();
  allFixes.push(...duplicateFixes);
  
  // Gerar migrações SQL
  const sqlMigrations = await generateSQLMigrations();
  
  console.log('\n===================================');
  console.log('📋 RESUMO DAS CORREÇÕES:');
  console.log('===================================\n');
  
  if (allFixes.length === 0 && sqlMigrations.length === 0) {
    console.log('✅ Nenhuma correção necessária!');
  } else {
    console.log(`✅ ${allFixes.length} correção(ões) aplicada(s)\n`);
    console.log(`📝 ${sqlMigrations.length} migração(ões) SQL gerada(s)\n`);
    
    if (sqlMigrations.length > 0) {
      console.log('📄 MIGRAÇÕES SQL PARA APLICAR:\n');
      sqlMigrations.forEach((migration, index) => {
        console.log(`-- Migração ${index + 1}: ${migration.name}`);
        console.log(migration.sql);
        console.log('\n');
      });
    }
  }
  
  console.log('===================================\n');
  
  return { fixes: allFixes, migrations: sqlMigrations };
}

main().then(({ fixes, migrations }) => {
  if (fixes.length > 0 || migrations.length > 0) {
    console.log('✅ Correções aplicadas e migrações geradas!');
    
    // Salvar migrações em arquivo
    if (migrations.length > 0) {
      const fs = require('fs');
      const path = require('path');
      const migrationFile = path.join(__dirname, '../database/migrations/fix_supabase_issues.sql');
      
      let migrationContent = `-- =====================================================
-- Fix: Correções de problemas encontrados no Supabase
-- Data: ${new Date().toISOString()}
-- =====================================================\n\n`;
      
      migrations.forEach(migration => {
        migrationContent += `-- ${migration.name}\n${migration.sql}\n\n`;
      });
      
      fs.writeFileSync(migrationFile, migrationContent);
      console.log(`\n📄 Migrações salvas em: ${migrationFile}`);
    }
    
    process.exit(0);
  } else {
    console.log('✅ Nenhuma correção necessária!');
    process.exit(0);
  }
}).catch(err => {
  console.error('❌ Erro durante correção:', err);
  process.exit(1);
});

