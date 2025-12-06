/**
 * Script para obter logs detalhados do build no Vercel
 */

const https = require('https');

const PROJECT_ID = 'prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m';
const TEAM_ID = 'team_9kUTSaoIkwnAVxy9nXMcAnej';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'V8FJoSMM3um4TfU05Y19PwFa';

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
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function getLatestDeployment() {
  try {
    const path = `/v6/deployments?projectId=${PROJECT_ID}&limit=1&teamId=${TEAM_ID}`;
    const result = await makeRequest(path);
    
    if (result.status === 200 && result.data.deployments && result.data.deployments.length > 0) {
      return result.data.deployments[0];
    }
    return null;
  } catch (error) {
    console.error('Erro ao obter deployment:', error.message);
    return null;
  }
}

async function getBuildLogs(deploymentId) {
  try {
    const path = `/v2/deployments/${deploymentId}/events?teamId=${TEAM_ID}`;
    const result = await makeRequest(path);
    
    if (result.status === 200) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Erro ao obter logs:', error.message);
    return null;
  }
}

async function main() {
  console.log('🔍 Verificando último deployment no Vercel...\n');
  
  const deployment = await getLatestDeployment();
  
  if (!deployment) {
    console.log('❌ Nenhum deployment encontrado.');
    return;
  }
  
  console.log('📦 Deployment encontrado:');
  console.log(`   ID: ${deployment.uid}`);
  console.log(`   URL: ${deployment.url || 'N/A'}`);
  console.log(`   Status: ${deployment.readyState}`);
  console.log(`   Criado: ${new Date(deployment.createdAt).toLocaleString()}`);
  console.log(`   Build ID: ${deployment.buildId || 'N/A'}`);
  
  if (deployment.readyState === 'ERROR') {
    console.log('\n❌ Build falhou! Obtendo logs...\n');
    
    const logs = await getBuildLogs(deployment.uid);
    if (logs && logs.length > 0) {
      console.log('📋 Logs do Build:\n');
      logs.forEach(event => {
        if (event.type === 'stdout' || event.type === 'stderr') {
          console.log(event.payload);
        }
      });
    } else {
      console.log('⚠️  Logs não disponíveis via API.');
      console.log(`   Acesse: https://vercel.com/synvolt/golffox/${deployment.uid}`);
    }
  } else if (deployment.readyState === 'READY') {
    console.log('\n✅ Build concluído com sucesso!');
    console.log(`   URL: https://${deployment.url}`);
  } else {
    console.log(`\n⏳ Build em andamento... (${deployment.readyState})`);
    console.log(`   Acompanhe: https://vercel.com/synvolt/golffox/${deployment.uid}`);
  }
}

main();

