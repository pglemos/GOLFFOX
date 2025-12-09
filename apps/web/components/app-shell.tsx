"use client"

import { useState, useEffect, memo, useMemo } from "react"
import { usePathname } from "next/navigation"
import { Topbar } from "./topbar"
import { PremiumSidebar } from "./premium-sidebar"
import { EnvVarsBanner } from "./env-vars-banner"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { debug } from "@/lib/logger"
import { useMobile } from "@/hooks/use-mobile"
import { SidebarProvider } from "@/components/ui/sidebar"

interface AppShellProps {
  user: {
    id: string
    name?: string
    email: string
    role: string
    avatar_url?: string
  }
  children: React.ReactNode
  panel?: 'admin' | 'operador' | 'transportadora'
}

// Named export for AppShell component - Application Shell 08 Style
export const AppShell = memo(function AppShell({ user, children, panel }: AppShellProps) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const isMobile = useMobile()

  // Debug logging (apenas em desenvolvimento)
  useEffect(() => {
    debug('AppShell user prop received', {
      hasAvatarUrl: !!user?.avatar_url
    }, 'AppShell')
  }, [user])

  // Detectar painel automaticamente se não fornecido (memoizado)
  const detectedPanel: 'admin' | 'operador' | 'transportadora' = useMemo(() =>
    panel ||
    ((pathname?.startsWith('/operador') || pathname?.startsWith('/operator')) ? 'operador' :
      (pathname?.startsWith('/transportadora') || pathname?.startsWith('/carrier')) ? 'transportadora' : 'admin'),
    [panel, pathname]
  )

  // Configurações de branding por painel (memoizado)
  const panelConfig = useMemo(() => ({
    admin: {
      branding: 'Administrativo',
      homeUrl: '/admin'
    },
    operador: {
      branding: 'Operador',
      homeUrl: '/operador'
    },
    transportadora: {
      branding: 'Transportadora',
      homeUrl: '/transportadora'
    }
  }[detectedPanel]), [detectedPanel])

  // Em desktop, começar com sidebar fechado
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false)
      document.body.setAttribute('data-mobile', 'true')
    } else {
      setIsSidebarOpen(false)
      document.body.removeAttribute('data-mobile')
    }
  }, [isMobile])

  // Listener para fechar sidebar no mobile
  useEffect(() => {
    const handleCloseSidebar = () => {
      if (isMobile) {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('close-sidebar', handleCloseSidebar as EventListener)
    return () => {
      window.removeEventListener('close-sidebar', handleCloseSidebar as EventListener)
    }
  }, [isMobile])

  // Bloquear scroll do body quando o menu mobile estiver aberto
  useEffect(() => {
    if (!isMobile) {
      document.body.style.removeProperty('overflow')
      return
    }
    if (isSidebarOpen) {
      document.body.style.setProperty('overflow', 'hidden')
    } else {
      document.body.style.removeProperty('overflow')
    }
    return () => {
      document.body.style.removeProperty('overflow')
    }
  }, [isMobile, isSidebarOpen])

  return (
    <SidebarProvider open={false}>
      <div
        className={cn(
          "bg-background text-foreground flex min-h-svh w-full",
          // Layout responsivo
          isMobile ? "flex-col" : "flex-row"
        )}
        style={{
          // Safe areas para iOS
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : undefined,
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : undefined,
          paddingLeft: isMobile ? 'env(safe-area-inset-left)' : undefined,
          paddingRight: isMobile ? 'env(safe-area-inset-right)' : undefined,
        } as React.CSSProperties}
      >
        {/* Banner de Variáveis de Ambiente */}
        <EnvVarsBanner />

        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[90] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            style={{ pointerEvents: 'auto' }}
          />
        )}

        {/* Sidebar Premium - Floating variant, width 280px/72px */}
        <PremiumSidebar
          isOpen={isMobile ? isSidebarOpen : undefined}
          isMobile={isMobile}
          panel={detectedPanel}
          user={user ? { id: user.id, name: user.name || '', email: user.email, avatar_url: user.avatar_url } : { id: '', name: '', email: '' }}
        />

        {/* Content Area - flex-1 para ocupar resto do espaço */}
        <div className="flex flex-1 flex-col">
          {/* Header Sticky - 80px height with floating card style */}
          <header
            className={cn(
              "sticky top-0 z-50",
              // Efeito blur no background do header
              "before:absolute before:inset-0",
              "before:bg-background/60",
              "before:mask-[linear-gradient(var(--card),var(--card)_18%,transparent_100%)]",
              "before:backdrop-blur-md"
            )}
            style={{ height: '80px', minHeight: '80px' }}
          >
            <Topbar
              user={user ? { id: user.id, name: user.name || '', email: user.email, role: user.role, avatar_url: user.avatar_url } : { id: '', name: '', email: '', role: 'operador' }}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
              panelBranding={panelConfig.branding}
              panelHomeUrl={panelConfig.homeUrl}
            />
          </header>

          {/* Main Content - flex-1 com padding 24px */}
          <main
            className={cn(
              "flex-1 size-full",
              // Padding 24px conforme especificação
              "px-6 py-6"
            )}
          >
            {children}
          </main>

          {/* Footer - 44px height, flex justify-between */}
          <footer className={cn(
            "flex items-center justify-between gap-6",
            "h-11",  // 44px
            "px-6 pb-6",
            // Responsivo
            "max-lg:flex-col"
          )}>
            <p className="text-muted-foreground text-sm text-balance max-lg:text-center">
              ©2025{' '}
              <a href="https://golffox.com.br" className="text-primary hover:underline">
                Golf Fox
              </a>
              , Sistema de Gestão de Transporte
            </p>
            <div className="text-muted-foreground flex items-center gap-3 text-sm whitespace-nowrap max-[450px]:flex-col min-[450px]:gap-4">
              <a href="/termos" className="hover:text-primary transition-colors">Termos de Uso</a>
              <a href="/privacidade" className="hover:text-primary transition-colors">Privacidade</a>
              <a href="/suporte" className="hover:text-primary transition-colors">Suporte</a>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  )
})
