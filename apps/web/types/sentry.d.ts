/**
 * Declaração de tipos para @sentry/nextjs (opcional)
 * 
 * Se @sentry/nextjs não estiver instalado, TypeScript não reclamará
 * O código já trata isso com dynamic imports e try/catch
 */

declare module '@sentry/nextjs' {
  export function init(options: any): void
  export function captureException(error: Error | unknown, options?: any): void
  export function captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void
  export function setUser(user: { id: string; role?: string; email?: string } | null): void
}
