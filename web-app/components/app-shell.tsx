"use client"

import { useState, useEffect } from "react"
import { Topbar } from "./topbar"
import { Sidebar } from "./sidebar"

interface AppShellProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  children: React.ReactNode
}

export function AppShell({ user, children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

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
      {/* Topbar Fixa */}
      <Topbar 
        user={user} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
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
        <Sidebar isOpen={isSidebarOpen} isMobile={isMobile} />

        {/* Main Content */}
        <main className={`
          flex-1 min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-4.5rem)] transition-all duration-300 ease-in-out
          ${isSidebarOpen && !isMobile ? 'lg:ml-64' : 'ml-0'}
          w-full
        `}>
          <div className="container-responsive py-4 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
