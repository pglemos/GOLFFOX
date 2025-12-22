/**
 * Script para testar a API /api/auth/me
 * Executa: node scripts/test-auth-me.js
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/me',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Cookie': process.argv[2] || '' // Passar cookie como argumento: node test-auth-me.js "golffox-session=..."
  }
};

console.log('🔍 Testando API /api/auth/me...\n');
console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('Headers:', JSON.stringify(options.headers, null, 2));
console.log('\n---\n');

const req = http.request(options, (res) => {
  let data = '';

  console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  console.log('\n---\n');

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Resposta JSON:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Resposta (texto):');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Erro na requisição: ${e.message}`);
});

req.end();

