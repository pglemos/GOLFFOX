"use client"

import React, { useState, useEffect } from "react"
// Substituir Link por <a> para evitar erro de export do next/link
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Search, 
  Settings2,
  Bell, 
  Menu, 
  LogOut,
  ChevronDown,
  User,
  Loader2,
  Share2,
  Star,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useNavigation } from "@/hooks/use-navigation"
import { OperatorLogoSection } from "@/components/operator/operator-logo-section"
import { OperationalAlertsNotification } from "@/components/operational-alerts-notification"
import { ThemeToggle } from "@/components/theme-toggle"
import { debug } from "@/lib/logger"

interface TopbarProps {
  user?: {
    id: string
    name: string
    email: string
    role: string
    avatar_url?: string
  }
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
  panelBranding?: string
  panelHomeUrl?: string
}

export function Topbar({ 
  user, 
  onToggleSidebar, 
  isSidebarOpen: _isSidebarOpen = true,
  panelBranding = "Admin • Premium",
  panelHomeUrl = "/admin"
}: TopbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isTopbarItemActive: _isTopbarItemActive } = useNavigation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isCompactLayout, setIsCompactLayout] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  // Debug logging (apenas em desenvolvimento)
  useEffect(() => {
    debug('Topbar user props updated', { 
      hasAvatarUrl: !!user?.avatar_url,
      avatarUrlLength: user?.avatar_url?.length || 0,
      userKeys: user ? Object.keys(user) : []
    }, 'Topbar')
  }, [user])

  // Determinar painel atual e rotas correspondentes
  const getPanelRoutes = () => {
    if (pathname?.startsWith('/operador') || pathname?.startsWith('/operator')) {
      return {
        settings: '/operador/configuracoes'
      }
    }
    if (pathname?.startsWith('/transportadora')) {
      return {
        settings: '/transportadora/configuracoes'
      }
    }
    // Admin (padrão)
    return {
      settings: '/admin/configuracoes'
    }
  }

  const panelRoutes = getPanelRoutes()

  // Função para navegar com tratamento de erro
  const handleNavigate = (path: string) => {
    try {
      router.push(path)
    } catch (error) {
      console.error('Erro ao navegar:', error)
      // Fallback: usar window.location se router.push falhar
      if (typeof window !== 'undefined') {
        window.location.href = path
      }
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

      // 1. Fazer logout do Supabase (global, não apenas local)
      try {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) {
          console.warn('Erro ao fazer logout do Supabase:', signOutError)
          // Continuar mesmo com erro
        }
      } catch (supabaseError) {
        console.warn('Erro ao fazer logout do Supabase:', supabaseError)
        // Continuar mesmo com erro
      }

      // 2. Limpar cookie de sessão no servidor
      try {
        await fetch('/api/auth/clear-session', {
          method: 'POST',
          credentials: 'include'
        })
      } catch (apiError) {
        console.warn('Erro ao limpar sessão no servidor:', apiError)
        // Continuar mesmo com erro
      }

      // 3. Limpar armazenamento local
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (storageError) {
          console.warn('Erro ao limpar armazenamento:', storageError)
        }
      }

      // 4. Redirecionar para página inicial
      // Usar window.location.href para forçar recarregamento completo
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      } else {
        router.push('/')
      }
    } catch (error: any) {
      console.error('Erro no logout:', error)
      // Mesmo com erro, tentar limpar e redirecionar
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (_storageError) {
          // Ignorar erros de storage
        }
        // Force redirect even on error
        window.location.href = '/'
      } else {
        router.push('/')
      }
    } finally {
      // Não definir setIsLoggingOut(false) aqui pois a página será redirecionada
    }
  }

  // Ajusta ações visíveis em telas muito estreitas
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return
      setIsCompactLayout(window.innerWidth < 420)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Atalho Cmd+K para Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="before:bg-background/60 sticky top-0 z-50 before:absolute before:inset-0 before:mask-[linear-gradient(var(--card),var(--card)_18%,transparent_100%)] before:backdrop-blur-md">
      <div className="bg-card relative z-[51] mx-auto mt-6 flex w-[calc(100%-2rem)] items-center justify-between rounded-xl border px-6 py-2 shadow-sm sm:w-[calc(100%-3rem)]">
        <div className="flex items-center gap-1.5 sm:gap-4">
          {/* Toggle Sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="size-7 hover:bg-accent hover:text-accent-foreground"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Separator */}
          <div className="bg-border shrink-0 h-4 w-px hidden sm:block md:max-lg:hidden" />

          {/* Command Palette Trigger */}
          <div>
            <Dialog open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden !bg-transparent px-1 py-0 font-normal sm:block md:max-lg:hidden h-9"
                >
                  <div className="text-muted-foreground hidden items-center gap-1.5 text-sm sm:flex md:max-lg:hidden">
                    <Search className="h-4 w-4" />
                    <span>Type to search...</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 sm:hidden md:max-lg:inline-flex"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Command Palette</DialogTitle>
                  <DialogDescription>Search for a command to run...</DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <Input
                    type="search"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                  <div className="mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between mb-2">
                      <span>esc</span>
                      <span>To close</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span>↑↓</span>
                      <span>To Navigate</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Enter</span>
                      <span>To Select</span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>



        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          <Button 
            variant="ghost" 
            size="icon"
            className="size-9 hover:bg-accent hover:text-accent-foreground" 
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon"
            className="size-9 hover:bg-accent hover:text-accent-foreground" 
            aria-label="Favorite"
          >
            <Star className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon"
            className="size-9 hover:bg-accent hover:text-accent-foreground" 
            aria-label="Quick actions"
          >
            <Zap className="h-4 w-4" />
          </Button>

          {/* Operational Alerts */}
          <OperationalAlertsNotification />

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon"
            className="size-9 hover:bg-accent hover:text-accent-foreground relative" 
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <motion.span 
              className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 hover:bg-accent hover:text-accent-foreground"
                aria-label="User menu"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.avatar_url} alt={user?.name || "Avatar"} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
                    {(() => {
                      const name = user?.name || '';
                      if (!name) return 'A';
                      const parts = name.split(' ').filter(p => p.length > 0);
                      if (parts.length >= 2) {
                        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                      }
                      return name.charAt(0).toUpperCase() || 'A';
                    })()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border shadow-xl">
              <DropdownMenuItem 
                className="focus:bg-accent cursor-pointer"
                onClick={() => handleNavigate(panelRoutes.settings)}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="focus:bg-destructive/10 text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                {isLoggingOut ? 'Saindo...' : 'Sair'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
