#!/usr/bin/env node

/**
 * 🧪 TESTE COMPLETO DO SISTEMA GOLFFOX
 * 
 * Este script executa uma bateria completa de testes no sistema
 * após deploy na Vercel, verificando todos os componentes críticos.
 * 
 * Uso:
 *   node scripts/test-complete-system.js [email] [password]
 */

const https = require('https');

// Configurações
const BASE_URL = process.env.VERCEL_URL || 'golffox.vercel.app';
const TEST_EMAIL = process.argv[2] || 'golffox@admin.com';
const TEST_PASSWORD = process.argv[3];

if (!TEST_PASSWORD) {
  console.error('❌ Erro: Senha não fornecida');
  console.log('\nUso: node scripts/test-complete-system.js [email] [password]');
  console.log('Exemplo: node scripts/test-complete-system.js admin@golffox.com MinhaSenh@123');
  process.exit(1);
}

// Cores
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70) + '\n');
}

// Resultados dos testes
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function recordTest(name, status, message, details = null) {
  results.total++;
  results.tests.push({ name, status, message, details, timestamp: new Date().toISOString() });
  
  if (status === 'pass') {
    results.passed++;
    log(`✅ ${name}: ${message}`, 'green');
  } else if (status === 'fail') {
    results.failed++;
    log(`❌ ${name}: ${message}`, 'red');
  } else if (status === 'warning') {
    results.warnings++;
    log(`⚠️  ${name}: ${message}`, 'yellow');
  }
  
  if (details) {
    log(`   Detalhes: ${JSON.stringify(details)}`, 'cyan');
  }
}

// Utilitário para fazer requisições HTTP
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: BASE_URL,
      port: 443,
      path,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000,
    };

    const req = https.request(requestOptions, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          json: () => {
            try {
              return JSON.parse(body);
            } catch {
              return null;
            }
          }
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// ==================== TESTES ====================

// TESTE 1: Health Check
async function testHealth() {
  section('TESTE 1: Health Check');
  
  try {
    const res = await makeRequest('/api/health');
    const data = res.json();
    
    if (res.status === 200 && data && data.status === 'ok') {
      recordTest('Health Check', 'pass', 'API está online', { status: data.status, supabase: data.supabase });
      
      // Verificar se Supabase está ok
      if (data.supabase === 'ok') {
        recordTest('Supabase Connection', 'pass', 'Conexão com Supabase funcionando');
      } else if (data.error && data.error.includes('Invalid API key')) {
        recordTest('Supabase Connection', 'fail', 'API Key do Supabase inválida', { error: data.error });
      } else {
        recordTest('Supabase Connection', 'warning', 'Supabase com problemas', { error: data.error });
      }
    } else {
      recordTest('Health Check', 'fail', `Status inesperado: ${res.status}`);
    }
  } catch (error) {
    recordTest('Health Check', 'fail', 'Servidor não acessível', { error: error.message });
  }
}

// TESTE 2: CSRF Token
async function testCSRF() {
  section('TESTE 2: CSRF Token');
  
  try {
    const res = await makeRequest('/api/auth/csrf');
    const data = res.json();
    
    if (res.status === 200 && data && (data.csrfToken || data.token)) {
      const token = data.csrfToken || data.token;
      recordTest('CSRF Token', 'pass', 'Token obtido com sucesso', { tokenLength: token.length });
      return token;
    } else {
      recordTest('CSRF Token', 'fail', 'Falha ao obter token');
      return null;
    }
  } catch (error) {
    recordTest('CSRF Token', 'fail', 'Erro ao requisitar token', { error: error.message });
    return null;
  }
}

// TESTE 3: Login
async function testLogin(csrfToken) {
  section('TESTE 3: Login');
  
  try {
    const body = JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    const res = await makeRequest('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken || 'test',
        'Content-Length': body.length
      },
      body
    });
    
    const data = res.json();
    
    if (res.status === 200 && data && data.token) {
      recordTest('Login', 'pass', 'Autenticação bem-sucedida', {
        role: data.user?.role,
        hasToken: !!data.token
      });
      
      return {
        token: data.token,
        user: data.user,
        cookie: res.headers['set-cookie']
      };
    } else {
      recordTest('Login', 'fail', data?.error || 'Falha na autenticação', {
        status: res.status,
        code: data?.code
      });
      return null;
    }
  } catch (error) {
    recordTest('Login', 'fail', 'Erro na requisição de login', { error: error.message });
    return null;
  }
}

// TESTE 4: Logo Asset
async function testLogo() {
  section('TESTE 4: Logo Asset');
  
  try {
    const res = await makeRequest('/icons/golf_fox_logo.svg');
    
    if (res.status === 200) {
      recordTest('Logo SVG', 'pass', 'Logo carregado com sucesso');
    } else if (res.status === 404) {
      recordTest('Logo SVG', 'fail', 'Logo não encontrado (404)', {
        solution: 'Verificar configuração de assets do Next.js'
      });
    } else {
      recordTest('Logo SVG', 'warning', `Status inesperado: ${res.status}`);
    }
  } catch (error) {
    recordTest('Logo SVG', 'fail', 'Erro ao carregar logo', { error: error.message });
  }
}

// TESTE 5: Admin KPIs (requer autenticação)
async function testAdminKPIs(auth) {
  section('TESTE 5: Admin KPIs');
  
  if (!auth || !auth.token) {
    recordTest('Admin KPIs', 'fail', 'Não autenticado - pulando teste');
    return;
  }
  
  try {
    const res = await makeRequest('/api/admin/kpis', {
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Cookie': auth.cookie || ''
      }
    });
    
    const data = res.json();
    
    if (res.status === 200) {
      if (data && Array.isArray(data) && data.length === 0) {
        recordTest('Admin KPIs', 'warning', 'Endpoint funcionando mas retornou array vazio', {
          message: 'Views de KPIs podem não existir no banco'
        });
      } else if (data && Object.keys(data).length > 0) {
        recordTest('Admin KPIs', 'pass', 'KPIs carregados com sucesso', {
          keys: Object.keys(data).length
        });
      } else {
        recordTest('Admin KPIs', 'warning', 'Resposta vazia');
      }
    } else if (res.status === 500 && data?.error?.includes('Invalid API key')) {
      recordTest('Admin KPIs', 'fail', 'API Key do Supabase inválida', {
        solution: 'Configurar NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel'
      });
    } else {
      recordTest('Admin KPIs', 'fail', `Status ${res.status}`, { error: data?.error });
    }
  } catch (error) {
    recordTest('Admin KPIs', 'fail', 'Erro na requisição', { error: error.message });
  }
}

// TESTE 6: Audit Log (requer autenticação)
async function testAuditLog(auth) {
  section('TESTE 6: Audit Log');
  
  if (!auth || !auth.token) {
    recordTest('Audit Log', 'fail', 'Não autenticado - pulando teste');
    return;
  }
  
  try {
    const res = await makeRequest('/api/admin/audit-log', {
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Cookie': auth.cookie || ''
      }
    });
    
    const data = res.json();
    
    if (res.status === 200) {
      recordTest('Audit Log', 'pass', 'Audit log carregado', {
        entries: Array.isArray(data) ? data.length : 'N/A'
      });
    } else if (res.status === 500 && data?.error?.includes('Invalid API key')) {
      recordTest('Audit Log', 'fail', 'API Key do Supabase inválida', {
        solution: 'Configurar NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel'
      });
    } else {
      recordTest('Audit Log', 'fail', `Status ${res.status}`, { error: data?.error });
    }
  } catch (error) {
    recordTest('Audit Log', 'fail', 'Erro na requisição', { error: error.message });
  }
}

// TESTE 7: Página Home
async function testHomePage() {
  section('TESTE 7: Página Home');
  
  try {
    const res = await makeRequest('/');
    
    if (res.status === 200) {
      const hasLogin = res.body.includes('login') || res.body.includes('Login');
      const hasLogo = res.body.includes('golf_fox_logo');
      
      recordTest('Home Page', 'pass', 'Página carrega corretamente', {
        hasLoginForm: hasLogin,
        hasLogo: hasLogo
      });
    } else {
      recordTest('Home Page', 'fail', `Status ${res.status}`);
    }
  } catch (error) {
    recordTest('Home Page', 'fail', 'Erro ao carregar', { error: error.message });
  }
}

// TESTE 8: Variáveis de Ambiente (inferido)
async function testEnvironmentVariables() {
  section('TESTE 8: Variáveis de Ambiente');
  
  // Inferir estado das variáveis com base em outros testes
  const hasSupabaseIssues = results.tests.some(t => 
    t.details && JSON.stringify(t.details).includes('Invalid API key')
  );
  
  if (hasSupabaseIssues) {
    recordTest('Supabase Variables', 'fail', 'API Keys do Supabase estão incorretas ou ausentes', {
      required: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ],
      action: 'Configurar em https://vercel.com/synvolt/golffox/settings/environment-variables'
    });
  } else {
    recordTest('Supabase Variables', 'pass', 'Variáveis do Supabase parecem corretas');
  }
}

// ==================== EXECUÇÃO ====================

async function runAllTests() {
  console.clear();
  
  log('╔════════════════════════════════════════════════════════════════════╗', 'bright');
  log('║     🧪 TESTE COMPLETO DO SISTEMA - GOLFFOX VERCEL                ║', 'bright');
  log('╚════════════════════════════════════════════════════════════════════╝', 'bright');
  
  log(`\n📍 URL: https://${BASE_URL}`, 'cyan');
  log(`📧 Email: ${TEST_EMAIL}`, 'cyan');
  log(`⏰ Início: ${new Date().toLocaleString('pt-BR')}`, 'cyan');
  
  // Executar testes em sequência
  await testHealth();
  const csrfToken = await testCSRF();
  const auth = await testLogin(csrfToken);
  await testLogo();
  await testAdminKPIs(auth);
  await testAuditLog(auth);
  await testHomePage();
  await testEnvironmentVariables();
  
  // Relatório final
  section('📊 RELATÓRIO FINAL');
  
  log(`Total de testes: ${results.total}`, 'cyan');
  log(`✅ Passou: ${results.passed}`, 'green');
  log(`❌ Falhou: ${results.failed}`, 'red');
  log(`⚠️  Avisos: ${results.warnings}`, 'yellow');
  
  const successRate = Math.round((results.passed / results.total) * 100);
  console.log();
  
  if (successRate >= 90) {
    log(`🎉 Taxa de sucesso: ${successRate}% - EXCELENTE!`, 'green');
  } else if (successRate >= 70) {
    log(`👍 Taxa de sucesso: ${successRate}% - BOM (requer atenção)`, 'yellow');
  } else {
    log(`⚠️  Taxa de sucesso: ${successRate}% - PROBLEMAS DETECTADOS`, 'red');
  }
  
  console.log();
  log('⏰ Fim: ' + new Date().toLocaleString('pt-BR'), 'cyan');
  
  // Salvar relatório em JSON
  const reportPath = 'test-report-' + Date.now() + '.json';
  require('fs').writeFileSync(
    reportPath,
    JSON.stringify(results, null, 2)
  );
  
  log(`\n📄 Relatório salvo em: ${reportPath}`, 'cyan');
  
  // Análise e recomendações
  section('💡 RECOMENDAÇÕES');
  
  const criticalIssues = results.tests.filter(t => t.status === 'fail');
  
  if (criticalIssues.length === 0) {
    log('✅ Nenhum problema crítico detectado!', 'green');
    log('   O sistema está funcionando corretamente.', 'green');
  } else {
    log(`🔴 ${criticalIssues.length} problema(s) crítico(s) detectado(s):`, 'red');
    console.log();
    
    criticalIssues.forEach((issue, i) => {
      log(`${i + 1}. ${issue.name}: ${issue.message}`, 'yellow');
      if (issue.details && issue.details.solution) {
        log(`   Solução: ${issue.details.solution}`, 'cyan');
      }
    });
    
    console.log();
    log('📖 Consulte docs/auditoria/ANALISE_LOGS_VERCEL_COMPLETA.md para mais detalhes', 'cyan');
  }
  
  // Exit code baseado em falhas críticas
  process.exit(results.failed > 0 ? 1 : 0);
}

// Executar
runAllTests().catch((error) => {
  log('\n❌ ERRO FATAL NO TESTE:', 'red');
  log(error.stack, 'red');
  process.exit(1);
});

