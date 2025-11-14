// Test script para verificar rate limiting
const axios = require('axios');

async function testRateLimit() {
  const url = 'http://localhost:3000/api/auth/login';
  
  console.log('Testing rate limiting on login endpoint...');
  
  // Fazer 6 requests rápidos (limite é 5 por minuto)
  for (let i = 1; i <= 6; i++) {
    try {
      console.log(`Request ${i}...`);
      const response = await axios.post(url, {
        email: 'test@example.com',
        password: 'wrongpassword'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'test-csrf-token'
        },
        validateStatus: () => true // Não jogar erro em status 4xx/5xx
      });
      
      console.log(`Response ${i}: Status ${response.status}`);
      
      if (response.status === 429) {
        console.log('✅ Rate limiting is working! Got 429 Too Many Requests');
        console.log('Headers:', {
          'X-RateLimit-Limit': response.headers['x-ratelimit-limit'],
          'X-RateLimit-Remaining': response.headers['x-ratelimit-remaining'],
          'Retry-After': response.headers['retry-after']
        });
        break;
      }
      
    } catch (error) {
      console.error(`Request ${i} failed:`, error.message);
    }
    
    // Pequeno delay entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Testar cookie httpOnly
async function testCookieSecurity() {
  console.log('\nTesting cookie security...');
  
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@golffox.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': 'test-csrf-token'
      },
      validateStatus: () => true
    });
    
    console.log('Login response status:', response.status);
    
    // Verificar headers Set-Cookie
    const setCookieHeaders = response.headers['set-cookie'];
    if (setCookieHeaders) {
      console.log('Set-Cookie headers found:', setCookieHeaders.length);
      setCookieHeaders.forEach((header, index) => {
        console.log(`Cookie ${index + 1}:`, header);
        
        // Verificar atributos de segurança
        const hasHttpOnly = header.toLowerCase().includes('httponly');
        const hasSameSiteStrict = header.toLowerCase().includes('samesite=strict');
        const hasSecure = header.toLowerCase().includes('secure');
        
        console.log(`  - HttpOnly: ${hasHttpOnly ? '✅' : '❌'}`);
        console.log(`  - SameSite=Strict: ${hasSameSiteStrict ? '✅' : '❌'}`);
        console.log(`  - Secure: ${hasSecure ? '✅' : '❌'}`);
      });
    }
    
  } catch (error) {
    console.error('Cookie test failed:', error.message);
  }
}

// Executar testes
async function runTests() {
  await testRateLimit();
  await testCookieSecurity();
  console.log('\n✅ Security tests completed!');
}

runTests().catch(console.error);