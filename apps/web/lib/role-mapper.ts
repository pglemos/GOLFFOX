/**
 * Mapeamento de roles para unificação de nomenclatura
 * 
 * Mapeia roles antigas (EN) para novas (PT-BR) mantendo compatibilidade
 */

export const ROLE_ALIASES: Record<string, string> = {
  // Mapeamento EN → PT-BR
  'operador': 'empresa',
  'transportadora': 'operador', // transportadora → operador (gestor da transportadora)
  'motorista': 'motorista',
  'passageiro': 'passageiro',
}

/**
 * Normaliza role para nomenclatura canônica (PT-BR)
 */
export function normalizeRole(role: string): string {
  if (!role) return 'passageiro' // Default

  const normalized = role.toLowerCase().trim()
  return ROLE_ALIASES[normalized] || normalized
}

/**
 * Verifica se role é válida (suporta ambas nomenclaturas)
 */
export function isValidRole(role: string): boolean {
  const validRoles = [
    'admin',
    'empresa',
    'transportadora',
    'operador',
    'motorista',
    'passageiro',
  ]

  return validRoles.includes(role.toLowerCase().trim())
}
