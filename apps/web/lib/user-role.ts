export interface RoleMapping {
  email: string
  role: string
}

const ROLE_MAP: RoleMapping[] = [
  // Conjunto principal (PT-BR) - Novo modelo de domínio
  { email: 'golffox@admin.com', role: 'admin' },
  { email: 'teste@empresa.com', role: 'empresa' },       // Gestor/Admin da Empresa Contratante
  { email: 'operador@empresa.com', role: 'empresa' },    // Antigo role operador → agora empresa
  { email: 'transportadora@trans.com', role: 'operador' }, // Antigo transportadora → agora operador
  { email: 'teste@transportadora.com', role: 'operador' },
  { email: 'motorista@trans.com', role: 'motorista' },   // Antigo motorista → agora motorista
  { email: 'passageiro@empresa.com', role: 'passageiro' }, // Antigo passageiro → agora passageiro

  // Conjunto alternativo (inglês) - Mapeamento para novas roles PT-BR
  { email: 'admin@golffox.com', role: 'admin' },
  { email: 'operador@golffox.com', role: 'empresa' },    // operador → empresa
  { email: 'transportadora@golffox.com', role: 'operador' },    // transportadora → operador
  { email: 'motorista@golffox.com', role: 'motorista' },    // motorista → motorista

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
