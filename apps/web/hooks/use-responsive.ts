"use client"

import { useState, useEffect } from "react"

/**
 * Hook de responsividade definitivo (Pilar 1 - DRY)
 * Unifica useMobile, useMediaQuery e useResponsive
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const width = windowSize.width

  return {
    isMobile: isClient ? width < 640 : false,
    isTablet: isClient ? width >= 640 && width < 1024 : false,
    isDesktop: isClient ? width >= 1024 : false,
    isWide: isClient ? width >= 1280 : false,
    width,
    height: windowSize.height,
  }
}