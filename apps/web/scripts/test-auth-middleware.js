#!/usr/bin/env node

/**
 * Script de teste para validar autenticação do middleware
 * Testa se o middleware valida tokens corretamente
 */

const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

function testRoute(route, description) {
  return new Promise((resolve) => {
    const url = new URL(route, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'GolfFox-Auth-Test/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const isRedirect = res.statusCode >= 300 && res.statusCode < 400;
        const location = res.headers.location || '';
        const hasCookie = res.headers['set-cookie']?.some(c => c.includes('golffox-session'));
        
        console.log(`\n${description}`);
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Redirect: ${isRedirect ? '✅' : '❌'} ${location}`);
        console.log(`  Cookie Set: ${hasCookie ? '✅' : '❌'}`);
        
        resolve({
          status: res.statusCode,
          isRedirect,
          location,
          hasCookie
        });
      });
    });

    req.on('error', (err) => {
      console.error(`\n${description}`);
      console.error(`  Erro: ${err.message}`);
      resolve({ error: err.message });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testando Middleware de Autenticação\n');
  console.log(`URL Base: ${BASE_URL}\n`);

  // Teste 1: Rota protegida sem autenticação
  await testRoute('/admin', 'Teste 1: /admin sem autenticação');
  
  // Teste 2: Rota protegida com cookie forjado
  const test2 = new Promise((resolve) => {
    const url = new URL('/admin', BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Cookie': 'golffox-session=dGVzdA==', // base64 de "test"
        'User-Agent': 'GolfFox-Auth-Test/1.0'
      }
    };

    const req = http.request(options, (res) => {
      const isRedirect = res.statusCode >= 300 && res.statusCode < 400;
      console.log(`\nTeste 2: /admin com cookie forjado`);
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Deve redirecionar: ${isRedirect ? '✅' : '❌'}`);
      resolve();
    });

    req.on('error', (err) => {
      console.error(`\nTeste 2: Erro - ${err.message}`);
      resolve();
    });

    req.end();
  });
  await test2;

  // Teste 3: Rota pública (raiz)
  await testRoute('/', 'Teste 3: / (raiz - pública)');

  // Teste 4: Rota de API (bypass)
  await testRoute('/api/health', 'Teste 4: /api/health (bypass middleware)');

  console.log('\n✅ Testes concluídos!');
  console.log('\nNotas:');
  console.log('- Rotas protegidas devem redirecionar (307/308) sem autenticação');
  console.log('- Cookie forjado deve ser rejeitado');
  console.log('- Rotas públicas e APIs devem funcionar normalmente');
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testRoute };

