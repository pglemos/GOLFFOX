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
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Sempre inicia colapsado
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

  // Em mobile, começar fechado - em desktop também começa colapsado
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false)
      document.body.setAttribute('data-mobile', 'true')
    } else {
      // Desktop: inicia colapsado (false) - usuário expande se quiser
      setIsSidebarOpen(false)
      document.body.removeAttribute('data-mobile')
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
    <SidebarProvider
      defaultOpen={false} // Sempre inicia colapsado
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
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

      {/* Sidebar Premium - 254px expandido, 48px colapsado, floating variant */}
      <PremiumSidebar
        isOpen={isMobile ? isSidebarOpen : undefined}
        isMobile={isMobile}
        panel={detectedPanel}
        user={user ? { id: user.id, name: user.name || '', email: user.email, avatar_url: user.avatar_url } : { id: '', name: '', email: '' }}
      />

      {/* Content Area - flex-1 para ocupar resto do espaço */}
      <div className="flex flex-1 flex-col">
        {/* Topbar já retorna seu próprio header com os estilos corretos */}
        <Topbar
          user={user ? { id: user.id, name: user.name || '', email: user.email, role: user.role, avatar_url: user.avatar_url } : { id: '', name: '', email: '', role: 'operador' }}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          panelBranding={panelConfig.branding}
          panelHomeUrl={panelConfig.homeUrl}
        />

        {/* Main Content - Application Shell 08 EXATO */}
        <main
          className={cn(
            "flex-1 size-full",
            // Padding exato do Application Shell 08
            "px-4 py-6 sm:px-6"
          )}
        >
          {children}
        </main>

        {/* Footer - 20px (h-5), flex justify-between, padding responsivo */}
        <footer className={cn(
          "flex items-center justify-between gap-3",
          "h-5",   // 20px
          "px-4 pb-2 sm:px-6",
          "lg:gap-6",
          // Responsivo - empilha em mobile
          "max-lg:flex-col"
        )}>
          <p className="text-muted-foreground text-sm text-balance max-lg:text-center">
            ©2025{' '}
            <a href="https://golffox.com.br" className="text-primary hover:underline">
              Golf Fox
            </a>
            , Sistema de Gestão de Transporte
          </p>
          <div className={cn(
            "text-muted-foreground flex items-center gap-3 text-sm whitespace-nowrap",
            "*:hover:text-primary",
            "max-[450px]:flex-col min-[450px]:gap-4"
          )}>
            <a href="/termos" className="transition-colors">Termos de Uso</a>
            <a href="/privacidade" className="transition-colors">Privacidade</a>
            <a href="/suporte" className="transition-colors">Suporte</a>
          </div>
        </footer>
      </div>
    </SidebarProvider>
  )
})
