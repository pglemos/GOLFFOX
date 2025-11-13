require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const EXPECTED_TABLES = [
  'companies', 'users', 'routes', 'vehicles', 'trips', 'route_stops',
  'gf_employee_company', 'gf_incidents', 'gf_assistance_requests',
  'gf_costs', 'gf_route_optimization_cache', 'gf_user_company_map',
  'driver_positions', 'trip_passengers', 'gf_driver_documents',
  'gf_vehicle_maintenance', 'gf_vehicle_checklists', 'carriers'
];

async function analyzeTableStructure() {
  console.log('\n📊 ANALISANDO ESTRUTURA DAS TABELAS...\n');
  
  const issues = [];
  const tableInfo = {};
  
  for (const tableName of EXPECTED_TABLES) {
    try {
      // Tentar buscar uma linha para verificar se a tabela existe
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          issues.push({
            type: 'missing_table',
            table: tableName,
            issue: `Tabela ${tableName} não existe no banco de dados`
          });
          continue;
        } else {
          issues.push({
            type: 'table_error',
            table: tableName,
            issue: `Erro ao acessar tabela ${tableName}: ${error.message}`
          });
          continue;
        }
      }
      
      // Tabela existe, verificar estrutura básica
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      tableInfo[tableName] = {
        exists: true,
        recordCount: count || 0
      };
      
      // Verificar colunas esperadas baseado no schema
      if (data && data.length > 0) {
        const sampleRecord = data[0];
        const columns = Object.keys(sampleRecord);
        tableInfo[tableName].columns = columns;
        
        // Verificações específicas por tabela
        if (tableName === 'companies' && !columns.includes('updated_at')) {
          issues.push({
            type: 'missing_column',
            table: tableName,
            column: 'updated_at',
            issue: `Tabela ${tableName} não tem coluna updated_at`
          });
        }
        
        if (tableName === 'routes' && !columns.includes('is_active')) {
          issues.push({
            type: 'missing_column',
            table: tableName,
            column: 'is_active',
            issue: `Tabela ${tableName} não tem coluna is_active`
          });
        }
        
        if (tableName === 'users' && !columns.includes('is_active')) {
          issues.push({
            type: 'missing_column',
            table: tableName,
            column: 'is_active',
            issue: `Tabela ${tableName} não tem coluna is_active`
          });
        }
      }
      
    } catch (err) {
      issues.push({
        type: 'table_error',
        table: tableName,
        issue: `Erro ao analisar tabela ${tableName}: ${err.message}`
      });
    }
  }
  
  return { issues, tableInfo };
}

async function analyzeForeignKeys() {
  console.log('\n🔗 ANALISANDO FOREIGN KEYS...\n');
  
  const issues = [];
  
  // Verificar trips.vehicle_id
  const { data: tripsWithVehicle } = await supabase
    .from('trips')
    .select('id, vehicle_id')
    .not('vehicle_id', 'is', null)
    .limit(100);
  
  if (tripsWithVehicle) {
    for (const trip of tripsWithVehicle) {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', trip.vehicle_id)
        .single();
      
      if (!vehicle) {
        issues.push({
          type: 'broken_foreign_key',
          table: 'trips',
          field: 'vehicle_id',
          value: trip.vehicle_id,
          issue: `Trip ${trip.id} referencia vehicle_id ${trip.vehicle_id} que não existe`
        });
      }
    }
  }
  
  // Verificar trips.driver_id
  const { data: tripsWithDriver } = await supabase
    .from('trips')
    .select('id, driver_id')
    .not('driver_id', 'is', null)
    .limit(100);
  
  if (tripsWithDriver) {
    for (const trip of tripsWithDriver) {
      const { data: driver } = await supabase
        .from('users')
        .select('id')
        .eq('id', trip.driver_id)
        .single();
      
      if (!driver) {
        issues.push({
          type: 'broken_foreign_key',
          table: 'trips',
          field: 'driver_id',
          value: trip.driver_id,
          issue: `Trip ${trip.id} referencia driver_id ${trip.driver_id} que não existe`
        });
      }
    }
  }
  
  // Verificar trips.route_id
  const { data: allTrips } = await supabase
    .from('trips')
    .select('id, route_id')
    .limit(100);
  
  if (allTrips) {
    for (const trip of allTrips) {
      const { data: route } = await supabase
        .from('routes')
        .select('id')
        .eq('id', trip.route_id)
        .single();
      
      if (!route) {
        issues.push({
          type: 'broken_foreign_key',
          table: 'trips',
          field: 'route_id',
          value: trip.route_id,
          issue: `Trip ${trip.id} referencia route_id ${trip.route_id} que não existe`
        });
      }
    }
  }
  
  // Verificar route_stops.route_id
  const { data: allRouteStops } = await supabase
    .from('route_stops')
    .select('id, route_id')
    .limit(100);
  
  if (allRouteStops) {
    for (const stop of allRouteStops) {
      const { data: route } = await supabase
        .from('routes')
        .select('id')
        .eq('id', stop.route_id)
        .single();
      
      if (!route) {
        issues.push({
          type: 'broken_foreign_key',
          table: 'route_stops',
          field: 'route_id',
          value: stop.route_id,
          issue: `Route stop ${stop.id} referencia route_id ${stop.route_id} que não existe`
        });
      }
    }
  }
  
  // Verificar users.company_id
  const { data: usersWithCompany } = await supabase
    .from('users')
    .select('id, company_id')
    .not('company_id', 'is', null)
    .limit(100);
  
  if (usersWithCompany) {
    for (const user of usersWithCompany) {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('id', user.company_id)
        .single();
      
      if (!company) {
        issues.push({
          type: 'broken_foreign_key',
          table: 'users',
          field: 'company_id',
          value: user.company_id,
          issue: `User ${user.id} referencia company_id ${user.company_id} que não existe`
        });
      }
    }
  }
  
  // Verificar routes.company_id
  const { data: routesWithCompany } = await supabase
    .from('routes')
    .select('id, company_id')
    .not('company_id', 'is', null)
    .limit(100);
  
  if (routesWithCompany) {
    for (const route of routesWithCompany) {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('id', route.company_id)
        .single();
      
      if (!company) {
        issues.push({
          type: 'broken_foreign_key',
          table: 'routes',
          field: 'company_id',
          value: route.company_id,
          issue: `Route ${route.id} referencia company_id ${route.company_id} que não existe`
        });
      }
    }
  }
  
  return issues;
}

async function analyzeDataIntegrity() {
  console.log('\n🔍 ANALISANDO INTEGRIDADE DOS DADOS...\n');
  
  const issues = [];
  
  // Verificar duplicatas de email em users
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, email');
  
  if (allUsers) {
    const emailCounts = {};
    allUsers.forEach(u => {
      if (u.email) {
        if (!emailCounts[u.email]) emailCounts[u.email] = [];
        emailCounts[u.email].push(u.id);
      }
    });
    
    Object.entries(emailCounts).forEach(([email, ids]) => {
      if (ids.length > 1) {
        issues.push({
          type: 'duplicate',
          table: 'users',
          field: 'email',
          value: email,
          count: ids.length,
          issue: `Email ${email} duplicado (${ids.length} vezes): ${ids.join(', ')}`
        });
      }
    });
  }
  
  // Verificar duplicatas de placa em vehicles
  const { data: allVehicles } = await supabase
    .from('vehicles')
    .select('id, plate');
  
  if (allVehicles) {
    const plateCounts = {};
    allVehicles.forEach(v => {
      if (v.plate) {
        if (!plateCounts[v.plate]) plateCounts[v.plate] = [];
        plateCounts[v.plate].push(v.id);
      }
    });
    
    Object.entries(plateCounts).forEach(([plate, ids]) => {
      if (ids.length > 1) {
        issues.push({
          type: 'duplicate',
          table: 'vehicles',
          field: 'plate',
          value: plate,
          count: ids.length,
          issue: `Placa ${plate} duplicada (${ids.length} vezes): ${ids.join(', ')}`
        });
      }
    });
  }
  
  // Verificar duplicatas de nome em companies
  const { data: allCompanies } = await supabase
    .from('companies')
    .select('id, name');
  
  if (allCompanies) {
    const nameCounts = {};
    allCompanies.forEach(c => {
      if (c.name) {
        if (!nameCounts[c.name]) nameCounts[c.name] = [];
        nameCounts[c.name].push(c.id);
      }
    });
    
    Object.entries(nameCounts).forEach(([name, ids]) => {
      if (ids.length > 1) {
        issues.push({
          type: 'duplicate',
          table: 'companies',
          field: 'name',
          value: name,
          count: ids.length,
          issue: `Empresa "${name}" duplicada (${ids.length} vezes): ${ids.join(', ')}`
        });
      }
    });
  }
  
  // Verificar dados inválidos em trips.status
  const { data: trips } = await supabase
    .from('trips')
    .select('id, status');
  
  if (trips) {
    const validStatuses = ['scheduled', 'inProgress', 'completed', 'cancelled'];
    trips.forEach(trip => {
      if (trip.status && !validStatuses.includes(trip.status)) {
        issues.push({
          type: 'invalid_data',
          table: 'trips',
          field: 'status',
          value: trip.status,
          issue: `Trip ${trip.id} tem status inválido: ${trip.status}`
        });
      }
    });
  }
  
  // Verificar dados inválidos em users.role
  const { data: users } = await supabase
    .from('users')
    .select('id, role');
  
  if (users) {
    const validRoles = ['admin', 'operator', 'carrier', 'driver', 'passenger'];
    users.forEach(user => {
      if (user.role && !validRoles.includes(user.role)) {
        issues.push({
          type: 'invalid_data',
          table: 'users',
          field: 'role',
          value: user.role,
          issue: `User ${user.id} tem role inválido: ${user.role}`
        });
      }
    });
  }
  
  // Verificar NULL constraints
  const { data: routesWithoutCompany } = await supabase
    .from('routes')
    .select('id, company_id')
    .is('company_id', null);
  
  if (routesWithoutCompany && routesWithoutCompany.length > 0) {
    issues.push({
      type: 'null_constraint',
      table: 'routes',
      field: 'company_id',
      count: routesWithoutCompany.length,
      issue: `${routesWithoutCompany.length} rotas sem company_id`
    });
  }
  
  const { data: tripsWithoutRoute } = await supabase
    .from('trips')
    .select('id, route_id')
    .is('route_id', null);
  
  if (tripsWithoutRoute && tripsWithoutRoute.length > 0) {
    issues.push({
      type: 'null_constraint',
      table: 'trips',
      field: 'route_id',
      count: tripsWithoutRoute.length,
      issue: `${tripsWithoutRoute.length} trips sem route_id`
    });
  }
  
  return issues;
}

async function analyzeRLS() {
  console.log('\n🔒 ANALISANDO RLS POLICIES...\n');
  
  const issues = [];
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!anonKey) {
    console.log('  ⚠️ ANON_KEY não configurada, pulando testes de RLS');
    return issues;
  }
  
  const anonSupabase = createClient(supabaseUrl, anonKey);
  
  // Testar acesso a routes com anon key
  const { data: routesAnon, error: routesError } = await anonSupabase
    .from('routes')
    .select('id')
    .limit(1);
  
  if (routesError && routesError.code === '42501') {
    issues.push({
      type: 'rls',
      table: 'routes',
      issue: 'RLS pode estar bloqueando acesso - verificar policies'
    });
  }
  
  // Testar acesso a vehicles com anon key
  const { data: vehiclesAnon, error: vehiclesError } = await anonSupabase
    .from('vehicles')
    .select('id')
    .limit(1);
  
  if (vehiclesError && vehiclesError.code === '42501') {
    issues.push({
      type: 'rls',
      table: 'vehicles',
      issue: 'RLS pode estar bloqueando acesso - verificar policies'
    });
  }
  
  return issues;
}

async function main() {
  console.log('🔍 ANÁLISE COMPLETA DO SUPABASE');
  console.log('================================\n');
  
  const allIssues = [];
  
  // Análise de estrutura
  const { issues: structureIssues, tableInfo } = await analyzeTableStructure();
  allIssues.push(...structureIssues);
  
  // Análise de foreign keys
  const fkIssues = await analyzeForeignKeys();
  allIssues.push(...fkIssues);
  
  // Análise de integridade
  const integrityIssues = await analyzeDataIntegrity();
  allIssues.push(...integrityIssues);
  
  // Análise de RLS
  const rlsIssues = await analyzeRLS();
  allIssues.push(...rlsIssues);
  
  // Agrupar issues por tipo
  const groupedIssues = {};
  allIssues.forEach(issue => {
    if (!groupedIssues[issue.type]) {
      groupedIssues[issue.type] = [];
    }
    groupedIssues[issue.type].push(issue);
  });
  
  // Resumo
  console.log('\n================================');
  console.log('📋 RESUMO DE PROBLEMAS:');
  console.log('================================\n');
  
  if (allIssues.length === 0) {
    console.log('✅ Nenhum problema encontrado!');
  } else {
    Object.entries(groupedIssues).forEach(([type, issues]) => {
      console.log(`\n[${type.toUpperCase()}] (${issues.length} problema(s)):`);
      issues.slice(0, 10).forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.issue}`);
      });
      if (issues.length > 10) {
        console.log(`  ... e mais ${issues.length - 10} problema(s)`);
      }
    });
  }
  
  console.log('\n================================\n');
  
  // Salvar resultados
  const fs = require('fs');
  const path = require('path');
  const reportFile = path.join(__dirname, '../SUPABASE_ANALYSIS_REPORT.json');
  
  fs.writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    tableInfo,
    issues: allIssues,
    summary: {
      totalIssues: allIssues.length,
      byType: Object.entries(groupedIssues).reduce((acc, [type, issues]) => {
        acc[type] = issues.length;
        return acc;
      }, {})
    }
  }, null, 2));
  
  console.log(`📄 Relatório salvo em: ${reportFile}\n`);
  
  return { issues: allIssues, tableInfo };
}

main().then(({ issues }) => {
  if (issues.length > 0) {
    console.log(`⚠️ ${issues.length} problema(s) encontrado(s).`);
    process.exit(1);
  } else {
    console.log('✅ Análise concluída sem problemas!');
    process.exit(0);
  }
}).catch(err => {
  console.error('❌ Erro durante análise:', err);
  process.exit(1);
});

