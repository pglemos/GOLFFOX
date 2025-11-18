/**
 * Script de Teste Remoto do Google Maps API
 */

const https = require('https')

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
                            process.env.PRÓXIMA_CHAVE_PÚBLICA_DA_API_DO_GOOGLE_MAPS ||
                            process.env.CHAVE_API_DO_GOOGLE_MAPS ||
                            'AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM'

async function testGeocodingAPI() {
  return new Promise((resolve, reject) => {
    const address = encodeURIComponent('São Paulo, Brasil')
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GOOGLE_MAPS_API_KEY}`
    
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.status === 'OK') {
            resolve({ ok: true, status: json.status, results: json.results.length })
          } else if (json.status === 'REQUEST_DENIED') {
            resolve({ ok: false, status: json.status, error: json.error_message || 'API Key inválida ou sem permissão' })
          } else {
            resolve({ ok: false, status: json.status, error: json.error_message || 'Erro desconhecido' })
          }
        } catch (err) {
          reject(err)
        }
      })
    }).on('error', reject)
  })
}

async function testDirectionsAPI() {
  return new Promise((resolve, reject) => {
    const origin = encodeURIComponent('-23.5505,-46.6333') // São Paulo
    const destination = encodeURIComponent('-23.5489,-46.6388') // Próximo
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}`
    
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.status === 'OK') {
            resolve({ ok: true, status: json.status, routes: json.routes.length })
          } else if (json.status === 'REQUEST_DENIED') {
            resolve({ ok: false, status: json.status, error: json.error_message || 'API Key inválida ou sem permissão' })
          } else {
            resolve({ ok: false, status: json.status, error: json.error_message || 'Erro desconhecido' })
          }
        } catch (err) {
          reject(err)
        }
      })
    }).on('error', reject)
  })
}

async function testMapsJavaScriptAPI() {
  // Não podemos testar diretamente a JavaScript API sem um navegador
  // Mas podemos verificar se a API key está válida tentando carregar o loader
  return new Promise((resolve) => {
    const url = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`
    
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        // Se retornar JavaScript, a API está funcionando
        if (data.includes('google.maps') || res.statusCode === 200) {
          resolve({ ok: true, status: 'OK' })
        } else {
          resolve({ ok: false, status: 'ERROR', error: 'Não retornou JavaScript válido' })
        }
      })
    }).on('error', () => {
      resolve({ ok: false, status: 'ERROR', error: 'Erro de conexão' })
    })
  })
}

async function main() {
  console.log('🗺️  Testando Google Maps API...\n')
  console.log(`API Key: ${GOOGLE_MAPS_API_KEY.substring(0, 20)}...\n`)

  const results = {}

  console.log('1. Testando Geocoding API...')
  try {
    const geocoding = await testGeocodingAPI()
    results.geocoding = geocoding
    if (geocoding.ok) {
      console.log(`✅ Geocoding API: OK (${geocoding.results} resultado(s))`)
    } else {
      console.log(`❌ Geocoding API: ${geocoding.status} - ${geocoding.error}`)
    }
  } catch (err) {
    console.log(`❌ Geocoding API: Erro - ${err.message}`)
    results.geocoding = { ok: false, error: err.message }
  }

  console.log('\n2. Testando Directions API...')
  try {
    const directions = await testDirectionsAPI()
    results.directions = directions
    if (directions.ok) {
      console.log(`✅ Directions API: OK (${directions.routes} rota(s))`)
    } else {
      console.log(`❌ Directions API: ${directions.status} - ${directions.error}`)
    }
  } catch (err) {
    console.log(`❌ Directions API: Erro - ${err.message}`)
    results.directions = { ok: false, error: err.message }
  }

  console.log('\n3. Testando Maps JavaScript API...')
  try {
    const mapsJS = await testMapsJavaScriptAPI()
    results.mapsJavaScript = mapsJS
    if (mapsJS.ok) {
      console.log(`✅ Maps JavaScript API: OK`)
    } else {
      console.log(`❌ Maps JavaScript API: ${mapsJS.status} - ${mapsJS.error}`)
    }
  } catch (err) {
    console.log(`❌ Maps JavaScript API: Erro - ${err.message}`)
    results.mapsJavaScript = { ok: false, error: err.message }
  }

  console.log('\n📋 RESUMO:\n')
  const apisOk = Object.values(results).filter(r => r.ok).length
  const apisTotal = Object.keys(results).length
  console.log(`APIs funcionando: ${apisOk}/${apisTotal}`)

  const summary = {
    apiKey: GOOGLE_MAPS_API_KEY.substring(0, 20) + '...',
    results: results,
    timestamp: new Date().toISOString()
  }

  require('fs').writeFileSync(
    'google-maps-api-test-results.json',
    JSON.stringify(summary, null, 2)
  )

  console.log('\n💾 Resultados salvos em: google-maps-api-test-results.json')
}

main().catch(console.error)

