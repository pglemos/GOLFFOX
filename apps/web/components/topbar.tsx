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
import { SyncAlertNotification } from "@/components/sync-alert-notification"
import { OperationalAlertsNotification } from "@/components/operational-alerts-notification"

interface TopbarProps {
  user?: {
    id: string
    name: string
    email: string
    role: string
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
      className="fixed top-0 left-0 right-0 h-16 sm:h-18 bg-white/80 backdrop-blur-xl border-b border-[var(--border)] z-[var(--z-fixed)]"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 h-full flex items-center gap-2 sm:gap-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden hover:bg-[var(--bg-hover)] flex-shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo / Empresa */}
        {(pathname?.startsWith('/operator')) ? (
          <OperatorLogoSection panelHomeUrl={panelHomeUrl} panelBranding={panelBranding} />
        ) : (
          <a href={panelHomeUrl} className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-brand flex items-center justify-center shadow-md"
            >
              <span className="text-white font-bold text-lg sm:text-xl">G</span>
            </motion.div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-2xl tracking-tight text-[var(--ink-strong)] hidden xs:block">
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
        <div className="flex items-center gap-2 ml-auto">{/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-[var(--bg-hover)]"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Sync Alerts */}
          <SyncAlertNotification />

          {/* Operational Alerts */}
          <OperationalAlertsNotification />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative hover:bg-[var(--bg-hover)]">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--brand)] rounded-full animate-pulse-glow"></span>
          </Button>

          {/* Preferências */}
          <Button
            variant="outline"
            size="sm"
            className="hidden xl:flex items-center gap-2 rounded-full border-[var(--border)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-all duration-200"
            asChild
          >
            <a href="/admin/preferences">
              <Settings2 className="h-4 w-4" />
              Preferências
            </a>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden hover:bg-[var(--bg-hover)]"
            asChild
          >
            <a href="/admin/preferences">
              <Settings2 className="h-5 w-5" />
            </a>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 pl-2 hover:bg-[var(--bg-hover)] rounded-full"
              >
                <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold leading-tight text-[var(--ink-strong)]">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)] leading-tight capitalize">
                    {user?.role || "administrador"}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-[var(--ink-muted)] hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-[var(--border)] shadow-lg">
              <DropdownMenuItem className="focus:bg-[var(--bg-hover)] cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-[var(--bg-hover)] cursor-pointer">
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
