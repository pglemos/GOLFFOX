/**
 * View Transition Component
 * 
 * Componente wrapper para aplicar View Transitions em navegação
 */

'use client'

import { ReactNode, useCallback } from 'react'
import { useRouter } from '@/lib/next-navigation'
import { useViewTransition, useViewTransitionsSupported } from '@/hooks/use-view-transition'

interface ViewTransitionLinkProps {
  href: string
  children: ReactNode
  replace?: boolean
  className?: string
  onClick?: () => void
}

/**
 * Link component com View Transitions
 * 
 * @example
 * <ViewTransitionLink href="/admin/companies">
 *   Companies
 * </ViewTransitionLink>
 */
export function ViewTransitionLink({
  href,
  children,
  replace = false,
  className,
  onClick,
}: ViewTransitionLinkProps) {
  const { navigateWithTransition, isPending } = useViewTransition()
  const isSupported = useViewTransitionsSupported()

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      onClick?.()
      navigateWithTransition(href, { replace })
    },
    [href, replace, navigateWithTransition, onClick]
  )

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      aria-busy={isPending}
      data-view-transition={isSupported}
    >
      {children}
    </a>
  )
}

/**
 * Button component com View Transitions
 */
interface ViewTransitionButtonProps {
  href: string
  children: ReactNode
  replace?: boolean
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function ViewTransitionButton({
  href,
  children,
  replace = false,
  className,
  onClick,
  disabled,
}: ViewTransitionButtonProps) {
  const { navigateWithTransition, isPending } = useViewTransition()
  const isSupported = useViewTransitionsSupported()

  const handleClick = useCallback(() => {
    if (disabled || isPending) return
    onClick?.()
    navigateWithTransition(href, { replace })
  }, [href, replace, navigateWithTransition, onClick, disabled, isPending])

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isPending}
      className={className}
      aria-busy={isPending}
      data-view-transition={isSupported}
    >
      {children}
    </button>
  )
}

