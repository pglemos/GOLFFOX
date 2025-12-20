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
  // Sinônimos PT-BR
  'transportadora': 'operador', // transportadora e operador são sinônimos
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
    'operador',
    'transportadora',
    'operador',
    'motorista',
    'passageiro',
  ]
  
  return validRoles.includes(role.toLowerCase().trim())
}
