import common from '@/i18n/common.json'
import operator from '@/i18n/operator.json'
import admin from '@/i18n/admin.json'

type Namespace = 'common' | 'operator' | 'admin'

// Aceitar objetos aninhados vindos dos JSONs
const dictionaries: Record<Namespace, Record<string, unknown>> = {
  common: common as Record<string, unknown>,
  operator: operator as Record<string, unknown>,
  admin: admin as Record<string, unknown>,
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

export type I18nKey = { ns: Namespace; key: string; params?: Record<string, string | number> }

