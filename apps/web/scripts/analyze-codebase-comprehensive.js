const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function analyzeTypeScript() {
  console.log('\n📘 ANALISANDO TYPESCRIPT...\n');
  
  const issues = [];
  
  try {
    console.log('  Executando type-check...');
    const output = execSync('npm run type-check', { 
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    if (output) {
      // Parse erros do TypeScript
      const errorLines = output.split('\n').filter(line => 
        line.includes('error TS') || line.includes('error:')
      );
      
      if (errorLines.length > 0) {
        issues.push({
          type: 'typescript_error',
          count: errorLines.length,
          issue: `${errorLines.length} erro(s) de TypeScript encontrado(s)`,
          details: errorLines.slice(0, 20) // Primeiros 20 erros
        });
      }
    }
  } catch (error) {
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
    const errorLines = errorOutput.split('\n').filter(line => 
      line.includes('error TS') || line.includes('error:')
    );
    
    if (errorLines.length > 0) {
      issues.push({
        type: 'typescript_error',
        count: errorLines.length,
        issue: `${errorLines.length} erro(s) de TypeScript encontrado(s)`,
        details: errorLines.slice(0, 50)
      });
    }
  }
  
  return issues;
}

async function analyzeAPIRoutes() {
  console.log('\n🔌 ANALISANDO API ROUTES...\n');
  
  const issues = [];
  const apiDir = path.join(__dirname, '../app/api');
  
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
  console.log(`  Encontradas ${routeFiles.length} rotas de API`);
  
  for (const routeFile of routeFiles) {
    try {
      const content = fs.readFileSync(routeFile, 'utf-8');
      const relativePath = path.relative(path.join(__dirname, '..'), routeFile);
      
      // Verificar se usa requireAuth
      if (content.includes('requireAuth') || content.includes('requireAuth')) {
        if (!content.includes('import') || !content.includes('requireAuth')) {
          // Verificar se o import está correto
          if (!content.includes("from '@/lib/api-auth'") && !content.includes("from '../lib/api-auth'")) {
            issues.push({
              type: 'api_auth',
              file: relativePath,
              issue: `Rota pode não estar usando requireAuth corretamente`
            });
          }
        }
      } else if (relativePath.includes('/admin/')) {
        // Rotas admin devem ter autenticação
        issues.push({
          type: 'api_auth',
          file: relativePath,
          issue: `Rota admin sem autenticação explícita`
        });
      }
      
      // Verificar tratamento de erros
      if (!content.includes('try') && !content.includes('catch')) {
        if (content.includes('async function') || content.includes('export async')) {
          issues.push({
            type: 'api_error_handling',
            file: relativePath,
            issue: `Rota sem tratamento de erros (try/catch)`
          });
        }
      }
      
      // Verificar se usa service role quando necessário
      if (relativePath.includes('/admin/')) {
        if (!content.includes('service') && !content.includes('ServiceRole') && !content.includes('supabaseServiceRole')) {
          // Pode estar usando anon key quando deveria usar service role
          if (content.includes('supabase') && !content.includes('service')) {
            issues.push({
              type: 'api_service_role',
              file: relativePath,
              issue: `Rota admin pode não estar usando service role`
            });
          }
        }
      }
      
    } catch (err) {
      issues.push({
        type: 'api_file_error',
        file: routeFile,
        issue: `Erro ao analisar arquivo: ${err.message}`
      });
    }
  }
  
  return issues;
}

async function analyzeHooksAndUtilities() {
  console.log('\n🪝 ANALISANDO HOOKS E UTILITÁRIOS...\n');
  
  const issues = [];
  const hooksDir = path.join(__dirname, '../hooks');
  const libDir = path.join(__dirname, '../lib');
  
  // Verificar hooks
  if (fs.existsSync(hooksDir)) {
    const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    console.log(`  Encontrados ${hookFiles.length} hooks`);
    
    for (const hookFile of hookFiles) {
      const filePath = path.join(hooksDir, hookFile);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Verificar se hooks começam com 'use'
        if (!hookFile.startsWith('use') && hookFile !== 'index.ts') {
          issues.push({
            type: 'hook_naming',
            file: hookFile,
            issue: `Hook não segue convenção de nomenclatura (deve começar com 'use')`
          });
        }
        
        // Verificar se hooks retornam valores
        if (content.includes('export function') || content.includes('export const')) {
          if (!content.includes('return')) {
            issues.push({
              type: 'hook_return',
              file: hookFile,
              issue: `Hook pode não estar retornando valor`
            });
          }
        }
        
      } catch (err) {
        issues.push({
          type: 'hook_file_error',
          file: hookFile,
          issue: `Erro ao analisar hook: ${err.message}`
        });
      }
    }
  }
  
  // Verificar utilitários críticos
  const criticalUtils = [
    'supabase.ts',
    'api-auth.ts',
    'global-sync.ts',
    'supabase-service-role.ts'
  ];
  
  for (const utilFile of criticalUtils) {
    const filePath = path.join(libDir, utilFile);
    if (!fs.existsSync(filePath)) {
      issues.push({
        type: 'missing_utility',
        file: utilFile,
        issue: `Arquivo utilitário crítico não encontrado: ${utilFile}`
      });
    }
  }
  
  return issues;
}

async function analyzeImports() {
  console.log('\n📦 ANALISANDO IMPORTS...\n');
  
  const issues = [];
  const appDir = path.join(__dirname, '../app');
  
  function findTSFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
        findTSFiles(filePath, fileList);
      } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.d.ts')) {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  }
  
  const tsFiles = findTSFiles(appDir);
  console.log(`  Analisando ${tsFiles.length} arquivos TypeScript...`);
  
  let checked = 0;
  for (const file of tsFiles.slice(0, 100)) { // Limitar a 100 arquivos para performance
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(path.join(__dirname, '..'), file);
      
      // Verificar imports quebrados comuns
      const brokenImports = [
        /from ['"]@\/components\/app-shell['"]/,
        /from ['"]@\/lib\/supabase['"]/,
        /from ['"]@\/hooks\/use-auth['"]/
      ];
      
      brokenImports.forEach(pattern => {
        if (pattern.test(content)) {
          // Verificar se o arquivo existe
          const importMatch = content.match(pattern);
          if (importMatch) {
            const importPath = importMatch[0].replace(/from ['"]|['"]/g, '');
            const fullPath = path.join(__dirname, '..', importPath.replace('@/', ''));
            
            if (!fs.existsSync(fullPath + '.ts') && !fs.existsSync(fullPath + '.tsx') && !fs.existsSync(fullPath + '/index.ts')) {
              issues.push({
                type: 'broken_import',
                file: relativePath,
                issue: `Import quebrado: ${importPath}`
              });
            }
          }
        }
      });
      
      checked++;
    } catch (err) {
      // Ignorar erros de leitura
    }
  }
  
  console.log(`  Verificados ${checked} arquivos`);
  
  return issues;
}

async function main() {
  console.log('🔍 ANÁLISE COMPLETA DO CODEBASE');
  console.log('================================\n');
  
  const allIssues = [];
  
  // Análise TypeScript
  const tsIssues = await analyzeTypeScript();
  allIssues.push(...tsIssues);
  
  // Análise API Routes
  const apiIssues = await analyzeAPIRoutes();
  allIssues.push(...apiIssues);
  
  // Análise Hooks e Utilitários
  const hooksIssues = await analyzeHooksAndUtilities();
  allIssues.push(...hooksIssues);
  
  // Análise de Imports
  const importIssues = await analyzeImports();
  allIssues.push(...importIssues);
  
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
        console.log(`  ${index + 1}. ${issue.issue || issue.file || 'Problema desconhecido'}`);
        if (issue.file) console.log(`     Arquivo: ${issue.file}`);
      });
      if (issues.length > 10) {
        console.log(`  ... e mais ${issues.length - 10} problema(s)`);
      }
    });
  }
  
  console.log('\n================================\n');
  
  // Salvar resultados
  const reportFile = path.join(__dirname, '../CODEBASE_ANALYSIS_REPORT.json');
  
  fs.writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
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
  
  return { issues: allIssues };
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

