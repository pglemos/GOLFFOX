export interface RoleMapping {
  email: string
  role: string
}

const ROLE_MAP: RoleMapping[] = [
  // Conjunto principal (PT-BR) - Novo modelo de domínio
  { email: 'golffox@admin.com', role: 'admin' },
  { email: 'teste@empresa.com', role: 'empresa' },       // Gestor/Admin da Empresa Contratante
  { email: 'operador@empresa.com', role: 'empresa' },    // Antigo role operator → agora empresa
  { email: 'transportadora@trans.com', role: 'operador' }, // Antigo carrier → agora operador
  { email: 'teste@transportadora.com', role: 'operador' },
  { email: 'motorista@trans.com', role: 'motorista' },   // Antigo driver → agora motorista
  { email: 'passageiro@empresa.com', role: 'passageiro' }, // Antigo passenger → agora passageiro

  // Conjunto alternativo (inglês) - Mapeamento para novas roles PT-BR
  { email: 'admin@golffox.com', role: 'admin' },
  { email: 'operator@golffox.com', role: 'empresa' },    // operator → empresa
  { email: 'carrier@golffox.com', role: 'operador' },    // carrier → operador
  { email: 'driver@golffox.com', role: 'motorista' },    // driver → motorista

  // Variantes antigas (compatibilidade)
  { email: 'transportadora@golffox.com', role: 'operador' },
  { email: 'operador@golffox.com', role: 'empresa' },
]

export function getUserRoleByEmail(email: string): string {
  if (!email) return 'passageiro' // Default para passageiro
  const normalized = email.toLowerCase().trim()
  const match = ROLE_MAP.find((entry) => entry.email === normalized)
  return match?.role ?? 'passageiro'
}
