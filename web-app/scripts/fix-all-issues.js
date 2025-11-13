require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
  
  // Verificar e adicionar updated_at em companies se não existir
  try {
    const { data: companies } = await supabase
      .from('companies')
      .select('updated_at')
      .limit(1);
    
    if (companies && companies.length > 0 && companies[0].updated_at === undefined) {
      fixes.push({
        type: 'add_column',
        table: 'companies',
        column: 'updated_at',
        sql: 'ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();'
      });
    }
  } catch (err) {
    // Coluna pode não existir
    fixes.push({
      type: 'add_column',
      table: 'companies',
      column: 'updated_at',
      sql: 'ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();'
    });
  }
  
  return fixes;
}

async function fixOrphanedRecords() {
  console.log('\n🔧 CORRIGINDO REGISTROS ÓRFÃOS...\n');
  
  const fixes = [];
  
  // Verificar trips com vehicle_id inválido
  const { data: tripsWithInvalidVehicle } = await supabase
    .from('trips')
    .select('id, vehicle_id')
    .not('vehicle_id', 'is', null)
    .limit(100);
  
  if (tripsWithInvalidVehicle) {
    for (const trip of tripsWithInvalidVehicle) {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', trip.vehicle_id)
        .single();
      
      if (!vehicle) {
        fixes.push({
          type: 'fix_orphan',
          table: 'trips',
          id: trip.id,
          field: 'vehicle_id',
          action: 'set_null',
          sql: `UPDATE public.trips SET vehicle_id = NULL WHERE id = '${trip.id}';`
        });
      }
    }
  }
  
  // Verificar trips com driver_id inválido
  const { data: tripsWithInvalidDriver } = await supabase
    .from('trips')
    .select('id, driver_id')
    .not('driver_id', 'is', null)
    .limit(100);
  
  if (tripsWithInvalidDriver) {
    for (const trip of tripsWithInvalidDriver) {
      const { data: driver } = await supabase
        .from('users')
        .select('id')
        .eq('id', trip.driver_id)
        .single();
      
      if (!driver) {
        fixes.push({
          type: 'fix_orphan',
          table: 'trips',
          id: trip.id,
          field: 'driver_id',
          action: 'set_null',
          sql: `UPDATE public.trips SET driver_id = NULL WHERE id = '${trip.id}';`
        });
      }
    }
  }
  
  return fixes;
}

async function main() {
  console.log('🔧 CORREÇÃO AUTOMÁTICA DE PROBLEMAS');
  console.log('================================\n');
  
  const allFixes = [];
  
  // Correções de colunas
  const columnFixes = await fixMissingColumns();
  allFixes.push(...columnFixes);
  
  // Correções de registros órfãos
  const orphanFixes = await fixOrphanedRecords();
  allFixes.push(...orphanFixes);
  
  // Resumo
  console.log('\n================================');
  console.log('📋 RESUMO DE CORREÇÕES:');
  console.log('================================\n');
  
  if (allFixes.length === 0) {
    console.log('✅ Nenhuma correção necessária!');
  } else {
    const groupedFixes = {};
    allFixes.forEach(fix => {
      if (!groupedFixes[fix.type]) {
        groupedFixes[fix.type] = [];
      }
      groupedFixes[fix.type].push(fix);
    });
    
    Object.entries(groupedFixes).forEach(([type, fixes]) => {
      console.log(`\n[${type.toUpperCase()}] (${fixes.length} correção(ões)):`);
      fixes.slice(0, 10).forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix.table}.${fix.column || fix.field || 'N/A'}`);
      });
      if (fixes.length > 10) {
        console.log(`  ... e mais ${fixes.length - 10} correção(ões)`);
      }
    });
    
    // Salvar SQL de correção
    const sqlFile = path.join(__dirname, '../FIXES_APPLY.sql');
    const sqlContent = allFixes.map(fix => fix.sql).filter(Boolean).join('\n\n');
    
    if (sqlContent) {
      fs.writeFileSync(sqlFile, `-- Correções automáticas geradas em ${new Date().toISOString()}\n\n${sqlContent}\n`);
      console.log(`\n📄 SQL de correção salvo em: ${sqlFile}`);
      console.log('⚠️  Execute este SQL manualmente no Supabase SQL Editor');
    }
  }
  
  console.log('\n================================\n');
  
  return { fixes: allFixes };
}

main().then(({ fixes }) => {
  if (fixes.length > 0) {
    console.log(`⚠️ ${fixes.length} correção(ões) identificada(s).`);
    console.log('Execute o SQL gerado no Supabase SQL Editor.');
    process.exit(0);
  } else {
    console.log('✅ Nenhuma correção necessária!');
    process.exit(0);
  }
}).catch(err => {
  console.error('❌ Erro durante correção:', err);
  process.exit(1);
});

