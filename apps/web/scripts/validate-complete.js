require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function validateSupabase() {
  console.log('\n✅ VALIDANDO SUPABASE...\n');
  
  const issues = [];
  
  // Verificar conexão
  try {
    const { data, error } = await supabase.from('companies').select('id').limit(1);
    if (error) {
      issues.push({ type: 'connection', issue: `Erro de conexão: ${error.message}` });
    } else {
      console.log('  ✅ Conexão com Supabase OK');
    }
  } catch (err) {
    issues.push({ type: 'connection', issue: `Erro de conexão: ${err.message}` });
  }
  
  // Verificar tabelas principais
  const mainTables = ['companies', 'users', 'routes', 'vehicles', 'trips'];
  for (const table of mainTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        issues.push({ type: 'table', table, issue: `Erro ao acessar: ${error.message}` });
      } else {
        console.log(`  ✅ Tabela ${table} acessível`);
      }
    } catch (err) {
      issues.push({ type: 'table', table, issue: `Erro: ${err.message}` });
    }
  }
  
  return issues;
}

async function validateTypeScript() {
  console.log('\n✅ VALIDANDO TYPESCRIPT...\n');
  
  const issues = [];
  
  try {
    console.log('  Executando type-check...');
    execSync('npm run type-check', { 
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    console.log('  ✅ TypeScript sem erros críticos');
  } catch (error) {
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorCount = (errorOutput.match(/error TS/g) || []).length;
    
    if (errorCount > 0) {
      issues.push({
        type: 'typescript',
        count: errorCount,
        issue: `${errorCount} erro(s) de TypeScript encontrado(s)`
      });
      console.log(`  ⚠️ ${errorCount} erro(s) de TypeScript (alguns podem ser warnings do Next.js)`);
    }
  }
  
  return issues;
}

async function validateAPIRoutes() {
  console.log('\n✅ VALIDANDO API ROUTES...\n');
  
  const issues = [];
  const apiDir = path.join(__dirname, '../app/api');
  const fs = require('fs');
  
  if (!fs.existsSync(apiDir)) {
    return issues;
  }
  
  function findRouteFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findRouteFiles(filePath, fileList);
      } else if (file === 'route.ts' || file === 'route.js') {
        fileList.push(filePath);
      }
    });
    return fileList;
  }
  
  const routeFiles = findRouteFiles(apiDir);
  console.log(`  ✅ ${routeFiles.length} rotas encontradas`);
  
  // Verificar se rotas críticas existem
  const criticalRoutes = [
    'app/api/admin/routes-list/route.ts',
    'app/api/admin/vehicles-list/route.ts',
    'app/api/admin/drivers-list/route.ts',
    'app/api/admin/companies-list/route.ts'
  ];
  
  for (const route of criticalRoutes) {
    const routePath = path.join(__dirname, '..', route);
    if (!fs.existsSync(routePath)) {
      issues.push({ type: 'missing_route', route, issue: `Rota crítica não encontrada: ${route}` });
    }
  }
  
  if (issues.length === 0) {
    console.log('  ✅ Todas as rotas críticas existem');
  }
  
  return issues;
}

async function main() {
  console.log('✅ VALIDAÇÃO FINAL COMPLETA');
  console.log('================================\n');
  
  const allIssues = [];
  
  // Validação Supabase
  const supabaseIssues = await validateSupabase();
  allIssues.push(...supabaseIssues);
  
  // Validação TypeScript
  const tsIssues = await validateTypeScript();
  allIssues.push(...tsIssues);
  
  // Validação API Routes
  const apiIssues = await validateAPIRoutes();
  allIssues.push(...apiIssues);
  
  // Resumo
  console.log('\n================================');
  console.log('📋 RESUMO DA VALIDAÇÃO:');
  console.log('================================\n');
  
  if (allIssues.length === 0) {
    console.log('✅ TODAS AS VALIDAÇÕES PASSARAM!');
    console.log('\n✅ Sistema pronto para uso!');
  } else {
    console.log(`⚠️ ${allIssues.length} problema(s) encontrado(s):\n`);
    allIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.type}] ${issue.issue}`);
    });
  }
  
  console.log('\n================================\n');
  
  return { issues: allIssues };
}

main().then(({ issues }) => {
  if (issues.length > 0) {
    console.log(`⚠️ ${issues.length} problema(s) encontrado(s).`);
    process.exit(1);
  } else {
    console.log('✅ Validação completa bem-sucedida!');
    process.exit(0);
  }
}).catch(err => {
  console.error('❌ Erro durante validação:', err);
  process.exit(1);
});

