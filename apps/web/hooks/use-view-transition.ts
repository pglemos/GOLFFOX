/**
 * View Transitions Hook
 * 
 * Hook para gerenciar View Transitions API do React 19.2
 * Permite transições suaves entre páginas
 */

import { useCallback, useTransition } from 'react'

import { useRouter } from '@/lib/next-navigation'

/**
 * Hook para navegação com View Transitions
 * 
 * @example
 * const { navigateWithTransition, isPending } = useViewTransition()
 * 
 * navigateWithTransition('/admin/companies')
 */
export function useViewTransition() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigateWithTransition = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      // Verificar se View Transitions API está disponível
      if (typeof document !== 'undefined' && 'startViewTransition' in document) {
        const transition = (document as any).startViewTransition(() => {
          startTransition(() => {
            if (options?.replace) {
              router.replace(href)
            } else {
              router.push(href)
            }
          })
        })
        return transition
      } else {
        // Fallback para navegação normal
        startTransition(() => {
          if (options?.replace) {
            router.replace(href)
          } else {
            router.push(href)
          }
        })
      }
    },
    [router]
  )

  return {
    navigateWithTransition,
    isPending,
  }
}

/**
 * Hook para verificar se View Transitions está disponível
 */
export function useViewTransitionsSupported(): boolean {
  if (typeof document === 'undefined') return false
  return 'startViewTransition' in document
}

