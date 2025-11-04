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

  // Validar variáveis obrigatórias
  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key]
    if (!value) {
      missing.push(key)
    } else {
      // Validações específicas
      if (key === 'NEXT_PUBLIC_SUPABASE_URL' && !isValidSupabaseUrl(value)) {
        invalid.push({ key, reason: 'URL do Supabase inválida' })
      }
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && !isValidSupabaseKey(value)) {
        invalid.push({ key, reason: 'API Key do Supabase inválida' })
      }
      if (key === 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY' && !isValidGoogleMapsKey(value)) {
        invalid.push({ key, reason: 'API Key do Google Maps inválida' })
      }
    }
  }

  // Validar variáveis opcionais (apenas se definidas)
  for (const key of OPTIONAL_ENV_VARS) {
    const value = process.env[key]
    if (value) {
      if (key === 'REPORTS_FROM_EMAIL' && !isValidEmail(value)) {
        invalid.push({ key, reason: 'Email inválido' })
      }
      if (key === 'REPORTS_BCC' && !isValidEmail(value)) {
        invalid.push({ key, reason: 'Email BCC inválido' })
      }
      if (key === 'NEXT_PUBLIC_BASE_URL') {
        try {
          new URL(value)
        } catch {
          invalid.push({ key, reason: 'URL base inválida' })
        }
      }
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

