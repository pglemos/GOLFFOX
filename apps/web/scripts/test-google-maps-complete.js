/**
 * Script de Teste Completo - Google Maps API
 * Valida todas as funcionalidades implementadas
 */

const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

// Tentar múltiplas fontes de variáveis de ambiente
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 
  || process.env.GOOGLE_MAPS_API_KEY
  || process.env.CHAVE_API_DO_GOOGLE_MAPS
  || process.env.PRÓXIMA_CHAVE_PÚBLICA_DA_API_DO_GOOGLE_MAPS;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const testResults = {
  timestamp: new Date().toISOString(),
  tests: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function logTest(name, status, message = '', details = {}) {
  testResults.tests[name] = {
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  testResults.summary.total++;
  
  if (status === '✅') {
    testResults.summary.passed++;
    console.log(`✅ ${name}: ${message || 'OK'}`);
  } else if (status === '⚠️') {
    testResults.summary.warnings++;
    console.log(`⚠️ ${name}: ${message}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${name}: ${message}`);
  }
}

async function testGeocoding() {
  console.log('\n📍 Testando Geocoding API...');
  
  if (!GOOGLE_MAPS_API_KEY) {
    logTest('Geocoding API Key', '❌', 'API Key não configurada');
    return;
  }

  try {
    const address = 'Av. Paulista, 1000, São Paulo, SP';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results[0]) {
      const location = data.results[0].geometry.location;
      logTest('Geocoding API', '✅', `Endereço geocodificado: ${location.lat}, ${location.lng}`, {
        address,
        lat: location.lat,
        lng: location.lng
      });
    } else {
      logTest('Geocoding API', '❌', `Status: ${data.status}`, data);
    }
  } catch (error) {
    logTest('Geocoding API', '❌', `Erro: ${error.message}`, { error: error.message });
  }
}

async function testReverseGeocoding() {
  console.log('\n📍 Testando Reverse Geocoding API...');
  
  if (!GOOGLE_MAPS_API_KEY) {
    logTest('Reverse Geocoding API Key', '❌', 'API Key não configurada');
    return;
  }

  try {
    // Coordenadas do centro de São Paulo
    const lat = -23.5505;
    const lng = -46.6333;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results[0]) {
      const address = data.results[0].formatted_address;
      logTest('Reverse Geocoding API', '✅', `Endereço: ${address}`, {
        lat,
        lng,
        address
      });
    } else {
      logTest('Reverse Geocoding API', '❌', `Status: ${data.status}`, data);
    }
  } catch (error) {
    logTest('Reverse Geocoding API', '❌', `Erro: ${error.message}`, { error: error.message });
  }
}

async function testDirectionsAPI() {
  console.log('\n📍 Testando Directions API...');
  
  if (!GOOGLE_MAPS_API_KEY) {
    logTest('Directions API Key', '❌', 'API Key não configurada');
    return;
  }

  try {
    const origin = 'Av. Paulista, 1000, São Paulo, SP';
    const destination = 'Av. Faria Lima, 2000, São Paulo, SP';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.routes[0]) {
      const route = data.routes[0];
      const leg = route.legs[0];
      logTest('Directions API', '✅', `Rota calculada: ${(leg.distance.value / 1000).toFixed(2)} km`, {
        distance: leg.distance.value,
        duration: leg.duration.value,
        steps: leg.steps.length
      });
    } else {
      logTest('Directions API', '❌', `Status: ${data.status}`, data);
    }
  } catch (error) {
    logTest('Directions API', '❌', `Erro: ${error.message}`, { error: error.message });
  }
}

async function testDistanceMatrixAPI() {
  console.log('\n📍 Testando Distance Matrix API...');
  
  if (!GOOGLE_MAPS_API_KEY) {
    logTest('Distance Matrix API Key', '❌', 'API Key não configurada');
    return;
  }

  try {
    const origin = '-23.5505,-46.6333'; // Centro de São Paulo
    const destination = '-23.5631,-46.6542'; // Próximo
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&language=pt-BR&units=metric`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
      const element = data.rows[0].elements[0];
      logTest('Distance Matrix API', '✅', `Distância: ${element.distance.text}, Duração: ${element.duration.text}`, {
        distance: element.distance.value,
        duration: element.duration.value
      });
    } else {
      logTest('Distance Matrix API', '❌', `Status: ${data.status}`, data);
    }
  } catch (error) {
    logTest('Distance Matrix API', '❌', `Erro: ${error.message}`, { error: error.message });
  }
}

async function testProximityAPI() {
  console.log('\n📍 Testando API de Proximidade...');
  
  try {
    // Teste básico - verificar se a rota existe
    const testUrl = `${BASE_URL}/api/notifications/check-proximity?tripId=test&routeId=test&vehicleId=test&busLat=-23.5505&busLng=-46.6333`;
    
    const response = await fetch(testUrl);
    const data = await response.json();

    if (response.ok) {
      logTest('Proximity API Route', '✅', 'Rota de API existe e responde', {
        nearby: data.nearby,
        checks: data.checks?.length || 0
      });
    } else {
      logTest('Proximity API Route', '⚠️', `Resposta: ${data.error || 'Erro desconhecido'}`, data);
    }
  } catch (error) {
    // Se não conseguir conectar, pode ser que o servidor não esteja rodando
    logTest('Proximity API Route', '⚠️', `Não foi possível testar (servidor pode não estar rodando): ${error.message}`, {
      error: error.message,
      note: 'Isso é normal se o servidor não estiver rodando localmente'
    });
  }
}

async function testPlacesAPI() {
  console.log('\n📍 Testando Places API (Autocomplete)...');
  
  if (!GOOGLE_MAPS_API_KEY) {
    logTest('Places API Key', '❌', 'API Key não configurada');
    return;
  }

  try {
    // Teste de autocomplete
    const input = 'Av. Paulista';
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR&components=country:br`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.predictions.length > 0) {
      logTest('Places Autocomplete API', '✅', `${data.predictions.length} sugestões encontradas`, {
        input,
        suggestions: data.predictions.length,
        firstSuggestion: data.predictions[0].description
      });
    } else {
      logTest('Places Autocomplete API', '⚠️', `Status: ${data.status}`, {
        status: data.status,
        error_message: data.error_message
      });
    }
  } catch (error) {
    logTest('Places Autocomplete API', '❌', `Erro: ${error.message}`, { error: error.message });
  }
}

async function testMapsJavaScriptAPI() {
  console.log('\n📍 Testando Maps JavaScript API...');
  
  if (!GOOGLE_MAPS_API_KEY) {
    logTest('Maps JavaScript API Key', '❌', 'API Key não configurada');
    return;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    
    const response = await fetch(url);
    const text = await response.text();

    if (response.ok && text.includes('google.maps')) {
      logTest('Maps JavaScript API', '✅', 'Biblioteca carregada com sucesso', {
        libraries: ['places', 'geometry']
      });
    } else {
      logTest('Maps JavaScript API', '❌', 'Falha ao carregar biblioteca', {
        status: response.status
      });
    }
  } catch (error) {
    logTest('Maps JavaScript API', '❌', `Erro: ${error.message}`, { error: error.message });
  }
}

async function runAllTests() {
  console.log('🧪 Iniciando Testes Completos - Google Maps API\n');
  console.log(`API Key: ${GOOGLE_MAPS_API_KEY ? '✅ Configurada' : '❌ Não configurada'}\n`);

  await testGeocoding();
  await testReverseGeocoding();
  await testDirectionsAPI();
  await testDistanceMatrixAPI();
  await testPlacesAPI();
  await testMapsJavaScriptAPI();
  await testProximityAPI();

  console.log('\n📊 RESUMO DOS TESTES:\n');
  console.log(`Total: ${testResults.summary.total}`);
  console.log(`✅ Passou: ${testResults.summary.passed}`);
  console.log(`⚠️ Avisos: ${testResults.summary.warnings}`);
  console.log(`❌ Falhou: ${testResults.summary.failed}`);

  const successRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
  console.log(`\nTaxa de Sucesso: ${successRate}%`);

  // Salvar resultados
  const fs = require('fs');
  const outputPath = path.join(__dirname, 'google-maps-complete-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 Resultados salvos em: ${outputPath}`);

  // Exit code baseado em resultados
  if (testResults.summary.failed > 0) {
    process.exit(1);
  } else if (testResults.summary.warnings > 0) {
    process.exit(0); // Avisos não são críticos
  } else {
    process.exit(0);
  }
}

runAllTests().catch(error => {
  console.error('Erro fatal nos testes:', error);
  process.exit(1);
});

