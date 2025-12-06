"use client"

import { useState, useEffect } from "react"
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
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import { useNavigation } from "@/hooks/use-navigation"
import { OperatorLogoSection } from "@/components/operator/operator-logo-section"
import { OperationalAlertsNotification } from "@/components/operational-alerts-notification"
import { ThemeToggle } from "@/components/theme-toggle"

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

  // #region agent log
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG TOPBAR] 📦 User props UPDATED at ${timestamp}:`, JSON.stringify(user, null, 2));
    console.log('[DEBUG TOPBAR] 🖼️ Avatar status:', {
      hasAvatarUrl: !!user?.avatar_url,
      avatarUrl: user?.avatar_url,
      avatarUrlLength: user?.avatar_url?.length || 0,
      userKeys: user ? Object.keys(user) : []
    });
    
    // Visual alert for debugging
    if (user?.avatar_url) {
      console.log('[DEBUG TOPBAR] ✅ AVATAR URL IS PRESENT! Will render image.');
    } else {
      console.log('[DEBUG TOPBAR] ⚠️ NO avatar_url. Will render initial letter:', user?.name?.charAt(0) || 'A');
    }
  }, [user]);
  // #endregion

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
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)

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

  // Atalho Cmd+K para search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
        searchInput?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <motion.header
      initial={{ y: -72 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 h-16 sm:h-18 bg-gradient-to-b from-white/98 via-white/95 to-white/90 dark:from-neutral-900/98 dark:via-neutral-900/95 dark:to-neutral-900/90 backdrop-blur-2xl border-b-2 border-[var(--border)] shadow-[var(--shadow-sm)] z-[var(--z-fixed)] w-full"
    >
      <div className="mx-auto max-w-[1600px] px-3 sm:px-4 md:px-6 h-full flex items-center gap-2 sm:gap-3 md:gap-4 w-full">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] touch-manipulation"
          aria-label="Toggle menu"
          aria-controls="app-sidebar-mobile"
          aria-expanded={_isSidebarOpen}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo / Empresa */}
        {(pathname?.startsWith('/operador') || pathname?.startsWith('/operator')) ? (
          <OperatorLogoSection panelHomeUrl={panelHomeUrl} panelBranding={panelBranding} />
        ) : (
          <a href={panelHomeUrl} className="flex items-center gap-2 sm:gap-3 group min-w-0 sm:flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg hover:shadow-[var(--shadow-brand-lg)] flex-shrink-0 relative overflow-hidden group/logo"
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover/logo:opacity-100"
                transition={{ duration: 0.3 }}
              />
              <span className="text-white font-bold text-base sm:text-lg md:text-xl relative z-10 drop-shadow-sm">G</span>
            </motion.div>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <span className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl tracking-tight text-[var(--ink-strong)] truncate">
                {pathname?.startsWith('/admin') ? (panelBranding || 'Administrativo') : (panelBranding || 'GOLF FOX')}
              </span>
            </div>
          </a>
        )}

        {/* Search - Hidden on small screens */}
        <div className="hidden md:flex flex-1 max-w-md ml-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
            <Input
              type="search"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="pl-10 pr-24 border-[var(--border)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-20"
            />
            {!isSearchFocused && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-[var(--ink-muted)] bg-[var(--bg-soft)] px-2 py-1 rounded-md border border-[var(--border)] pointer-events-none">
                <kbd className="px-1">⌘</kbd>
                <kbd>K</kbd>
              </div>
            )}
          </div>
        </div>



        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto min-w-0 justify-end flex-wrap sm:flex-nowrap">{/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] min-w-[44px] min-h-[44px] touch-manipulation"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Operational Alerts */}
          <OperationalAlertsNotification />

          {/* Notifications */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button variant="ghost" size="icon" className="relative hover:bg-gradient-to-br hover:from-[var(--bg-hover)] hover:to-[var(--bg-soft)] active:bg-[var(--bg-hover)] min-w-[44px] min-h-[44px] touch-manipulation backdrop-blur-sm" aria-label="Notifications">
              <Bell className="h-5 w-5 transition-all duration-300 group-hover:rotate-12" />
              <motion.span 
                className="absolute top-2 right-2 w-2.5 h-2.5 bg-[var(--brand)] rounded-full shadow-[var(--shadow-brand)]"
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
          </motion.div>

          {/* Theme Toggle */}
          {!isCompactLayout && <ThemeToggle />}

          {/* Configurações */}
          {!isCompactLayout && (
            <Button
              variant="outline"
              size="sm"
              className="hidden xl:flex items-center gap-2 rounded-full border-[var(--border)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-all duration-200"
              onClick={() => handleNavigate(panelRoutes.settings)}
            >
              <Settings2 className="h-4 w-4" />
              Configurações
            </Button>
          )}
          
          {!isCompactLayout && (
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden hover:bg-[var(--bg-hover)] min-w-[44px] min-h-[44px] touch-manipulation"
              onClick={() => handleNavigate(panelRoutes.settings)}
              aria-label="Configurações"
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] rounded-full min-h-[44px] touch-manipulation"
              >
                {user?.avatar_url ? (
                  <motion.img 
                    src={user.avatar_url} 
                    alt={user?.name || "Avatar"} 
                    className="w-8 h-8 rounded-full object-cover shadow-lg hover:shadow-[var(--shadow-brand-lg)] flex-shrink-0 border-2 border-white/50"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onError={(e) => {
                      // Fallback para inicial se a imagem falhar
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <motion.div 
                  className={`w-8 h-8 rounded-full gradient-brand flex items-center justify-center shadow-lg hover:shadow-[var(--shadow-brand-lg)] flex-shrink-0 relative overflow-hidden group/avatar ${user?.avatar_url ? 'hidden' : ''}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover/avatar:opacity-100"
                    transition={{ duration: 0.3 }}
                  />
                  <span className="text-white text-sm font-bold relative z-10 drop-shadow-sm">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </span>
                </motion.div>
                <div className="text-left hidden sm:block min-w-0">
                  <p className="text-sm font-semibold leading-tight text-[var(--ink-strong)] truncate max-w-[120px]">
                    {pathname?.startsWith('/admin') ? 'GOLF FOX' : (user?.name || "Admin")}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)] leading-tight capitalize truncate max-w-[120px]">
                    {pathname?.startsWith('/admin') ? 'admin' : (user?.role || "administrador")}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-[var(--ink-muted)] hidden sm:block flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gradient-to-br from-white to-[var(--bg-soft)] dark:from-neutral-900 dark:to-neutral-800 border-2 border-[var(--border)] shadow-xl backdrop-blur-xl">
              <DropdownMenuItem 
                className="focus:bg-[var(--bg-hover)] cursor-pointer"
                onClick={() => handleNavigate(panelRoutes.settings)}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--border)]" />
              
              <DropdownMenuItem 
                className="focus:bg-[var(--error-light)] text-[var(--error)] focus:text-[var(--error)] cursor-pointer"
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
    </motion.header>
  )
}
