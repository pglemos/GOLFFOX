/**
 * Validação de variáveis de ambiente
 * Exibe banner apenas em desenvolvimento
 */

interface EnvValidation {
  isValid: boolean
  missing: string[]
  invalid: Array<{ key: string; reason: string }>
}

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
] as const

const OPTIONAL_ENV_VARS = [
  'RESEND_API_KEY',
  'REPORTS_FROM_EMAIL',
  'REPORTS_BCC',
  'NEXT_PUBLIC_BASE_URL',
] as const

/**
 * Valida formato da URL do Supabase
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

/**
 * Valida formato da API Key do Supabase
 */
function isValidSupabaseKey(key: string | undefined): boolean {
  if (!key) return false
  // API Key do Supabase geralmente começa com 'eyJ' (JWT) e tem mais de 100 caracteres
  return key.startsWith('eyJ') && key.length > 100
}

/**
 * Valida formato da API Key do Google Maps
 */
function isValidGoogleMapsKey(key: string | undefined): boolean {
  if (!key) return false
  // API Key do Google Maps geralmente começa com 'AIza' e tem mais de 35 caracteres
  return key.startsWith('AIza') && key.length > 35
}

/**
 * Valida formato de email
 */
function isValidEmail(email: string | undefined): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida todas as variáveis de ambiente
 */
export function validateEnv(): EnvValidation {
  const missing: string[] = []
  const invalid: Array<{ key: string; reason: string }> = []

  // Atenção: em componentes client, acessos dinâmicos a process.env (ex: process.env[key])
  // não são substituídos pelo bundler do Next. Precisamos referenciar explicitamente.
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    REPORTS_FROM_EMAIL: process.env.REPORTS_FROM_EMAIL,
    REPORTS_BCC: process.env.REPORTS_BCC,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  }

  // Validar variáveis obrigatórias
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  } else if (!isValidSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL)) {
    invalid.push({ key: 'NEXT_PUBLIC_SUPABASE_URL', reason: 'URL do Supabase inválida' })
  }

  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  } else if (!isValidSupabaseKey(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    invalid.push({ key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', reason: 'API Key do Supabase inválida' })
  }

  if (!env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    missing.push('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
  } else if (!isValidGoogleMapsKey(env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)) {
    invalid.push({ key: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', reason: 'API Key do Google Maps inválida' })
  }

  // Validar variáveis opcionais (apenas se definidas)
  if (env.REPORTS_FROM_EMAIL && !isValidEmail(env.REPORTS_FROM_EMAIL)) {
    invalid.push({ key: 'REPORTS_FROM_EMAIL', reason: 'Email inválido' })
  }
  if (env.REPORTS_BCC && !isValidEmail(env.REPORTS_BCC)) {
    invalid.push({ key: 'REPORTS_BCC', reason: 'Email BCC inválido' })
  }
  if (env.NEXT_PUBLIC_BASE_URL) {
    try {
      new URL(env.NEXT_PUBLIC_BASE_URL)
    } catch {
      invalid.push({ key: 'NEXT_PUBLIC_BASE_URL', reason: 'URL base inválida' })
    }
  }

  return {
    isValid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  }
}

/**
 * Obtém valores validados das variáveis de ambiente
 */
export function getEnvVars() {
  const validation = validateEnv()
  
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    reportsFromEmail: process.env.REPORTS_FROM_EMAIL || '',
    reportsBcc: process.env.REPORTS_BCC || '',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
    validation,
  }
}

/**
 * Verifica se está em modo desenvolvimento
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

