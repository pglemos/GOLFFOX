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

// Named export for AppShell component
export const AppShell = memo(function AppShell({ user, children, panel }: AppShellProps) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const isMobile = useMobile() // Usar hook mobile-first

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

  // Fechar sidebar quando mudar para mobile ou quando navegar
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

  // Remover padrão de grid em mobile via JavaScript (camada extra de proteção)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      // Remover padrão do body::before
      const style = document.createElement('style')
      style.textContent = `
        @media (max-width: 1023px) {
          body::before {
            display: none !important;
            content: none !important;
            background-image: none !important;
            background: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            position: absolute !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
            pointer-events: none !important;
            z-index: -9999 !important;
          }
          body, html, main {
            background-image: none !important;
          }
        }
      `
      document.head.appendChild(style)

      return () => {
        document.head.removeChild(style)
      }
    }
  }, [])

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--ink)] overflow-x-hidden w-full max-w-full"
      style={{
        backgroundImage: 'none',
        background: 'var(--bg)'
      } as React.CSSProperties}
    >
      {/* Banner de Variáveis de Ambiente */}
      <EnvVarsBanner />

      {/* Topbar Fixa */}
      <Topbar
        user={user ? { id: user.id, name: user.name || '', email: user.email, role: user.role, avatar_url: user.avatar_url } : { id: '', name: '', email: '', role: 'operador' }}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        panelBranding={panelConfig.branding}
        panelHomeUrl={panelConfig.homeUrl}
      />

      {/* Container Principal */}
      <div className={cn(
        "flex relative w-full",
        isMobile ? "flex-col" : "flex-row"
      )}>
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

        {/* Sidebar Premium */}
        <PremiumSidebar
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          panel={detectedPanel}
          user={user ? { id: user.id, name: user.name || '', email: user.email, avatar_url: user.avatar_url } : { id: '', name: '', email: '' }}
        />

        {/* Main Content - Mobile-first */}
        <main
          className={cn(
            "min-h-screen transition-all duration-300 ease-in-out",
            // Mobile: padding-top para header fixo (56px + safe area)
            isMobile ? "overflow-visible pt-[56px] safe-top" : "overflow-y-auto pt-32",
            "overflow-x-hidden bg-[var(--bg)]",
            // Mobile: padding bottom com safe area
            isMobile ? "pb-4 safe-bottom" : "pb-12 sm:pb-14",
            // Desktop: margin-left para sidebar colapsada
            !isMobile ? "flex-1 md:ml-[64px]" : "w-full ml-0 flex-shrink-0",
            "w-full",
            "relative z-10"
          )}
          style={{
            backgroundImage: 'none',
            background: 'var(--bg)'
          } as React.CSSProperties}
          data-mobile={isMobile ? 'true' : undefined}
        >
          <div className={cn(
            "mx-auto w-full",
            // Mobile: padding menor
            isMobile ? "px-3 py-3" : "max-w-[1600px] px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
          )}>
            <div className="w-full break-words stack-responsive">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
})
