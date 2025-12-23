/**
 * Mapeamento de roles para unificação de nomenclatura
 * 
 * Mapeia roles antigas para novas mantendo compatibilidade temporária
 * Atualizado em 2025-01-29: empresa → gestor_empresa, operador → gestor_transportadora
 */

export const ROLE_ALIASES: Record<string, string> = {
  // Compatibilidade: roles antigas → novas
  'empresa': 'gestor_empresa',
  'operador': 'gestor_transportadora',
  'transportadora': 'gestor_transportadora', // transportadora consolidada em gestor_transportadora
  // Novos roles (sem mapeamento necessário)
  'gestor_empresa': 'gestor_empresa',
  'gestor_transportadora': 'gestor_transportadora',
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
 * Verifica se role é válida (suporta novas e antigas nomenclaturas durante transição)
 */
export function isValidRole(role: string): boolean {
  const validRoles = [
    'admin',
    // Novos roles
    'gestor_empresa',
    'gestor_transportadora',
    'motorista',
    'passageiro',
    // Compatibilidade temporária (remover após período de transição)
    'empresa',
    'operador',
    'transportadora',
  ]

  return validRoles.includes(role.toLowerCase().trim())
}
