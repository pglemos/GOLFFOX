export interface RoleMapping {
  email: string
  role: string
}

const ROLE_MAP: RoleMapping[] = [
  // Conjunto principal - Atualizado em 2025-01-29
  { email: 'golffox@admin.com', role: 'admin' },
  { email: 'teste@empresa.com', role: 'gestor_empresa' },       // Gestor da Empresa Contratante
  { email: 'operador@empresa.com', role: 'gestor_empresa' },    // Compatibilidade: antigo operador → gestor_empresa
  { email: 'transportadora@trans.com', role: 'gestor_transportadora' }, // Gestor da Transportadora
  { email: 'teste@transportadora.com', role: 'gestor_transportadora' },
  { email: 'motorista@trans.com', role: 'motorista' },
  { email: 'passageiro@empresa.com', role: 'passageiro' },

  // Conjunto alternativo - Atualizado
  { email: 'admin@golffox.com', role: 'admin' },
  { email: 'operador@golffox.com', role: 'gestor_transportadora' },    // operador → gestor_transportadora
  { email: 'transportadora@golffox.com', role: 'gestor_transportadora' },    // transportadora → gestor_transportadora
  { email: 'motorista@golffox.com', role: 'motorista' },

  // Variantes antigas (compatibilidade temporária)
  { email: 'empresa@test.com', role: 'gestor_empresa' },
]

export function getUserRoleByEmail(email: string): string {
  if (!email) return 'passageiro' // Default para passageiro
  const normalized = email.toLowerCase().trim()
  const match = ROLE_MAP.find((entry) => entry.email === normalized)
  return match?.role ?? 'passageiro'
}
