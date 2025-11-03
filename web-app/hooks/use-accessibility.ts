import { useState, useEffect, useCallback, useRef } from 'react'

export interface AccessibilityConfig {
  enableKeyboardNavigation: boolean
  enableScreenReaderSupport: boolean
  enableFocusManagement: boolean
  enableAriaLiveRegions: boolean
  focusRingVisible: boolean
  highContrastMode: boolean
}

export interface AccessibilityState {
  isKeyboardUser: boolean
  isScreenReaderActive: boolean
  focusedElement: HTMLElement | null
  announcements: string[]
  highContrastMode: boolean
  reducedMotion: boolean
}

const defaultConfig: AccessibilityConfig = {
  enableKeyboardNavigation: true,
  enableScreenReaderSupport: true,
  enableFocusManagement: true,
  enableAriaLiveRegions: true,
  focusRingVisible: true,
  highContrastMode: false,
}

export function useAccessibility(config: Partial<AccessibilityConfig> = {}): {
  state: AccessibilityState
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  focusElement: (element: HTMLElement | null) => void
  trapFocus: (container: HTMLElement) => () => void
  skipToContent: () => void
  toggleHighContrast: () => void
} {
  const finalConfig = { ...defaultConfig, ...config }
  const [state, setState] = useState<AccessibilityState>({
    isKeyboardUser: false,
    isScreenReaderActive: false,
    focusedElement: null,
    announcements: [],
    highContrastMode: false,
    reducedMotion: false,
  })

  const liveRegionRef = useRef<HTMLDivElement | null>(null)
  const focusTrapRef = useRef<HTMLElement | null>(null)

  // Detect keyboard usage
  useEffect(() => {
    const handleKeyDown = () => {
      setState(prev => ({ ...prev, isKeyboardUser: true }))
    }

    const handleMouseDown = () => {
      setState(prev => ({ ...prev, isKeyboardUser: false }))
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // Detect screen reader
  useEffect(() => {
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const hasScreenReader = 
        navigator.userAgent.includes('NVDA') ||
        navigator.userAgent.includes('JAWS') ||
        navigator.userAgent.includes('VoiceOver') ||
        window.speechSynthesis?.getVoices().length > 0

      setState(prev => ({ ...prev, isScreenReaderActive: hasScreenReader }))
    }

    detectScreenReader()
    
    // Check again after voices are loaded
    if (window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', detectScreenReader)
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', detectScreenReader)
      }
    }
    
    // Return empty cleanup function if speechSynthesis is not available
    return () => {}
  }, [])

  // Monitor focus changes
  useEffect(() => {
    if (!finalConfig.enableFocusManagement) return

    const handleFocusIn = (event: FocusEvent) => {
      setState(prev => ({ 
        ...prev, 
        focusedElement: event.target as HTMLElement 
      }))
    }

    const handleFocusOut = () => {
      setState(prev => ({ ...prev, focusedElement: null }))
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [finalConfig.enableFocusManagement])

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setState(prev => ({ ...prev, reducedMotion: mediaQuery.matches }))

    const handleChange = (event: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, reducedMotion: event.matches }))
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Check for high contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setState(prev => ({ ...prev, highContrastMode: mediaQuery.matches }))

    const handleChange = (event: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, highContrastMode: event.matches }))
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Create live region for announcements
  useEffect(() => {
    if (!finalConfig.enableAriaLiveRegions) return

    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.style.position = 'absolute'
    liveRegion.style.left = '-10000px'
    liveRegion.style.width = '1px'
    liveRegion.style.height = '1px'
    liveRegion.style.overflow = 'hidden'
    
    document.body.appendChild(liveRegion)
    liveRegionRef.current = liveRegion

    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current)
      }
    }
  }, [finalConfig.enableAriaLiveRegions])

  // Announce messages to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!finalConfig.enableAriaLiveRegions || !liveRegionRef.current) return

    setState(prev => ({
      ...prev,
      announcements: [...prev.announcements, message].slice(-5) // Keep last 5 announcements
    }))

    liveRegionRef.current.setAttribute('aria-live', priority)
    liveRegionRef.current.textContent = message

    // Clear after announcement
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = ''
      }
    }, 1000)
  }, [finalConfig.enableAriaLiveRegions])

  // Focus management
  const focusElement = useCallback((element: HTMLElement | null) => {
    if (!finalConfig.enableFocusManagement || !element) return

    element.focus()
    
    // Ensure element is visible
    element.scrollIntoView({
      behavior: state.reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
    })
  }, [finalConfig.enableFocusManagement, state.reducedMotion])

  // Focus trap for modals/dialogs
  const trapFocus = useCallback((container: HTMLElement) => {
    if (!finalConfig.enableFocusManagement) return () => {}

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement && lastElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement && firstElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    focusTrapRef.current = container

    // Focus first element
    if (firstElement) {
      firstElement.focus()
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      focusTrapRef.current = null
    }
  }, [finalConfig.enableFocusManagement])

  // Skip to main content
  const skipToContent = useCallback(() => {
    const mainContent = document.querySelector('main, [role="main"], #main-content')
    if (mainContent instanceof HTMLElement) {
      focusElement(mainContent)
      announce('Navegou para o conteúdo principal')
    }
  }, [focusElement, announce])

  // Toggle high contrast mode
  const toggleHighContrast = useCallback(() => {
    setState(prev => {
      const newHighContrast = !prev.highContrastMode
      
      // Apply high contrast styles
      if (newHighContrast) {
        document.documentElement.classList.add('high-contrast')
      } else {
        document.documentElement.classList.remove('high-contrast')
      }

      announce(
        newHighContrast 
          ? 'Modo de alto contraste ativado' 
          : 'Modo de alto contraste desativado'
      )

      return { ...prev, highContrastMode: newHighContrast }
    })
  }, [announce])

  // Keyboard navigation setup
  useEffect(() => {
    if (!finalConfig.enableKeyboardNavigation) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to content with Alt+S
      if (event.altKey && event.key === 's') {
        event.preventDefault()
        skipToContent()
      }

      // Toggle high contrast with Alt+H
      if (event.altKey && event.key === 'h') {
        event.preventDefault()
        toggleHighContrast()
      }

      // Escape key to close modals/dialogs
      if (event.key === 'Escape' && focusTrapRef.current) {
        const closeButton = focusTrapRef.current.querySelector('[data-close], .close, [aria-label*="fechar"]')
        if (closeButton instanceof HTMLElement) {
          closeButton.click()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [finalConfig.enableKeyboardNavigation, skipToContent, toggleHighContrast])

  return {
    state,
    announce,
    focusElement,
    trapFocus,
    skipToContent,
    toggleHighContrast,
  }
}

// Hook para gerenciar foco em listas
export function useListNavigation(items: HTMLElement[], options: {
  loop?: boolean
  orientation?: 'horizontal' | 'vertical'
} = {}) {
  const { loop = true, orientation = 'vertical' } = options
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isVertical = orientation === 'vertical'
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'

    if (event.key === nextKey) {
      event.preventDefault()
      setCurrentIndex(prev => {
        const next = prev + 1
        if (next >= items.length) {
          return loop ? 0 : prev
        }
        return next
      })
    } else if (event.key === prevKey) {
      event.preventDefault()
      setCurrentIndex(prev => {
        const next = prev - 1
        if (next < 0) {
          return loop ? items.length - 1 : prev
        }
        return next
      })
    } else if (event.key === 'Home') {
      event.preventDefault()
      setCurrentIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setCurrentIndex(items.length - 1)
    }
  }, [items.length, loop, orientation])

  useEffect(() => {
    const currentItem = items[currentIndex]
    if (currentItem) {
      currentItem.focus()
    }
  }, [currentIndex, items])

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
  }
}