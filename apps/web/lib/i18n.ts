import common from '@/i18n/common.json'
import operador from '@/i18n/operador.json'
import admin from '@/i18n/admin.json'
import transportadora from '@/i18n/transportadora.json'
import ptBR from '@/i18n/pt-BR.json'
import enUS from '@/i18n/en-US.json'

type Namespace = 'common' | 'operador' | 'admin' | 'transportadora'

type Locale = 'pt-BR' | 'en-US'

// Aceitar objetos aninhados vindos dos JSONs
const dictionaries: Record<Namespace, Record<string, unknown>> = {
  common: common as Record<string, unknown>,
  operator: operator as Record<string, unknown>,
  admin: admin as Record<string, unknown>,
  transportadora: transportadora as Record<string, unknown>,
}

// Dicionários por locale (para expansão futura)
const localeDictionaries: Record<Locale, Record<string, unknown>> = {
  'pt-BR': ptBR as Record<string, unknown>,
  'en-US': enUS as Record<string, unknown>,
}

// Detectar locale do navegador ou usar padrão
function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const browserLocale = navigator.language || 'pt-BR'
    return browserLocale.startsWith('en') ? 'en-US' : 'pt-BR'
  }
  return 'pt-BR'
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return Object.keys(params).reduce((acc, key) => {
    const value = String(params[key])
    return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }, template)
}

function resolveKey(dict: Record<string, unknown>, key: string): unknown {
  // Suporta dot-path: ex. "success.exportGenerated"
  return key.split('.').reduce<unknown>((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, dict)
}

export function t(ns: Namespace, key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[ns]
  const found = resolveKey(dict, key)
  const text = typeof found === 'string' ? found : key
  return interpolate(text, params)
}

/**
 * Tradução com suporte a locale
 */
export function translate(key: string, locale?: Locale, params?: Record<string, string | number>): string {
  const currentLocale = locale || getLocale()
  const dict = localeDictionaries[currentLocale]
  const found = resolveKey(dict, key)
  const text = typeof found === 'string' ? found : key
  return interpolate(text, params)
}

export type I18nKey = { ns: Namespace; key: string; params?: Record<string, string | number> }

export { getLocale }
export type { Locale, Namespace }

