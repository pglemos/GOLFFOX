require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkTableStructure() {
  console.log('\n🔍 VERIFICANDO ESTRUTURA DAS TABELAS...\n');
  
  const issues = [];
  
  // Verificar se companies tem updated_at
  const { data: companiesSample, error: e1 } = await supabase
    .from('companies')
    .select('*')
    .limit(1);
  
  if (companiesSample && companiesSample.length > 0) {
    const company = companiesSample[0];
    if (!company.updated_at) {
      issues.push({
        type: 'missing_column',
        table: 'companies',
        column: 'updated_at',
        issue: 'Tabela companies não tem coluna updated_at (necessária para triggers)'
      });
    }
  }
  
  // Verificar se routes tem is_active
  const { data: routesSample, error: e2 } = await supabase
    .from('routes')
    .select('*')
    .limit(1);
  
  if (routesSample && routesSample.length > 0) {
    const route = routesSample[0];
    if (route.is_active === undefined) {
      issues.push({
        type: 'missing_column',
        table: 'routes',
        column: 'is_active',
        issue: 'Tabela routes não tem coluna is_active'
      });
    }
  }
  
  // Verificar se vehicles tem is_active
  const { data: vehiclesSample, error: e3 } = await supabase
    .from('vehicles')
    .select('*')
    .limit(1);
  
  if (vehiclesSample && vehiclesSample.length > 0) {
    const vehicle = vehiclesSample[0];
    if (vehicle.is_active === undefined) {
      issues.push({
        type: 'missing_column',
        table: 'vehicles',
        column: 'is_active',
        issue: 'Tabela vehicles não tem coluna is_active'
      });
    }
  }
  
  // Verificar se users tem is_active
  const { data: usersSample, error: e4 } = await supabase
    .from('users')
    .select('*')
    .limit(1);
  
  if (usersSample && usersSample.length > 0) {
    const user = usersSample[0];
    if (user.is_active === undefined) {
      issues.push({
        type: 'missing_column',
        table: 'users',
        column: 'is_active',
        issue: 'Tabela users não tem coluna is_active'
      });
    }
  }
  
  return issues;
}

async function checkDataConsistency() {
  console.log('\n🔍 VERIFICANDO CONSISTÊNCIA DOS DADOS...\n');
  
  const issues = [];
  
  // Verificar trips com status inválido
  const { data: trips, error: e1 } = await supabase
    .from('trips')
    .select('id, status');
  
  if (trips) {
    const validStatuses = ['scheduled', 'inProgress', 'completed', 'cancelled'];
    trips.forEach(trip => {
      if (trip.status && !validStatuses.includes(trip.status)) {
        issues.push({
          type: 'invalid_data',
          table: 'trips',
          record_id: trip.id,
          field: 'status',
          value: trip.status,
          issue: `Trip ${trip.id} tem status inválido: ${trip.status}`
        });
      }
    });
  }
  
  // Verificar users com role inválido
  const { data: users, error: e2 } = await supabase
    .from('users')
    .select('id, role');
  
  if (users) {
    const validRoles = ['admin', 'operator', 'carrier', 'driver', 'passenger'];
    users.forEach(user => {
      if (user.role && !validRoles.includes(user.role)) {
        issues.push({
          type: 'invalid_data',
          table: 'users',
          record_id: user.id,
          field: 'role',
          value: user.role,
          issue: `User ${user.id} tem role inválido: ${user.role}`
        });
      }
    });
  }
  
  // Verificar emails duplicados em users
  const { data: allUsers, error: e3 } = await supabase
    .from('users')
    .select('id, email');
  
  if (allUsers) {
    const emailCounts = {};
    allUsers.forEach(u => {
      if (u.email) {
        emailCounts[u.email] = (emailCounts[u.email] || []).concat(u.id);
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
  
  // Verificar companies duplicadas (mesmo nome)
  const { data: allCompanies, error: e4 } = await supabase
    .from('companies')
    .select('id, name');
  
  if (allCompanies) {
    const nameCounts = {};
    allCompanies.forEach(c => {
      if (c.name) {
        nameCounts[c.name] = (nameCounts[c.name] || []).concat(c.id);
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
  
  return issues;
}

async function checkNullConstraints() {
  console.log('\n🔍 VERIFICANDO CONSTRAINTS DE NULL...\n');
  
  const issues = [];
  
  // Verificar routes sem company_id
  const { data: routesWithoutCompany, error: e1 } = await supabase
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
  
  // Verificar trips sem route_id
  const { data: tripsWithoutRoute, error: e2 } = await supabase
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

async function checkPerformanceIssues() {
  console.log('\n🔍 VERIFICANDO PROBLEMAS DE PERFORMANCE...\n');
  
  const issues = [];
  
  // Verificar tabelas muito grandes sem índices apropriados
  const { count: tripsCount } = await supabase
    .from('trips')
    .select('*', { count: 'exact', head: true });
  
  if (tripsCount > 1000) {
    issues.push({
      type: 'performance',
      table: 'trips',
      count: tripsCount,
      issue: `Tabela trips tem ${tripsCount} registros - verificar índices em route_id, vehicle_id, driver_id, status`
    });
  }
  
  const { count: employeesCount } = await supabase
    .from('gf_employee_company')
    .select('*', { count: 'exact', head: true });
  
  if (employeesCount > 1000) {
    issues.push({
      type: 'performance',
      table: 'gf_employee_company',
      count: employeesCount,
      issue: `Tabela gf_employee_company tem ${employeesCount} registros - verificar índices em company_id`
    });
  }
  
  return issues;
}

async function checkRLSPolicies() {
  console.log('\n🔍 VERIFICANDO RLS POLICIES...\n');
  
  const issues = [];
  
  // Tentar acessar dados com anon key para verificar RLS
  const { createClient: createAnonClient } = require('@supabase/supabase-js');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (anonKey) {
    const anonSupabase = createAnonClient(supabaseUrl, anonKey);
    
    // Testar acesso a routes
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
    
    // Testar acesso a vehicles
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
  }
  
  return issues;
}

async function main() {
  console.log('🔍 ANÁLISE PROFUNDA DO SUPABASE');
  console.log('================================\n');
  
  const allIssues = [];
  
  // Verificar estrutura
  const structureIssues = await checkTableStructure();
  allIssues.push(...structureIssues);
  
  // Verificar consistência
  const consistencyIssues = await checkDataConsistency();
  allIssues.push(...consistencyIssues);
  
  // Verificar constraints
  const constraintIssues = await checkNullConstraints();
  allIssues.push(...constraintIssues);
  
  // Verificar performance
  const performanceIssues = await checkPerformanceIssues();
  allIssues.push(...performanceIssues);
  
  // Verificar RLS
  const rlsIssues = await checkRLSPolicies();
  allIssues.push(...rlsIssues);
  
  console.log('\n================================');
  console.log('📋 RESUMO DE PROBLEMAS ENCONTRADOS:');
  console.log('================================\n');
  
  if (allIssues.length === 0) {
    console.log('✅ Nenhum problema encontrado!');
  } else {
    console.log(`❌ ${allIssues.length} problema(s) encontrado(s):\n`);
    
    const groupedIssues = {};
    allIssues.forEach(issue => {
      if (!groupedIssues[issue.type]) {
        groupedIssues[issue.type] = [];
      }
      groupedIssues[issue.type].push(issue);
    });
    
    Object.entries(groupedIssues).forEach(([type, issues]) => {
      console.log(`\n[${type.toUpperCase()}] (${issues.length} problema(s)):`);
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.issue}`);
        if (issue.table) console.log(`     Tabela: ${issue.table}`);
        if (issue.field) console.log(`     Campo: ${issue.field}`);
        if (issue.value) console.log(`     Valor: ${issue.value}`);
        if (issue.count) console.log(`     Quantidade: ${issue.count}`);
      });
    });
  }
  
  console.log('\n================================\n');
  
  return allIssues;
}

main().then(issues => {
  if (issues.length > 0) {
    console.log('⚠️ Problemas encontrados. Gerando script de correção...');
    process.exit(1);
  } else {
    console.log('✅ Análise concluída sem problemas!');
    process.exit(0);
  }
}).catch(err => {
  console.error('❌ Erro durante análise:', err);
  process.exit(1);
});

