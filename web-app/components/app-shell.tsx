"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Topbar } from "./topbar"
import { Sidebar } from "./sidebar"
import { EnvVarsBanner } from "./env-vars-banner"
import dynamic from "next/dynamic"

// Lazy load PerformanceMonitor apenas em dev
const PerformanceMonitor = process.env.NODE_ENV === 'development' 
  ? dynamic(() => import('./performance-monitor').then(m => ({ default: m.PerformanceMonitor })), { ssr: false })
  : () => null

// Importar Web Vitals apenas em dev
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  require('@/lib/web-vitals')
}

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
export function AppShell({ user, children, panel }: AppShellProps) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detectar painel automaticamente se não fornecido
  const detectedPanel: 'admin' | 'operator' | 'carrier' = panel || 
    (pathname?.startsWith('/operator') ? 'operator' : 
     pathname?.startsWith('/carrier') ? 'carrier' : 'admin')
  
  // Configurações de branding por painel
  const panelConfig = {
    admin: {
      branding: 'Admin • Premium',
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
  }[detectedPanel]

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
      <div className="flex relative pt-16 sm:pt-18"> {/* pt-16/18 para compensar topbar fixa responsiva */}
        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

          {/* Sidebar */}
          <Sidebar isOpen={isSidebarOpen} isMobile={isMobile} panel={detectedPanel} />

        {/* Main Content */}
        <main className={`
          flex-1 min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-4.5rem)] transition-all duration-300 ease-in-out
          ${isSidebarOpen && !isMobile ? 'lg:ml-64' : 'ml-0'}
          w-full
        `}>
          <div className="mx-auto max-w-[1600px] px-6 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Performance Monitor (apenas em dev) */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceMonitor isVisible={true} />
      )}
    </div>
  )
}
