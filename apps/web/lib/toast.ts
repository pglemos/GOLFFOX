import toast from 'react-hot-toast'

import { formatError } from '@/lib/error-utils'
import { t, type I18nKey } from '@/lib/i18n'

type ToastOptions = {
  id?: string
  duration?: number
  // Permitir extensão futura sem travar tipos
  [key: string]: unknown
  i18n?: I18nKey
}

export function notifySuccess(message: string, options?: ToastOptions): void {
  const text = options?.i18n ? t(options.i18n.ns, options.i18n.key, options.i18n.params) : message
  toast.success(text, options)
}

export function notifyInfo(message: string, options?: ToastOptions): void {
  const text = options?.i18n ? t(options.i18n.ns, options.i18n.key, options.i18n.params) : message
  toast(text, options)
}

export function notifyWarning(message: string, options?: ToastOptions): void {
  // react-hot-toast não tem warning dedicado; usar padrão com ícone cor amarela
  const text = options?.i18n ? t(options.i18n.ns, options.i18n.key, options.i18n.params) : message
  toast(text, { icon: '⚠️', ...options })
}

export function notifyError(errorOrMessage: unknown, fallbackMessage?: string, options?: ToastOptions): void {
  if (typeof errorOrMessage === 'string') {
    const text = options?.i18n ? t(options.i18n.ns, options.i18n.key, options.i18n.params) : errorOrMessage
    toast.error(text, options)
    return
  }
  const message = formatError(errorOrMessage, fallbackMessage)
  toast.error(message, options)
}

// Utilitário para encadear operação assíncrona com toasts padrão
export async function withToast<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error?: string },
  options?: { id?: string }
): Promise<T> {
  const id = options?.id
  const loadingId = id || Math.random().toString(36).slice(2)
  toast.loading(messages.loading, { id: loadingId })
  try {
    const result = await promise
    toast.success(messages.success, { id: loadingId })
    return result
  } catch (err) {
    toast.error(formatError(err, messages.error || messages.loading), { id: loadingId })
    throw err
  }
}
