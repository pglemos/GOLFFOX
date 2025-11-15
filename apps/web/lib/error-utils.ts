// Utilitários de formatação e normalização de erros

export type SupabaseLikeError = {
  message?: string
  code?: string
  details?: unknown
  hint?: unknown
} | any

// Extrai uma mensagem segura de qualquer objeto de erro
export function formatError(error: any, fallbackMessage?: string): string {
  if (!error) return fallbackMessage || 'Erro desconhecido'
  const e = (error as any).error ?? error
  if (typeof e === 'string') return e || (fallbackMessage || 'Erro desconhecido')
  if (typeof e?.message === 'string' && e.message.length > 0) return e.message
  try {
    const s = JSON.stringify(e)
    return s && s.length > 0 ? s : (fallbackMessage || 'Erro desconhecido')
  } catch {
    const s = String(e)
    return s && s.length > 0 ? s : (fallbackMessage || 'Erro desconhecido')
  }
}

// Retorna metadados seguros (evita acesso a propriedades inexistentes)
export function getErrorMeta(error: SupabaseLikeError): Record<string, unknown> {
  const e: any = (error as any)?.error ?? error
  const meta: Record<string, unknown> = {}
  if (typeof e?.message === 'string') meta.message = e.message
  if (typeof e?.code === 'string') meta.code = e.code
  if (e?.details !== undefined) meta.details = e.details
  if (e?.hint !== undefined) meta.hint = e.hint
  return meta
}
