"use client"

import React, { useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Sidebar as UISidebar,
  SidebarBody,
  useSidebar
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  MapPin,
  Navigation,
  Truck,
  Users,
  Briefcase,
  Shield,
  LifeBuoy,
  AlertTriangle,
  BarChart3,
  DollarSign,
  HelpCircle,
  FileText,
  Building2,
  Settings,
  MessageSquare,
  LogOut
} from "lucide-react"
import { OperationalAlertsBadge } from "@/components/operational-alerts-badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

// Tipos para itens de menu
interface MenuItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  badge?: number | string
}

interface MenuGroup {
  label?: string
  items: MenuItem[]
}

interface PremiumSidebarProps {
  isOpen?: boolean
  isMobile?: boolean
  panel?: 'admin' | 'operador' | 'transportadora'
  user?: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
}

// Estrutura de menus agrupados conforme Application Shell 08
const adminMenuGroups: MenuGroup[] = [
  {
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/admin",
        badge: 5
      }
    ]
  },
  {
    label: "Core Pages",
    items: [
      {
        icon: MapPin,
        label: "Mapa",
        href: "/admin/mapa"
      },
      {
        icon: Navigation,
        label: "Rotas",
        href: "/admin/rotas"
      },
      {
        icon: Building2,
        label: "Transportadoras",
        href: "/admin/transportadoras"
      },
      {
        icon: Briefcase,
        label: "Empresas",
        href: "/admin/empresas"
      },
      {
        icon: Users,
        label: "Usuários",
        href: "/admin/usuarios"
      },
      {
        icon: LifeBuoy,
        label: "Socorro",
        href: "/admin/socorro"
      },
      {
        icon: AlertTriangle,
        label: "Alertas",
        href: "/admin/alertas",
        badge: 3
      }
    ]
  },
  {
    label: "Visualization",
    items: [
      {
        icon: BarChart3,
        label: "Relatórios",
        href: "/admin/relatorios"
      },
      {
        icon: DollarSign,
        label: "Custos",
        href: "/admin/custos"
      }
    ]
  }
]

const operadorMenuGroups: MenuGroup[] = [
  {
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/operador",
        badge: 5
      }
    ]
  },
  {
    label: "Core Pages",
    items: [
      {
        icon: Users,
        label: "Funcionários",
        href: "/operador/funcionarios"
      },
      {
        icon: Navigation,
        label: "Rotas",
        href: "/operador/rotas"
      },
      {
        icon: FileText,
        label: "Histórico",
        href: "/operador/historico-rotas"
      },
      {
        icon: Building2,
        label: "Prestadores",
        href: "/operador/prestadores"
      },
      {
        icon: FileText,
        label: "Solicitações",
        href: "/operador/solicitacoes"
      },
      {
        icon: AlertTriangle,
        label: "Alertas",
        href: "/operador/alertas",
        badge: 3
      }
    ]
  },
  {
    label: "Visualization",
    items: [
      {
        icon: DollarSign,
        label: "Custos",
        href: "/operador/custos"
      },
      {
        icon: BarChart3,
        label: "Relatórios",
        href: "/operador/relatorios"
      }
    ]
  }
]

const transportadoraMenuGroups: MenuGroup[] = [
  {
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/transportadora",
        badge: 5
      }
    ]
  },
  {
    label: "Core Pages",
    items: [
      {
        icon: MapPin,
        label: "Mapa",
        href: "/transportadora/mapa"
      },
      {
        icon: Truck,
        label: "Veículos",
        href: "/transportadora/veiculos"
      },
      {
        icon: Users,
        label: "Motoristas",
        href: "/transportadora/motoristas"
      },
      {
        icon: AlertTriangle,
        label: "Alertas",
        href: "/transportadora/alertas"
      }
    ]
  },
  {
    label: "Visualization",
    items: [
      {
        icon: DollarSign,
        label: "Custos",
        href: "/transportadora/custos"
      },
      {
        icon: BarChart3,
        label: "Relatórios",
        href: "/transportadora/relatorios"
      }
    ]
  }
]

// Logo no header do sidebar - Application Shell 08 style
const SidebarHeader = ({ panel }: { panel: 'admin' | 'operador' | 'transportadora' }) => {
  const { open } = useSidebar()
  
  const panelTitle = useMemo(() => {
    switch (panel) {
      case 'operador':
        return 'Operador'
      case 'transportadora':
        return 'Transportadora'
      default:
        return 'Administrativo'
    }
  }, [panel])

  // Ícone grande estilo Application Shell 08 (usando Sparkles ou similar como placeholder)
  const LogoIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 328 329" fill="none" xmlns="http://www.w3.org/2000/svg" className="[&_rect]:fill-sidebar [&_rect:first-child]:fill-primary">
      <rect y="0.5" width="328" height="328" rx="164" fill="currentColor" className="dark:fill-white fill-black" />
      <path d="M165.018 72.3008V132.771C165.018 152.653 148.9 168.771 129.018 168.771H70.2288" stroke="white" strokeWidth="20" className="dark:stroke-black stroke-white" />
      <path d="M166.627 265.241L166.627 204.771C166.627 184.889 182.744 168.771 202.627 168.771L261.416 168.771" stroke="white" strokeWidth="20" className="dark:stroke-black stroke-white" />
      <line x1="238.136" y1="98.8184" x2="196.76" y2="139.707" stroke="white" strokeWidth="20" className="dark:stroke-black stroke-white" />
      <line x1="135.688" y1="200.957" x2="94.3128" y2="241.845" stroke="white" strokeWidth="20" className="dark:stroke-black stroke-white" />
      <line x1="133.689" y1="137.524" x2="92.5566" y2="96.3914" stroke="white" strokeWidth="20" className="dark:stroke-black stroke-white" />
      <line x1="237.679" y1="241.803" x2="196.547" y2="200.671" stroke="white" strokeWidth="20" className="dark:stroke-black stroke-white" />
    </svg>
  )

  return (
    <div className="flex flex-col gap-2 p-2">
      <ul className="flex w-full min-w-0 flex-col gap-1">
        <li className="group/menu-item relative">
          <Link
            href={panel === 'operador' ? '/operador' : panel === 'transportadora' ? '/transportadora' : '/admin'}
            className={cn(
              "peer/menu-button flex w-full items-center overflow-hidden rounded-md p-2 text-left outline-hidden",
              "transition-[width,height,padding] focus-visible:ring-2",
              "h-12 text-sm gap-2.5 !bg-transparent",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "[&>svg]:size-8",
              open ? "gap-2.5" : "justify-center [&>svg]:size-8"
            )}
          >
            <LogoIcon />
            <AnimatePresence initial={false}>
              {open && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-xl font-semibold text-sidebar-foreground truncate"
                >
                  {panelTitle}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </li>
      </ul>
    </div>
  )
}

// Item de menu individual
const MenuItem = ({ item, index }: { item: MenuItem; index: number }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { open } = useSidebar()
  const Icon = item.icon
  
  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
  const showOperationalAlerts = item.href.includes("/alertas")

  return (
    <li className="group/menu-item relative">
      <Link
        href={item.href}
        className={cn(
          "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md text-left outline-hidden",
          "transition-[width,height,padding] focus-visible:ring-2 touch-manipulation",
          "group-has-[data-sidebar=menu-action]/menu-item:pr-8",
          item.badge && open && "pr-8",
          // Mobile: touch targets maiores (48x48px conforme plano), Desktop: menor (h-8)
          "min-h-[48px] p-3 text-sm sm:min-h-0 sm:h-8 sm:p-2",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "active:bg-sidebar-accent active:text-sidebar-accent-foreground", // Active state para mobile
          "[&>svg]:size-4 [&>svg]:shrink-0",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          !open && "justify-center [&>svg]:size-4"
        )}
        data-active={isActive}
        data-size="default"
      >
        <Icon className="shrink-0" />
        <AnimatePresence initial={false}>
          {open && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="truncate flex-1 [&:last-child]:truncate"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
      
      {/* Badge - Application Shell 08 style - fora do Link */}
      {item.badge && open && (
        <div className={cn(
          "text-sidebar-foreground pointer-events-none absolute right-1 top-1.5 flex h-5 min-w-5 items-center justify-center px-1 text-xs font-medium tabular-nums select-none",
          "bg-primary/10 rounded-full",
          "peer-hover/menu-button:text-sidebar-accent-foreground",
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground"
        )}>
          {item.badge}
        </div>
      )}
      
      {/* Operational Alerts Badge */}
      {showOperationalAlerts && open && (
        <div className="absolute -top-1 -right-1 z-10">
          <OperationalAlertsBadge />
        </div>
      )}
    </li>
  )
}

// Grupo de menu com label
const MenuGroup = ({ group }: { group: MenuGroup }) => {
  const { open } = useSidebar()
  
  return (
    <div className="relative flex w-full min-w-0 flex-col p-2">
      {group.label && open && (
        <div className="text-sidebar-foreground/70 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium">
          {group.label}
        </div>
      )}
      <div className="w-full text-sm">
        <ul className="flex w-full min-w-0 flex-col gap-1">
          {group.items.map((item, index) => (
            <MenuItem key={item.href} item={item} index={index} />
          ))}
        </ul>
      </div>
    </div>
  )
}

// Footer com promoção Premium (opcional)
const SidebarFooter = () => {
  const { open } = useSidebar()
  
  return (
    <div className={cn("flex flex-col gap-2 p-2", !open && "hidden")}>
      <div className="flex flex-col items-start gap-4 overflow-hidden rounded-md p-2">
        <p className="truncate text-xl font-semibold">Go to Premium</p>
        <p className="line-clamp-2 text-sm text-sidebar-foreground/70">
          Explore premium features and advanced analytics
        </p>
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 min-h-[48px] h-auto p-3 sm:min-h-0 sm:h-9 sm:p-2 touch-manipulation">
          Upgrade
        </Button>
      </div>
    </div>
  )
}

// Perfil do usuário
const UserProfile = ({ user }: { user?: PremiumSidebarProps['user'] }) => {
  const { open } = useSidebar()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getUserInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  if (!open) {
    return (
      <div className="flex justify-center p-2">
        <Avatar className="h-8 w-8 border-2 border-sidebar-border">
          <AvatarImage src={user?.avatar_url} alt={user?.name || 'User'} />
          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
            {getUserInitials(user?.name)}
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-2 border-t border-sidebar-border">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors">
        <Avatar className="h-8 w-8 border-2 border-sidebar-border">
          <AvatarImage src={user?.avatar_url} alt={user?.name || 'User'} />
          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
            {getUserInitials(user?.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {user?.name || 'Usuário'}
          </p>
          <p className="text-xs text-sidebar-foreground/70 truncate">
            {user?.email || 'email@exemplo.com'}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full justify-start min-h-[48px] h-auto p-3 sm:min-h-0 sm:h-8 sm:p-2 hover:bg-sidebar-accent touch-manipulation"
      >
        <LogOut className="h-4 w-4 mr-2" />
        {isLoggingOut ? 'Saindo...' : 'Sair'}
      </Button>
    </div>
  )
}

// Componente principal
export function PremiumSidebar({
  isOpen = false,
  isMobile = false,
  panel = 'admin',
  user
}: PremiumSidebarProps) {
  const router = useRouter()
  
  const menuGroups = useMemo(() => {
    switch (panel) {
      case 'operador':
        return operadorMenuGroups
      case 'transportadora':
        return transportadoraMenuGroups
      default:
        return adminMenuGroups
    }
  }, [panel])

  const [internalOpen, setInternalOpen] = React.useState(isMobile ? isOpen : false)

  useEffect(() => {
    if (isMobile) {
      setInternalOpen(isOpen)
    } else {
      setInternalOpen(false)
    }
  }, [isOpen, isMobile])

  useEffect(() => {
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        router.prefetch(item.href)
      })
    })
  }, [menuGroups, router])

  return (
    <UISidebar
      {...(isMobile ? { open: internalOpen, setOpen: setInternalOpen } : {})}
      animate={true}
      isMobile={isMobile}
    >
      <SidebarBody
        className={cn(
          "flex flex-col bg-sidebar border-r border-sidebar-border",
          !isMobile && "top-16 sm:top-18 left-0 h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] z-50",
          isMobile && "w-[280px] sm:w-[300px]",
          "!px-0 !py-0"
        )}
        role="complementary"
        aria-label="Barra lateral de navegação"
      >
        {/* Header */}
        <SidebarHeader panel={panel} />

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
          {menuGroups.map((group, groupIndex) => (
            <MenuGroup key={groupIndex} group={group} />
          ))}
        </div>

        {/* Footer Premium (opcional) */}
        <SidebarFooter />

        {/* User Profile */}
        <UserProfile user={user} />
      </SidebarBody>
    </UISidebar>
  )
}
