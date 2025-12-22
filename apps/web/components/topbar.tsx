"use client"

import React, { useState, useEffect } from "react"
// Substituir Link por <a> para evitar erro de export do next/link
import { useRouter, usePathname } from "@/lib/next-navigation"
import {
  Search,
  Settings2,
  Bell,
  LogOut,
  Loader2,
  PanelLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { OperationalAlertsNotification } from "@/components/operational-alerts-notification"
import { debug } from "@/lib/logger"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import { UserNotifications } from "@/components/user-notifications"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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
  const isMobile = useMobile() // Hook mobile-first
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar_url)

  // Tentar usar useSidebar se disponível (desktop), caso contrário usar onToggleSidebar (mobile)
  let sidebarControl: { toggle: () => void } | null = null
  try {
    const sidebar = useSidebar()
    sidebarControl = { toggle: sidebar.toggleSidebar }
  } catch {
    // useSidebar não disponível (fora do provider), usar onToggleSidebar como fallback
    sidebarControl = null
  }

  // Atualizar avatar URL quando user mudar
  useEffect(() => {
    if (user?.avatar_url) {
      // Remover timestamp existente e adicionar novo para forçar atualização
      const cleanUrl = user.avatar_url.split('?')[0]
      const urlWithCache = `${cleanUrl}?t=${Date.now()}`
      debug('Topbar - Setting avatar URL from user prop', { 
        original: user.avatar_url,
        cleanUrl,
        urlWithCache 
      }, 'Topbar')
      setAvatarUrl(urlWithCache)
    } else {
      debug('Topbar - No avatar_url in user prop', {}, 'Topbar')
      setAvatarUrl(undefined)
    }
  }, [user?.avatar_url])

  // Listener para atualização de avatar (disparado após upload)
  useEffect(() => {
    const handleAuthUpdate = async () => {
      debug('Topbar - auth:update event received', {}, 'Topbar')
      // Aguardar um pouco para garantir que o banco foi atualizado
      setTimeout(async () => {
        try {
          debug('Topbar - Fetching updated user data', {}, 'Topbar')
          const res = await fetch('/api/auth/me', {
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
          if (res.ok) {
            const data = await res.json()
            const updatedUser = data?.user
            debug('Topbar - Updated user data received', {
              hasAvatarUrl: !!updatedUser?.avatar_url,
              avatarUrl: updatedUser?.avatar_url
            }, 'Topbar')
            if (updatedUser?.avatar_url) {
              const urlWithCache = updatedUser.avatar_url.includes('?')
                ? `${updatedUser.avatar_url.split('?')[0]}?t=${Date.now()}`
                : `${updatedUser.avatar_url}?t=${Date.now()}`
              debug('Topbar - Setting avatar URL with cache', { urlWithCache }, 'Topbar')
              setAvatarUrl(urlWithCache)
            } else {
              debug('Topbar - No avatar_url in updated user', {}, 'Topbar')
              setAvatarUrl(undefined)
            }
          } else {
            debug('Topbar - Failed to fetch updated user', { status: res.status }, 'Topbar')
          }
        } catch (error) {
          debug('Topbar - Error updating avatar', { error }, 'Topbar')
          console.error('Erro ao atualizar avatar:', error)
        }
      }, 800) // Aumentar delay para garantir propagação
    }

    window.addEventListener('auth:update', handleAuthUpdate)
    return () => window.removeEventListener('auth:update', handleAuthUpdate)
  }, [])

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
    if (pathname?.startsWith('/operador') || pathname?.startsWith('/operador')) {
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

  // Removido: useMobile hook já cuida da detecção

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
  }, [setIsCommandPaletteOpen])

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        // Desktop: padding-top para alinhar com sidebar container (p-6 = 24px)
        !isMobile && "pt-6",
        // Mobile: header transparente
        isMobile && "pb-0"
      )}
    >
      <div className={cn(
        // Container flutuante com glassmorphism
        "bg-white/5 backdrop-blur-xl relative z-51 mx-auto flex items-center justify-between px-6 py-2",
        // Border translúcida estilo Apple
        "border border-white/10 shadow-sm",
        // Desktop: rounded-2xl, largura com margem (sem margin-top, pois o header já tem pt-6)
        !isMobile && "rounded-2xl w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] my-3",
        // Hover effect
        "hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500",
        // Mobile: full width, sem border-radius
        isMobile && "w-full h-14 rounded-none border-x-0 border-t-0 hover:bg-white/5 hover:border-white/10"
      )}>
        {/* Left Section - Exatamente como Application Shell 08 */}
        <div className="flex items-center gap-1.5 sm:gap-4">
          {/* SidebarTrigger - EXATAMENTE como Application Shell 08 */}
          <button
            onClick={() => {
              if (sidebarControl) {
                sidebarControl.toggle()
              } else if (onToggleSidebar) {
                onToggleSidebar()
              }
            }}
            data-slot="sidebar-trigger"
            className={cn(
              "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
              isMobile ? "size-10" : "size-7 [&_svg]:!size-5"
            )}
            data-sidebar="trigger"
          >
            <PanelLeft className={isMobile ? "h-6 w-6" : "h-5 w-5"} />
            <span className="sr-only">Toggle Sidebar</span>
          </button>

          {/* Separator vertical - EXATAMENTE como Application Shell 08 */}
          {!isMobile && (
            <div
              data-orientation="vertical"
              role="none"
              data-slot="separator"
              className="bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px hidden !h-4 sm:block md:max-lg:hidden"
            />
          )}

          {/* Command Palette - EXATAMENTE como Application Shell 08 */}
          {!isMobile && (
            <div>
              <Dialog open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen}>
                <div>
                  {/* Desktop: Button com texto "Type to search..." */}
                  <DialogTrigger asChild>
                    <button
                      data-slot="button"
                      className="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shrink-0 items-center justify-center gap-2 rounded-md text-sm whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 h-9 has-[>svg]:px-3 hidden !bg-transparent px-1 py-0 font-normal sm:block md:max-lg:hidden"
                    >
                      <div className="text-muted-foreground hidden items-center gap-1.5 text-sm sm:flex md:max-lg:hidden">
                        <Search className="h-4 w-4" />
                        <span>Digite para buscar...</span>
                      </div>
                    </button>
                  </DialogTrigger>
                  {/* Tablet: Button apenas com ícone */}
                  <DialogTrigger asChild>
                    <button
                      data-slot="button"
                      className="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 size-9 sm:hidden md:max-lg:inline-flex"
                      aria-label="Search"
                    >
                      <Search className="h-4 w-4" />
                      <span className="sr-only">Buscar</span>
                    </button>
                  </DialogTrigger>
                </div>
                <DialogContent className="max-w-lg">
                  <div data-slot="dialog-header" className="flex flex-col gap-2 text-center sm:text-left sr-only">
                    <DialogTitle data-slot="dialog-title" className="text-lg leading-none font-semibold">Command Palette</DialogTitle>
                    <DialogDescription data-slot="dialog-description" className="text-muted-foreground text-sm">Search for a command to run...</DialogDescription>
                  </div>
                  <div className="mt-4">
                    <Input
                      type="search"
                      placeholder="Type to search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                      autoFocus
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Right Actions - Mobile: Menu compacto */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Operational Alerts - Sempre visível */}
          <OperationalAlertsNotification />

          {/* Notifications - EXATAMENTE como Application Shell 08 */}
          {/* Notifications - Integrado com backend */}
          <UserNotifications />

          {/* User Menu - EXATAMENTE como Application Shell 08 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-slot="button"
                type="button"
                className={cn(
                  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
                  "size-9"
                )}
                aria-label="User menu"
              >
                <Avatar className={cn("size-8 rounded-md", isMobile ? "size-8" : "size-8")}>
                  {avatarUrl && (
                    <AvatarImage
                      src={avatarUrl}
                      alt={user?.name || "User"}
                      className="object-cover"
                      onError={(e) => {
                        debug('Topbar - Avatar image failed to load', { 
                          avatarUrl,
                          error: e 
                        }, 'Topbar')
                        // Forçar fallback removendo a URL
                        setAvatarUrl(undefined)
                      }}
                      onLoad={() => {
                        debug('Topbar - Avatar image loaded successfully', { avatarUrl }, 'Topbar')
                      }}
                    />
                  )}
                  <AvatarFallback className="rounded-md text-xs font-medium">
                    {user?.name
                      ? user.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn(
                "w-56 bg-card border shadow-xl",
                isMobile && "w-[calc(100vw-2rem)] max-w-[280px]"
              )}
              side={isMobile ? "bottom" : "bottom"}
              alignOffset={isMobile ? 0 : undefined}
            >
              <DropdownMenuItem
                className="focus:bg-accent cursor-pointer touch-manipulation min-h-[44px] text-base"
                onClick={() => handleNavigate(panelRoutes.settings)}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="focus:bg-destructive/10 text-destructive focus:text-destructive cursor-pointer touch-manipulation min-h-[44px] text-base"
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
