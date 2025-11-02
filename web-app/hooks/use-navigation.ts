"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export interface NavigationState {
  currentPath: string
  isActive: (path: string, exact?: boolean) => boolean
  isDashboardActive: boolean
  isSidebarItemActive: (path: string) => boolean
  isTopbarItemActive: (path: string) => boolean
}

/**
 * Hook personalizado para gerenciar o estado de navegação
 * Evita conflitos entre Topbar e Sidebar na seleção de itens ativos
 */
export function useNavigation(): NavigationState {
  const pathname = usePathname()
  const [currentPath, setCurrentPath] = useState("")

  useEffect(() => {
    setCurrentPath(pathname || "")
  }, [pathname])

  // Função genérica para verificar se um path está ativo
  const isActive = (path: string, exact: boolean = false): boolean => {
    if (exact) {
      return currentPath === path
    }
    return currentPath === path || currentPath.startsWith(path + '/')
  }

  // Dashboard ativo apenas na rota exata /admin
  const isDashboardActive = currentPath === "/admin"

  // Lógica específica para itens do Sidebar
  const isSidebarItemActive = (path: string): boolean => {
    if (path === "/admin") {
      // Dashboard ativo apenas na rota exata
      return currentPath === "/admin"
    }
    // Outras rotas podem ter subrotas ativas
    return currentPath === path || currentPath.startsWith(path + '/')
  }

  // Lógica específica para itens do Topbar
  const isTopbarItemActive = (path: string): boolean => {
    if (path === "/admin") {
      // Painel de Gestão ativo apenas na rota exata
      return currentPath === "/admin"
    }
    // Outras seções podem ter subrotas ativas
    return currentPath.startsWith(path)
  }

  return {
    currentPath,
    isActive,
    isDashboardActive,
    isSidebarItemActive,
    isTopbarItemActive
  }
}

/**
 * Hook para detectar mudanças de navegação e executar callbacks
 */
export function useNavigationEvents(
  onNavigationChange?: (newPath: string, oldPath: string) => void
) {
  const pathname = usePathname()
  const [previousPath, setPreviousPath] = useState("")

  useEffect(() => {
    if (pathname && pathname !== previousPath) {
      onNavigationChange?.(pathname, previousPath)
      setPreviousPath(pathname)
    }
  }, [pathname, previousPath, onNavigationChange])

  return { currentPath: pathname, previousPath }
}