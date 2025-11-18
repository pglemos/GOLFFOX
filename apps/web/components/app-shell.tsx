"use client"

import { useState, useEffect, memo, useMemo } from "react"
import { usePathname } from "next/navigation"
import { Topbar } from "./topbar"
import { Sidebar } from "./sidebar-new"
import { EnvVarsBanner } from "./env-vars-banner"
import { cn } from "@/lib/utils"

interface AppShellProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  children: React.ReactNode
  panel?: 'admin' | 'operator' | 'carrier'
}

// Named export for AppShell component
export const AppShell = memo(function AppShell({ user, children, panel }: AppShellProps) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detectar painel automaticamente se não fornecido (memoizado)
  const detectedPanel: 'admin' | 'operator' | 'carrier' = useMemo(() => 
    panel || 
    (pathname?.startsWith('/operator') ? 'operator' : 
     pathname?.startsWith('/carrier') ? 'carrier' : 'admin'),
    [panel, pathname]
  )
  
  // Configurações de branding por painel (memoizado)
  const panelConfig = useMemo(() => ({
    admin: {
      branding: 'Administrativo',
      homeUrl: '/admin'
    },
    operator: {
      branding: 'Operador',
      homeUrl: '/operator'
    },
    carrier: {
      branding: 'Transportadora',
      homeUrl: '/carrier'
    }
  }[detectedPanel]), [detectedPanel])

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] overflow-x-hidden">
      {/* Banner de Variáveis de Ambiente */}
      <EnvVarsBanner />
      
      {/* Topbar Fixa */}
      <Topbar 
        user={user} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        panelBranding={panelConfig.branding}
        panelHomeUrl={panelConfig.homeUrl}
      />

      {/* Container Principal */}
      <div className={cn(
        "flex relative pt-16 sm:pt-18",
        isMobile ? "flex-col" : "flex-row"
      )}> {/* pt-16/18 para compensar topbar fixa responsiva */}
        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          isMobile={isMobile} 
          panel={detectedPanel}
          user={user}
        />

        {/* Main Content */}
        <main className={cn(
          "min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-4.5rem)] transition-all duration-300 ease-in-out",
          "overflow-y-auto bg-[var(--bg)]",
          !isMobile ? "flex-1 lg:ml-[60px]" : "w-full ml-0 flex-shrink-0",
          "max-w-full overflow-x-hidden",
          "relative z-10"
        )}>
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8 w-full max-w-full">
            <div className="w-full max-w-full overflow-x-hidden">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Performance Monitor removido */}
    </div>
  )
})
