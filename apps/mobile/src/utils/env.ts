/**
 * Validação de variáveis de ambiente para Mobile
 */

function isValidSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname.includes('supabase')
  } catch {
    return false
  }
}

function isValidSupabaseKey(key: string | undefined): boolean {
  if (!key) return false
  // API Key do Supabase geralmente começa com 'eyJ' (JWT) e tem mais de 100 caracteres
  return key.startsWith('eyJ') && key.length > 100
}

/**
 * Valida variáveis de ambiente obrigatórias
 * @throws Error se alguma variável obrigatória estiver faltando ou inválida
 */
export function validateEnv(): void {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL não configurado')
  }

  if (!isValidSupabaseUrl(supabaseUrl)) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL inválida')
  }

  if (!supabaseAnonKey) {
    throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY não configurado')
  }

  if (!isValidSupabaseKey(supabaseAnonKey)) {
    throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY inválida')
  }
}

/**
 * Obtém URL do Supabase validada
 * @throws Error se não configurado ou inválido
 */
export function getSupabaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL não configurado')
  }
  if (!isValidSupabaseUrl(url)) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL inválida')
  }
  return url
}

/**
 * Obtém chave anon do Supabase validada
 * @throws Error se não configurado ou inválido
 */
export function getSupabaseAnonKey(): string {
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY não configurado')
  }
  if (!isValidSupabaseKey(key)) {
    throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY inválida')
  }
  return key
}

