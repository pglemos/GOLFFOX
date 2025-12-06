/**
 * Script para verificar o status do build no Vercel
 * 
 * Este script tenta verificar o status do último deployment no Vercel
 * usando a API do Vercel (requer VERCEL_TOKEN)
 */

const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ID = 'prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m';
const TEAM_ID = 'team_9kUTSaoIkwnAVxy9nXMcAnej';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

if (!VERCEL_TOKEN) {
  console.log('⚠️  VERCEL_TOKEN não encontrado nas variáveis de ambiente.');
  console.log('   Para usar este script, defina VERCEL_TOKEN:');
  console.log('   export VERCEL_TOKEN=seu_token_aqui');
  console.log('\n   Ou acesse manualmente: https://vercel.com/synvolt/golffox');
  process.exit(0);
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`Erro ao parsear resposta: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function checkDeployments() {
  try {
    console.log('🔍 Verificando deployments no Vercel...\n');
    
    const path = `/v6/deployments?projectId=${PROJECT_ID}&limit=1`;
    const deployments = await makeRequest(path);
    
    if (deployments.deployments && deployments.deployments.length > 0) {
      const latest = deployments.deployments[0];
      
      console.log('📦 Último Deployment:');
      console.log(`   URL: ${latest.url}`);
      console.log(`   Status: ${latest.readyState}`);
      console.log(`   Criado em: ${new Date(latest.createdAt).toLocaleString()}`);
      console.log(`   Build ID: ${latest.uid}`);
      
      if (latest.readyState === 'READY') {
        console.log('\n✅ Build concluído com sucesso!');
        console.log(`   Acesse: https://${latest.url}`);
      } else if (latest.readyState === 'ERROR') {
        console.log('\n❌ Build falhou!');
        console.log('   Verifique os logs em: https://vercel.com/synvolt/golffox');
      } else {
        console.log(`\n⏳ Build em andamento... (${latest.readyState})`);
        console.log('   Acompanhe em: https://vercel.com/synvolt/golffox');
      }
    } else {
      console.log('⚠️  Nenhum deployment encontrado.');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar deployments:', error.message);
    console.log('\n💡 Acesse manualmente: https://vercel.com/synvolt/golffox');
  }
}

checkDeployments();

