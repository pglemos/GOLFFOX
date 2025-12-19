/**
 * Mapeamento de roles para unificação de nomenclatura
 * 
 * Mapeia roles antigas (EN) para novas (PT-BR) mantendo compatibilidade
 */

export const ROLE_ALIASES: Record<string, string> = {
  'operator': 'empresa',
  'carrier': 'transportadora',
  'operador': 'transportadora', // operador também mapeia para transportadora
  'driver': 'motorista',
  'passenger': 'passageiro',
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
    // Nomenclatura canônica (PT-BR)
    'admin',
    'empresa',
    'transportadora',
    'motorista',
    'passageiro',
    // Nomenclatura antiga (EN) - para compatibilidade
    'operator',
    'carrier',
    'operador',
    'driver',
    'passenger',
  ]
  
  return validRoles.includes(role.toLowerCase().trim())
}
