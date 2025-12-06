"use client"

import { useState, useEffect, memo, useMemo } from "react"
import { usePathname } from "next/navigation"
import { Topbar } from "./topbar"
import { Sidebar } from "./sidebar"
import { EnvVarsBanner } from "./env-vars-banner"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

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
  const [isMobile, setIsMobile] = useState(false)

  // #region agent log
  useEffect(() => {
    console.log('[DEBUG APPSHELL] 📦 User prop received:', JSON.stringify(user, null, 2));
    console.log('[DEBUG APPSHELL] 🖼️ Avatar URL:', user?.avatar_url);
  }, [user]);
  // #endregion

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

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileWidth = window.innerWidth < 1024
      setIsMobile(isMobileWidth)
      if (isMobileWidth) {
        setIsSidebarOpen(false)
        document.body.setAttribute('data-mobile', 'true')
      } else {
        // Em desktop, garantir que sidebar inicia fechada
        setIsSidebarOpen(false)
        document.body.removeAttribute('data-mobile')
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    // Listener para fechar sidebar no mobile
    const handleCloseSidebar = () => {
      if (isMobile) {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('close-sidebar', handleCloseSidebar as EventListener)

    return () => {
      window.removeEventListener('resize', checkScreenSize)
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
        user={user ? { id: user.id, name: user.name || '', email: user.email, role: user.role, avatar_url: user.avatar_url } : { id: '', name: '', email: '', role: 'passenger' }}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        panelBranding={panelConfig.branding}
        panelHomeUrl={panelConfig.homeUrl}
      />

      {/* Container Principal */}
      <div className={cn(
        "flex relative w-full",
        isMobile ? "flex-col pt-16" : "flex-row pt-16 sm:pt-18"
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

        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          panel={detectedPanel}
          user={user ? { id: user.id, name: user.name || '', email: user.email } : { id: '', name: '', email: '' }}
        />

        {/* Main Content */}
        <main
          className={cn(
            "min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-4.5rem)] transition-all duration-300 ease-in-out",
            isMobile ? "overflow-visible" : "overflow-y-auto",
            "overflow-x-hidden bg-[var(--bg)] pb-12 sm:pb-14",
            !isMobile ? "flex-1 lg:ml-[60px]" : "w-full ml-0 flex-shrink-0",
            "max-w-full w-full",
            "relative z-10"
          )}
          style={{
            backgroundImage: 'none',
            background: 'var(--bg)'
          } as React.CSSProperties}
          data-mobile={isMobile ? 'true' : undefined}
        >
          <div className="mx-auto max-w-[1600px] px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 w-full max-w-full min-w-0">
            <div className="w-full max-w-full min-w-0 overflow-x-hidden break-words stack-responsive">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
})
