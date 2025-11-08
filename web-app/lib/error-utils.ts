// Utilitários de formatação e normalização de erros

export type SupabaseLikeError = {
  message?: string
  code?: string
  details?: unknown
  hint?: unknown
} | any

// Extrai uma mensagem segura de qualquer objeto de erro
export function formatError(error: any): string {
  if (!error) return 'Erro desconhecido'
  const e = (error as any).error ?? error
  if (typeof e === 'string') return e
  if (typeof e?.message === 'string' && e.message.length > 0) return e.message
  try {
    return JSON.stringify(e)
  } catch {
    return String(e)
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

