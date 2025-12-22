/**
 * Script de diagnóstico para acesso à página /admin
 * Executa: node scripts/diagnose-admin-access.js
 */

const http = require('http');
const https = require('https');

const PORT = 3000;
const HOST = 'localhost';

function makeRequest(path, cookies = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies,
        'User-Agent': 'GolfFox-Diagnostic/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function diagnose() {
  console.log('🔍 Diagnóstico de Acesso à Página /admin\n');
  console.log('='.repeat(60));
  console.log('\n');

  try {
    // 1. Testar API /api/auth/me sem cookies
    console.log('1️⃣ Testando API /api/auth/me (sem cookies)...');
    try {
      const meResponse = await makeRequest('/api/auth/me');
      console.log(`   Status: ${meResponse.status}`);
      try {
        const json = JSON.parse(meResponse.body);
        console.log(`   Resposta: ${JSON.stringify(json, null, 2)}`);
      } catch (e) {
        console.log(`   Resposta (texto): ${meResponse.body.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('\n');

    // 2. Testar acesso à página /admin sem cookies
    console.log('2️⃣ Testando acesso à página /admin (sem cookies)...');
    try {
      const adminResponse = await makeRequest('/admin');
      console.log(`   Status: ${adminResponse.status}`);
      console.log(`   Location: ${adminResponse.headers.location || 'N/A'}`);
      console.log(`   Content-Type: ${adminResponse.headers['content-type'] || 'N/A'}`);
      if (adminResponse.status === 302 || adminResponse.status === 307) {
        console.log(`   ⚠️ Redirecionamento detectado para: ${adminResponse.headers.location}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('\n');

    // 3. Testar com cookie golffox-session (se fornecido)
    const cookieArg = process.argv[2];
    if (cookieArg) {
      console.log('3️⃣ Testando com cookie golffox-session...');
      try {
        const meWithCookie = await makeRequest('/api/auth/me', cookieArg);
        console.log(`   Status: ${meWithCookie.status}`);
        try {
          const json = JSON.parse(meWithCookie.body);
          console.log(`   Resposta: ${JSON.stringify(json, null, 2)}`);
          if (json.success && json.user) {
            console.log(`   ✅ Usuário autenticado: ${json.user.email} (${json.user.role})`);
          }
        } catch (e) {
          console.log(`   Resposta (texto): ${meWithCookie.body.substring(0, 200)}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
      console.log('\n');
    } else {
      console.log('3️⃣ Pulei teste com cookie (forneça como argumento: node diagnose-admin-access.js "golffox-session=...")');
      console.log('\n');
    }

    // 4. Verificar se servidor está rodando
    console.log('4️⃣ Verificando se servidor está rodando...');
    try {
      const healthCheck = await makeRequest('/');
      console.log(`   ✅ Servidor respondendo (Status: ${healthCheck.status})`);
    } catch (error) {
      console.log(`   ❌ Servidor não está respondendo: ${error.message}`);
      console.log(`   💡 Certifique-se de que o servidor está rodando: npm run dev`);
    }
    console.log('\n');

    console.log('='.repeat(60));
    console.log('\n✅ Diagnóstico concluído!\n');

  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error);
    process.exit(1);
  }
}

diagnose();

