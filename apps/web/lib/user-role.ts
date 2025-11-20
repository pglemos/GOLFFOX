export interface RoleMapping {
  email: string
  role: string
}

const ROLE_MAP: RoleMapping[] = [
  // Conjunto principal (PT-BR)
  { email: 'golffox@admin.com', role: 'admin' },
  { email: 'operador@empresa.com', role: 'operator' },
  { email: 'transportadora@trans.com', role: 'carrier' },
  { email: 'motorista@trans.com', role: 'driver' },
  { email: 'passageiro@empresa.com', role: 'passenger' },
  { email: 'teste@transportadora.com', role: 'carrier' },

  // Conjunto alternativo (inglês)
  { email: 'admin@golffox.com', role: 'admin' },
  { email: 'operator@golffox.com', role: 'operator' },
  { email: 'carrier@golffox.com', role: 'carrier' },
  { email: 'driver@golffox.com', role: 'driver' },

  // Variantes antigas
  { email: 'transportadora@golffox.com', role: 'carrier' },
  { email: 'operador@golffox.com', role: 'operator' },
]

export function getUserRoleByEmail(email: string): string {
  if (!email) return 'driver'
  const normalized = email.toLowerCase().trim()
  const match = ROLE_MAP.find((entry) => entry.email === normalized)
  return match?.role ?? 'driver'
}

