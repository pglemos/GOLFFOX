"use client"

import { useState, useEffect } from "react"
import { useMediaQuery } from "./use-media-query"

/**
 * Hook para detectar se está em dispositivo mobile
 * Considera mobile: < 768px (md breakpoint)
 * @returns boolean - true se for mobile
 */
export function useMobile(): boolean {
  const isMobile = useMediaQuery("(max-width: 767px)")
  return isMobile
}

// Alias para compatibilidade com shadcn/ui sidebar
export const useIsMobile = useMobile

/**
 * Hook para detectar se está em tablet
 * Considera tablet: 768px - 1023px
 * @returns boolean - true se for tablet
 */
export function useTablet(): boolean {
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)")
  return isTablet
}

/**
 * Hook para detectar se está em desktop
 * Considera desktop: >= 1024px
 * @returns boolean - true se for desktop
 */
export function useDesktop(): boolean {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  return isDesktop
}

/**
 * Hook que retorna informações completas sobre o tamanho da tela
 * @returns objeto com isMobile, isTablet, isDesktop
 */
export function useScreenSize() {
  const isMobile = useMobile()
  const isTablet = useTablet()
  const isDesktop = useDesktop()

  return {
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet: isMobile || isTablet,
  }
}
