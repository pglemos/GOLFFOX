#!/usr/bin/env node

const https = require('https');

const EMAIL = 'golffox@admin.com';
const PASSWORD = 'senha123';
const BASE_URL = 'golffox.vercel.app';

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║     🧪 TESTE FINAL - GOLFFOX VERCEL                               ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: BASE_URL,
      port: 443,
      path,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000,
    };

    const req = https.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          json: () => {
            try { return JSON.parse(body); } catch { return null; }
          }
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function test() {
  try {
    // Teste 1: Health Check
    console.log('📋 TESTE 1: Health Check');
    const health = await makeRequest('/api/health');
    const healthData = health.json();

    if (health.status === 200 && healthData.status === 'ok') {
      console.log('✅ Servidor online');
      console.log('✅ Supabase:', healthData.supabase);
    } else {
      console.log('❌ Servidor com problemas');
      return;
    }

    console.log('');

    // Teste 2: CSRF
    console.log('📋 TESTE 2: CSRF Token');
    const csrf = await makeRequest('/api/auth/csrf');
    const csrfData = csrf.json();
    const token = csrfData?.csrfToken || csrfData?.token;

    if (token) {
      console.log('✅ CSRF token obtido:', token.substring(0, 20) + '...');
    } else {
      console.log('❌ Falha ao obter CSRF token');
      return;
    }

    console.log('');

    // Teste 3: Login
    console.log('📋 TESTE 3: Login');
    console.log('📧 Email:', EMAIL);
    console.log('🔑 Senha: ********');

    const body = JSON.stringify({ email: EMAIL, password: PASSWORD });
    const login = await makeRequest('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token,
        'Content-Length': body.length
      },
      body
    });

    const loginData = login.json();

    console.log('📊 Status:', login.status);
    console.log('');

    if (login.status === 200 && loginData.token) {
      console.log('✅ LOGIN BEM-SUCEDIDO!');
      console.log('✅ Token recebido:', loginData.token.substring(0, 30) + '...');
      console.log('✅ Usuário:', loginData.user?.email);
      console.log('✅ Role:', loginData.user?.role);
      console.log('');
      console.log('╔════════════════════════════════════════════════════════════════════╗');
      console.log('║                    🎉 SISTEMA 100% FUNCIONAL! 🎉                  ║');
      console.log('╚════════════════════════════════════════════════════════════════════╝');
      console.log('');
      console.log('📊 Resultado Final:');
      console.log('✅ CSRF: Corrigido');
      console.log('✅ Supabase: Configurado e funcionando');
      console.log('✅ Login: Funcionando perfeitamente');
      console.log('');
      console.log('🌐 Acesse: https://golffox.vercel.app');

    } else {
      console.log('❌ LOGIN FALHOU');
      console.log('Erro:', loginData?.error || 'Erro desconhecido');
      console.log('Código:', loginData?.code || 'N/A');
      console.log('');

      if (loginData?.code === 'user_not_in_db') {
        console.log('💡 SOLUÇÃO: Usuário não existe na tabela users do Supabase');
        console.log('Execute no Supabase SQL Editor:');
        console.log('');
        console.log('SELECT id, email FROM auth.users WHERE email = \'' + EMAIL + '\';');
        console.log('');
        console.log('INSERT INTO public.users (id, email, role, is_active, created_at, updated_at)');
        console.log('VALUES (\'ID_DO_AUTH_USERS\', \'' + EMAIL + '\', \'admin\', true, NOW(), NOW())');
        console.log('ON CONFLICT (id) DO UPDATE SET is_active = true;');
      }
    }

  } catch (error) {
    console.log('❌ ERRO:', error.message);
  }
}

test();

