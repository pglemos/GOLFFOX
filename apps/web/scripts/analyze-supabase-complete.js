require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      return { exists: false, error: 'Tabela não existe' };
    }
    return { exists: true, error: null };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function checkForeignKeys() {
  console.log('\n🔍 VERIFICANDO FOREIGN KEYS E CONSTRAINTS...\n');
  
  const issues = [];
  
  // Verificar trips com vehicle_id inválido
  const { data: tripsWithInvalidVehicle, error: e1 } = await supabase
    .from('trips')
    .select('id, vehicle_id')
    .not('vehicle_id', 'is', null);
  
  if (tripsWithInvalidVehicle && tripsWithInvalidVehicle.length > 0) {
    for (const trip of tripsWithInvalidVehicle) {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', trip.vehicle_id)
        .single();
      
      if (!vehicle) {
        issues.push({
          type: 'foreign_key',
          table: 'trips',
          field: 'vehicle_id',
          value: trip.vehicle_id,
          issue: `Trip ${trip.id} referencia vehicle_id ${trip.vehicle_id} que não existe`
        });
      }
    }
  }
  
  // Verificar trips com driver_id inválido
  const { data: tripsWithInvalidDriver, error: e2 } = await supabase
    .from('trips')
    .select('id, driver_id')
    .not('driver_id', 'is', null);
  
  if (tripsWithInvalidDriver && tripsWithInvalidDriver.length > 0) {
    for (const trip of tripsWithInvalidDriver) {
      const { data: driver } = await supabase
        .from('users')
        .select('id')
        .eq('id', trip.driver_id)
        .single();
      
      if (!driver) {
        issues.push({
          type: 'foreign_key',
          table: 'trips',
          field: 'driver_id',
          value: trip.driver_id,
          issue: `Trip ${trip.id} referencia driver_id ${trip.driver_id} que não existe`
        });
      }
    }
  }
  
  // Verificar trips com route_id inválido
  const { data: tripsWithInvalidRoute, error: e3 } = await supabase
    .from('trips')
    .select('id, route_id');
  
  if (tripsWithInvalidRoute && tripsWithInvalidRoute.length > 0) {
    for (const trip of tripsWithInvalidRoute) {
      const { data: route } = await supabase
        .from('routes')
        .select('id')
        .eq('id', trip.route_id)
        .single();
      
      if (!route) {
        issues.push({
          type: 'foreign_key',
          table: 'trips',
          field: 'route_id',
          value: trip.route_id,
          issue: `Trip ${trip.id} referencia route_id ${trip.route_id} que não existe`
        });
      }
    }
  }
  
  // Verificar route_stops com route_id inválido
  const { data: routeStops, error: e4 } = await supabase
    .from('route_stops')
    .select('id, route_id');
  
  if (routeStops && routeStops.length > 0) {
    for (const stop of routeStops) {
      const { data: route } = await supabase
        .from('routes')
        .select('id')
        .eq('id', stop.route_id)
        .single();
      
      if (!route) {
        issues.push({
          type: 'foreign_key',
          table: 'route_stops',
          field: 'route_id',
          value: stop.route_id,
          issue: `Route stop ${stop.id} referencia route_id ${stop.route_id} que não existe`
        });
      }
    }
  }
  
  // Verificar users com company_id inválido
  const { data: usersWithCompany, error: e5 } = await supabase
    .from('users')
    .select('id, company_id')
    .not('company_id', 'is', null);
  
  if (usersWithCompany && usersWithCompany.length > 0) {
    for (const user of usersWithCompany) {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('id', user.company_id)
        .single();
      
      if (!company) {
        issues.push({
          type: 'foreign_key',
          table: 'users',
          field: 'company_id',
          value: user.company_id,
          issue: `User ${user.id} referencia company_id ${user.company_id} que não existe`
        });
      }
    }
  }
  
  return issues;
}

async function checkDataIntegrity() {
  console.log('\n🔍 VERIFICANDO INTEGRIDADE DOS DADOS...\n');
  
  const issues = [];
  
  // Verificar veículos duplicados (mesma placa)
  const { data: vehicles, error: e1 } = await supabase
    .from('vehicles')
    .select('id, plate');
  
  if (vehicles) {
    const plateCounts = {};
    vehicles.forEach(v => {
      if (v.plate) {
        plateCounts[v.plate] = (plateCounts[v.plate] || 0) + 1;
      }
    });
    
    Object.entries(plateCounts).forEach(([plate, count]) => {
      if (count > 1) {
        issues.push({
          type: 'duplicate',
          table: 'vehicles',
          field: 'plate',
          value: plate,
          issue: `Placa ${plate} duplicada (${count} vezes)`
        });
      }
    });
  }
  
  // Verificar empresas sem nome
  const { data: companiesWithoutName, error: e2 } = await supabase
    .from('companies')
    .select('id, name')
    .or('name.is.null,name.eq.');
  
  if (companiesWithoutName && companiesWithoutName.length > 0) {
    issues.push({
      type: 'missing_data',
      table: 'companies',
      field: 'name',
      count: companiesWithoutName.length,
      issue: `${companiesWithoutName.length} empresas sem nome`
    });
  }
  
  // Verificar rotas sem nome
  const { data: routesWithoutName, error: e3 } = await supabase
    .from('routes')
    .select('id, name')
    .or('name.is.null,name.eq.');
  
  if (routesWithoutName && routesWithoutName.length > 0) {
    issues.push({
      type: 'missing_data',
      table: 'routes',
      field: 'name',
      count: routesWithoutName.length,
      issue: `${routesWithoutName.length} rotas sem nome`
    });
  }
  
  // Verificar users sem email
  const { data: usersWithoutEmail, error: e4 } = await supabase
    .from('users')
    .select('id, email')
    .or('email.is.null,email.eq.');
  
  if (usersWithoutEmail && usersWithoutEmail.length > 0) {
    issues.push({
      type: 'missing_data',
      table: 'users',
      field: 'email',
      count: usersWithoutEmail.length,
      issue: `${usersWithoutEmail.length} usuários sem email`
    });
  }
  
  return issues;
}

async function checkOrphanedRecords() {
  console.log('\n🔍 VERIFICANDO REGISTROS ÓRFÃOS...\n');
  
  const issues = [];
  
  // Verificar route_stops órfãos
  const { data: allRouteStops, error: e1 } = await supabase
    .from('route_stops')
    .select('id, route_id');
  
  if (allRouteStops && allRouteStops.length > 0) {
    const routeIds = [...new Set(allRouteStops.map(s => s.route_id))];
    for (const routeId of routeIds) {
      const { data: route } = await supabase
        .from('routes')
        .select('id')
        .eq('id', routeId)
        .single();
      
      if (!route) {
        const orphanedStops = allRouteStops.filter(s => s.route_id === routeId);
        issues.push({
          type: 'orphaned',
          table: 'route_stops',
          count: orphanedStops.length,
          issue: `${orphanedStops.length} route_stops órfãos (route_id ${routeId} não existe)`
        });
      }
    }
  }
  
  // Verificar trips órfãos
  const { data: allTrips, error: e2 } = await supabase
    .from('trips')
    .select('id, route_id');
  
  if (allTrips && allTrips.length > 0) {
    const routeIds = [...new Set(allTrips.map(t => t.route_id))];
    for (const routeId of routeIds) {
      const { data: route } = await supabase
        .from('routes')
        .select('id')
        .eq('id', routeId)
        .single();
      
      if (!route) {
        const orphanedTrips = allTrips.filter(t => t.route_id === routeId);
        issues.push({
          type: 'orphaned',
          table: 'trips',
          count: orphanedTrips.length,
          issue: `${orphanedTrips.length} trips órfãos (route_id ${routeId} não existe)`
        });
      }
    }
  }
  
  return issues;
}

async function getTableStats() {
  console.log('\n📊 ESTATÍSTICAS DAS TABELAS...\n');
  
  const tables = [
    'companies', 'users', 'routes', 'vehicles', 'trips', 
    'route_stops', 'gf_employee_company', 'gf_incidents',
    'gf_assistance_requests', 'gf_costs'
  ];
  
  const stats = {};
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      stats[table] = count || 0;
      console.log(`  ${table}: ${count || 0} registros`);
    } else if (error.code !== 'PGRST116') {
      console.log(`  ${table}: Erro - ${error.message}`);
    }
  }
  
  return stats;
}

async function main() {
  console.log('🔍 ANÁLISE COMPLETA DO SUPABASE');
  console.log('================================\n');
  
  // Estatísticas
  await getTableStats();
  
  // Verificar Foreign Keys
  const fkIssues = await checkForeignKeys();
  
  // Verificar Integridade
  const integrityIssues = await checkDataIntegrity();
  
  // Verificar Órfãos
  const orphanedIssues = await checkOrphanedRecords();
  
  // Consolidar todos os problemas
  const allIssues = [...fkIssues, ...integrityIssues, ...orphanedIssues];
  
  console.log('\n================================');
  console.log('📋 RESUMO DE PROBLEMAS ENCONTRADOS:');
  console.log('================================\n');
  
  if (allIssues.length === 0) {
    console.log('✅ Nenhum problema encontrado!');
  } else {
    console.log(`❌ ${allIssues.length} problema(s) encontrado(s):\n`);
    
    allIssues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.type.toUpperCase()}] ${issue.issue}`);
      if (issue.table) console.log(`   Tabela: ${issue.table}`);
      if (issue.field) console.log(`   Campo: ${issue.field}`);
      if (issue.value) console.log(`   Valor: ${issue.value}`);
      console.log('');
    });
  }
  
  console.log('================================\n');
  
  // Retornar issues para correção
  return allIssues;
}

main().then(issues => {
  if (issues.length > 0) {
    console.log('⚠️ Problemas encontrados. Gerando script de correção...');
    process.exit(1); // Indica que há problemas
  } else {
    console.log('✅ Análise concluída sem problemas!');
    process.exit(0);
  }
}).catch(err => {
  console.error('❌ Erro durante análise:', err);
  process.exit(1);
});

