/**
 * Hook useFocusTrap
 * 
 * Mantém o foco preso dentro de um elemento container.
 * Útil para modais e dialogs que precisam de navegação por teclado acessível.
 */

import { useEffect, useRef, useCallback } from 'react'

const FOCUSABLE_SELECTORS = [
  'a[href]:not([disabled])',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

/**
 * Opções do hook
 */
export interface UseFocusTrapOptions {
  /** Se deve ativar o trap */
  enabled?: boolean
  /** Se deve focar o primeiro elemento focável ao montar */
  autoFocus?: boolean
  /** Se deve restaurar o foco ao elemento anterior ao desmontar */
  restoreFocus?: boolean
  /** Callback quando Escape é pressionado */
  onEscape?: () => void
  /** Seletor para o elemento inicial a focar */
  initialFocusSelector?: string
}

/**
 * Hook para trap de foco
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions = {}
) {
  const {
    enabled = true,
    autoFocus = true,
    restoreFocus = true,
    onEscape,
    initialFocusSelector,
  } = options

  const containerRef = useRef<T>(null)
  const previousActiveElement = useRef<Element | null>(null)

  /**
   * Obtém todos os elementos focáveis dentro do container
   */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return []
    const elements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    return Array.from(elements).filter((el) => {
      // Verificar se o elemento está visível
      const style = window.getComputedStyle(el)
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        el.offsetParent !== null
      )
    })
  }, [])

  /**
   * Handler de keydown para navegação
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !containerRef.current) return

      // Escape
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape?.()
        return
      }

      // Tab
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      // Shift + Tab no primeiro elemento -> ir para o último
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
        return
      }

      // Tab no último elemento -> ir para o primeiro
      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
        return
      }

      // Se o foco está fora do container, trazer de volta
      if (!containerRef.current.contains(activeElement)) {
        event.preventDefault()
        firstElement.focus()
      }
    },
    [enabled, getFocusableElements, onEscape]
  )

  // Setup e cleanup
  useEffect(() => {
    if (!enabled) return

    // Salvar elemento anterior
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement
    }

    // Auto focus
    if (autoFocus && containerRef.current) {
      const focusableElements = getFocusableElements()

      // Tentar focar elemento específico se seletor fornecido
      if (initialFocusSelector) {
        const initialElement = containerRef.current.querySelector<HTMLElement>(initialFocusSelector)
        if (initialElement) {
          initialElement.focus()
        } else if (focusableElements.length > 0) {
          focusableElements[0].focus()
        }
      } else if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    }

    // Adicionar listener
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Restaurar foco
      if (restoreFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus()
      }
    }
  }, [enabled, autoFocus, restoreFocus, initialFocusSelector, getFocusableElements, handleKeyDown])

  return {
    containerRef,
    getFocusableElements,
  }
}

/**
 * Hook simplificado para modais
 */
export function useModalFocusTrap(
  isOpen: boolean,
  onClose?: () => void
) {
  return useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    autoFocus: true,
    restoreFocus: true,
    onEscape: onClose,
    initialFocusSelector: 'button[type="submit"], button:not([type="button"]), input:not([type="hidden"]), [autofocus]',
  })
}

export default useFocusTrap

