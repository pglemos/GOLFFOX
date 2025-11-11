/**
 * Script de teste para validar o fluxo de login e redirecionamento
 * Execute com: node scripts/test-login-flow.js
 */

// Simular a lógica de detecção de role
const ROLE_MAP = [
  { email: 'golffox@admin.com', role: 'admin' },
  { email: 'operador@empresa.com', role: 'operator' },
  { email: 'transportadora@trans.com', role: 'carrier' },
]

function getUserRoleByEmail(email) {
  if (!email) return 'driver'
  const normalized = email.toLowerCase().trim()
  const match = ROLE_MAP.find((entry) => entry.email === normalized)
  return match?.role ?? 'driver'
}

function getRedirectUrl(role) {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'operator':
      return '/operator'
    case 'carrier':
      return '/carrier'
    default:
      return '/dashboard'
  }
}

// Testes
console.log('🧪 Testando fluxo de login e redirecionamento...\n')

// Teste 1: Detecção de role para admin
console.log('Teste 1: Detecção de role para golffox@admin.com')
const adminEmail = 'golffox@admin.com'
const adminRole = getUserRoleByEmail(adminEmail)
console.log(`  Email: ${adminEmail}`)
console.log(`  Role detectado: ${adminRole}`)
console.log(`  ✅ Esperado: admin | Recebido: ${adminRole} | ${adminRole === 'admin' ? 'PASSOU' : 'FALHOU'}\n`)

// Teste 2: URL de redirecionamento para admin
console.log('Teste 2: URL de redirecionamento para admin')
const adminRedirectUrl = getRedirectUrl(adminRole)
console.log(`  Role: ${adminRole}`)
console.log(`  URL de redirecionamento: ${adminRedirectUrl}`)
console.log(`  ✅ Esperado: /admin | Recebido: ${adminRedirectUrl} | ${adminRedirectUrl === '/admin' ? 'PASSOU' : 'FALHOU'}\n`)

// Teste 3: Detecção de role para operador
console.log('Teste 3: Detecção de role para operador@empresa.com')
const operatorEmail = 'operador@empresa.com'
const operatorRole = getUserRoleByEmail(operatorEmail)
console.log(`  Email: ${operatorEmail}`)
console.log(`  Role detectado: ${operatorRole}`)
console.log(`  ✅ Esperado: operator | Recebido: ${operatorRole} | ${operatorRole === 'operator' ? 'PASSOU' : 'FALHOU'}\n`)

// Teste 4: URL de redirecionamento para operador
console.log('Teste 4: URL de redirecionamento para operator')
const operatorRedirectUrl = getRedirectUrl(operatorRole)
console.log(`  Role: ${operatorRole}`)
console.log(`  URL de redirecionamento: ${operatorRedirectUrl}`)
console.log(`  ✅ Esperado: /operator | Recebido: ${operatorRedirectUrl} | ${operatorRedirectUrl === '/operator' ? 'PASSOU' : 'FALHOU'}\n`)

// Teste 5: Email não mapeado (fallback)
console.log('Teste 5: Email não mapeado (fallback para driver)')
const unknownEmail = 'unknown@email.com'
const unknownRole = getUserRoleByEmail(unknownEmail)
console.log(`  Email: ${unknownEmail}`)
console.log(`  Role detectado: ${unknownRole}`)
console.log(`  ✅ Esperado: driver | Recebido: ${unknownRole} | ${unknownRole === 'driver' ? 'PASSOU' : 'FALHOU'}\n`)

// Teste 6: Simulação de cookie base64
console.log('Teste 6: Simulação de criação de cookie')
const userPayload = {
  id: 'test-user-id',
  email: adminEmail,
  role: adminRole,
  accessToken: 'test-token'
}
const cookieValue = Buffer.from(JSON.stringify(userPayload)).toString('base64')
console.log(`  User payload:`, userPayload)
console.log(`  Cookie (base64): ${cookieValue.substring(0, 50)}...`)
console.log(`  ✅ Cookie criado com sucesso: ${cookieValue.length > 0 ? 'PASSOU' : 'FALHOU'}\n`)

// Teste 7: Decodificação de cookie
console.log('Teste 7: Decodificação de cookie')
try {
  const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8')
  const decodedUser = JSON.parse(decoded)
  console.log(`  Cookie decodificado:`, decodedUser)
  console.log(`  ✅ Decodificação bem-sucedida: ${decodedUser.role === adminRole ? 'PASSOU' : 'FALHOU'}\n`)
} catch (error) {
  console.log(`  ❌ Erro ao decodificar cookie: ${error.message}\n`)
}

console.log('✅ Todos os testes concluídos!')

