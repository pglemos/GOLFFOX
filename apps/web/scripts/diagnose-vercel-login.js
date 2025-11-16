#!/usr/bin/env node

/**
 * Script de Diagnóstico de Login - GOLFFOX Vercel
 * 
 * Este script testa o endpoint de login na Vercel e identifica
 * problemas específicos baseado nas respostas da API.
 * 
 * Uso:
 *   node scripts/diagnose-vercel-login.js [email] [password]
 * 
 * Exemplo:
 *   node scripts/diagnose-vercel-login.js admin@golffox.com MinhaSenh@123
 */

const https = require('https');

// Configurações
const VERCEL_URL = process.env.VERCEL_URL || 'golffox.vercel.app';
const TEST_EMAIL = process.argv[2] || 'teste@exemplo.com';
const TEST_PASSWORD = process.argv[3] || 'SenhaTest123!';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70) + '\n');
}

// Teste 1: Verificar se o servidor está acessível
async function testServerHealth() {
  logSection('TESTE 1: Verificando Saúde do Servidor');
  
  return new Promise((resolve) => {
    const options = {
      hostname: VERCEL_URL,
      port: 443,
      path: '/api/health',
      method: 'GET',
      timeout: 10000,
    };

    log('📡 Testando: https://' + VERCEL_URL + '/api/health', 'cyan');

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          log('✅ Servidor está online e respondendo', 'green');
          log('   Status: ' + res.statusCode, 'green');
          try {
            const json = JSON.parse(body);
            log('   Response: ' + JSON.stringify(json), 'green');
          } catch {
            log('   Response: ' + body, 'green');
          }
          resolve(true);
        } else {
          log('⚠️  Servidor respondeu com status ' + res.statusCode, 'yellow');
          log('   Isso pode indicar problemas de configuração', 'yellow');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log('❌ ERRO: Não foi possível conectar ao servidor', 'red');
      log('   ' + error.message, 'red');
      log('   Verifique se a URL está correta: ' + VERCEL_URL, 'yellow');
      resolve(false);
    });

    req.on('timeout', () => {
      log('❌ ERRO: Timeout ao conectar ao servidor', 'red');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Teste 2: Obter CSRF Token
async function getCsrfToken() {
  logSection('TESTE 2: Obtendo CSRF Token');
  
  return new Promise((resolve) => {
    const options = {
      hostname: VERCEL_URL,
      port: 443,
      path: '/api/auth/csrf',
      method: 'GET',
      timeout: 10000,
    };

    log('📡 Testando: https://' + VERCEL_URL + '/api/auth/csrf', 'cyan');

    const req = https.request(options, (res) => {
      let body = '';
      let cookies = [];
      
      // Capturar cookies do Set-Cookie header
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        cookies = setCookie;
      }
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(body);
            const token = json.csrfToken || json.token;
            
            if (token) {
              log('✅ CSRF Token obtido com sucesso', 'green');
              log('   Token: ' + token.substring(0, 20) + '...', 'green');
              
              // Extrair cookie do header
              let csrfCookie = null;
              if (cookies.length > 0) {
                cookies.forEach(cookie => {
                  if (cookie.includes('golffox-csrf')) {
                    csrfCookie = cookie.split(';')[0].split('=')[1];
                  }
                });
              }
              
              if (csrfCookie) {
                log('   Cookie CSRF: ' + csrfCookie.substring(0, 20) + '...', 'green');
              }
              
              resolve({ token, cookie: csrfCookie });
            } else {
              log('⚠️  Token não encontrado na resposta', 'yellow');
              log('   Response: ' + body, 'yellow');
              resolve({ token: null, cookie: null });
            }
          } catch (e) {
            log('❌ ERRO: Resposta não é JSON válido', 'red');
            log('   Response: ' + body, 'red');
            resolve({ token: null, cookie: null });
          }
        } else {
          log('❌ ERRO: Status ' + res.statusCode, 'red');
          log('   Response: ' + body, 'red');
          resolve({ token: null, cookie: null });
        }
      });
    });

    req.on('error', (error) => {
      log('❌ ERRO: ' + error.message, 'red');
      resolve({ token: null, cookie: null });
    });

    req.on('timeout', () => {
      log('❌ ERRO: Timeout', 'red');
      req.destroy();
      resolve({ token: null, cookie: null });
    });

    req.end();
  });
}

// Teste 3: Tentar Login
async function testLogin(csrfToken) {
  logSection('TESTE 3: Testando Endpoint de Login');
  
  return new Promise((resolve) => {
    const data = JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'User-Agent': 'GolfFox-Diagnostic-Script/1.0',
    };

    // Adicionar CSRF token se disponível
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
      log('🔐 Usando CSRF Token no header', 'cyan');
    } else {
      log('⚠️  CSRF Token não disponível - pode causar erro 403', 'yellow');
    }

    const options = {
      hostname: VERCEL_URL,
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: headers,
      timeout: 15000,
    };

    log('📡 Testando: https://' + VERCEL_URL + '/api/auth/login', 'cyan');
    log('📧 Email: ' + TEST_EMAIL, 'cyan');
    log('🔑 Senha: ' + '*'.repeat(TEST_PASSWORD.length), 'cyan');

    const req = https.request(options, (res) => {
      let body = '';
      
      log('\n📊 Status HTTP: ' + res.statusCode, res.statusCode === 200 ? 'green' : 'yellow');
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log('\n📦 Resposta do Servidor:');
        console.log('-'.repeat(70));
        
        try {
          const json = JSON.parse(body);
          console.log(JSON.stringify(json, null, 2));
          console.log('-'.repeat(70));
          
          // Análise detalhada da resposta
          analyzeLoginResponse(res.statusCode, json);
          resolve(true);
        } catch (e) {
          log(body, 'red');
          console.log('-'.repeat(70));
          log('\n❌ ERRO: Resposta não é JSON válido', 'red');
          log('   Isso pode indicar um erro no servidor ou problema de roteamento', 'yellow');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log('\n❌ ERRO DE REDE:', 'red');
      log('   ' + error.message, 'red');
      resolve(false);
    });

    req.on('timeout', () => {
      log('\n❌ ERRO: Timeout na requisição (15s)', 'red');
      log('   O servidor pode estar sobrecarregado ou com problemas', 'yellow');
      req.destroy();
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// Análise detalhada da resposta de login
function analyzeLoginResponse(statusCode, response) {
  logSection('ANÁLISE DO RESULTADO');
  
  if (statusCode === 200 && response.token) {
    log('✅ LOGIN BEM-SUCEDIDO!', 'green');
    log('\n✨ O sistema de login está funcionando corretamente!', 'green');
    
    if (response.user) {
      log('\n👤 Dados do Usuário:', 'cyan');
      log('   ID: ' + response.user.id, 'cyan');
      log('   Email: ' + response.user.email, 'cyan');
      log('   Role: ' + response.user.role, 'cyan');
      if (response.user.companyId) {
        log('   Company ID: ' + response.user.companyId, 'cyan');
      }
    }
    
    log('\n🔑 Token recebido: ' + response.token.substring(0, 30) + '...', 'cyan');
    
    return;
  }
  
  if (response.error) {
    log('❌ LOGIN FALHOU', 'red');
    log('\n🔍 Erro Identificado: ' + response.error, 'red');
    
    const errorCode = response.code || 'unknown';
    log('   Código: ' + errorCode, 'red');
    
    console.log('\n' + '─'.repeat(70));
    log('💡 DIAGNÓSTICO E SOLUÇÃO:', 'yellow');
    console.log('─'.repeat(70));
    
    // Diagnósticos específicos por tipo de erro
    switch (errorCode) {
      case 'missing_supabase_env':
      case 'supabase_unreachable':
        log('\n🎯 PROBLEMA: Variáveis de ambiente do Supabase não configuradas', 'yellow');
        log('\n📝 SOLUÇÃO:', 'green');
        log('   1. Acesse: https://vercel.com/synvolt/golffox/settings/environment-variables', 'cyan');
        log('   2. Adicione as seguintes variáveis:', 'cyan');
        log('      • NEXT_PUBLIC_SUPABASE_URL', 'cyan');
        log('      • NEXT_PUBLIC_SUPABASE_ANON_KEY', 'cyan');
        log('      • SUPABASE_URL', 'cyan');
        log('      • SUPABASE_ANON_KEY', 'cyan');
        log('   3. Obtenha os valores em: https://supabase.com/dashboard/project/[SEU_PROJETO]/settings/api', 'cyan');
        log('   4. Após adicionar, faça REDEPLOY do projeto', 'cyan');
        break;
        
      case 'user_not_in_db':
        log('\n🎯 PROBLEMA: Usuário não cadastrado na tabela users do Supabase', 'yellow');
        log('\n📝 SOLUÇÃO:', 'green');
        log('   1. Acesse o Supabase SQL Editor', 'cyan');
        log('   2. Execute a seguinte query:', 'cyan');
        console.log(`
   -- Verificar se existe no auth
   SELECT id, email FROM auth.users WHERE email = '${TEST_EMAIL}';
   
   -- Se existir, copie o ID e execute:
   INSERT INTO public.users (id, email, role, is_active, created_at, updated_at)
   VALUES (
     'ID_COPIADO_ACIMA',
     '${TEST_EMAIL}',
     'admin',  -- ou 'operator', 'carrier'
     true,
     NOW(),
     NOW()
   )
   ON CONFLICT (id) DO UPDATE
   SET is_active = true, role = 'admin', updated_at = NOW();
        `);
        break;
        
      case 'no_company_mapping':
        log('\n🎯 PROBLEMA: Usuário operador sem empresa associada', 'yellow');
        log('\n📝 SOLUÇÃO:', 'green');
        log('   1. Acesse o Supabase SQL Editor', 'cyan');
        log('   2. Execute:', 'cyan');
        console.log(`
   -- Listar empresas disponíveis
   SELECT id, name FROM companies WHERE is_active = true;
   
   -- Associar usuário à empresa (substitua os UUIDs)
   INSERT INTO gf_user_company_map (user_id, company_id, created_at)
   VALUES ('UUID_DO_USUARIO', 'UUID_DA_EMPRESA', NOW())
   ON CONFLICT DO NOTHING;
        `);
        break;
        
      case 'company_inactive':
        log('\n🎯 PROBLEMA: Empresa associada ao usuário está inativa', 'yellow');
        log('\n📝 SOLUÇÃO:', 'green');
        log('   1. Ative a empresa no Supabase:', 'cyan');
        console.log(`
   UPDATE companies 
   SET is_active = true 
   WHERE id = (
     SELECT company_id 
     FROM gf_user_company_map 
     WHERE user_id = 'UUID_DO_USUARIO'
   );
        `);
        break;
        
      case 'invalid_credentials':
      case 'user_not_found':
        log('\n🎯 PROBLEMA: Credenciais inválidas ou usuário não existe no Supabase Auth', 'yellow');
        log('\n📝 SOLUÇÃO:', 'green');
        log('   1. Verifique se o email e senha estão corretos', 'cyan');
        log('   2. Crie o usuário no Supabase Auth:', 'cyan');
        log('      • Acesse: https://supabase.com/dashboard/project/[SEU_PROJETO]/auth/users', 'cyan');
        log('      • Clique em "Add user" > "Create new user"', 'cyan');
        log('      • Email: ' + TEST_EMAIL, 'cyan');
        log('      • Senha: [sua senha segura]', 'cyan');
        log('   3. Após criar, execute o SQL para adicionar na tabela users (veja problema anterior)', 'cyan');
        break;
        
      case 'invalid_csrf':
        log('\n🎯 PROBLEMA: Validação CSRF falhou', 'yellow');
        log('\n📝 SOLUÇÃO:', 'green');
        log('   1. Verifique se os cookies estão habilitados no browser', 'cyan');
        log('   2. Limpe cookies e cache do browser', 'cyan');
        log('   3. Teste em modo anônimo/privado', 'cyan');
        log('   4. Se persistir, pode ser problema de configuração de domínio na Vercel', 'cyan');
        break;
        
      default:
        log('\n🎯 PROBLEMA: Erro desconhecido', 'yellow');
        log('\n📝 PRÓXIMOS PASSOS:', 'green');
        log('   1. Verifique os logs da Vercel:', 'cyan');
        log('      https://vercel.com/synvolt/golffox/logs', 'cyan');
        log('   2. Procure por mensagens de erro relacionadas', 'cyan');
        log('   3. Verifique se todas as migrações do banco foram aplicadas', 'cyan');
    }
  }
}

// Executar todos os testes
async function runDiagnostics() {
  console.clear();
  
  log('╔════════════════════════════════════════════════════════════════════╗', 'bright');
  log('║       🔍 DIAGNÓSTICO DE LOGIN - GOLFFOX VERCEL                    ║', 'bright');
  log('╚════════════════════════════════════════════════════════════════════╝', 'bright');
  
  log('\n📍 URL do Servidor: https://' + VERCEL_URL, 'cyan');
  log('📧 Email de Teste: ' + TEST_EMAIL, 'cyan');
  log('⏰ Início: ' + new Date().toLocaleString('pt-BR'), 'cyan');
  
  // Executar testes em sequência
  const serverOk = await testServerHealth();
  
  if (!serverOk) {
    logSection('RESULTADO FINAL');
    log('❌ Servidor não está acessível. Verifique:', 'red');
    log('   1. Se a URL está correta: ' + VERCEL_URL, 'yellow');
    log('   2. Se o projeto está deployado na Vercel', 'yellow');
    log('   3. Se não há problemas de DNS ou firewall', 'yellow');
    return;
  }
  
  const { token: csrfToken } = await getCsrfToken();
  
  await testLogin(csrfToken);
  
  logSection('DIAGNÓSTICO CONCLUÍDO');
  log('⏰ Fim: ' + new Date().toLocaleString('pt-BR'), 'cyan');
  log('\n📖 Para mais informações, consulte:', 'cyan');
  log('   docs/auditoria/ANALISE_PROBLEMA_LOGIN_VERCEL.md', 'cyan');
}

// Iniciar diagnóstico
runDiagnostics().catch((error) => {
  log('\n❌ ERRO FATAL NO DIAGNÓSTICO:', 'red');
  log(error.stack, 'red');
  process.exit(1);
});

