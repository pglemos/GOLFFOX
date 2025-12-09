"use client"

import React, { useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useViewTransition } from "@/hooks/use-view-transition"
import {
  Sidebar as UISidebar,
  SidebarBody,
  useSidebar
} from "@/components/ui/sidebar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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

// Logo no header do sidebar - Application Shell 08 style (exatamente como original)
const SidebarHeader = ({ panel }: { panel: 'admin' | 'operador' | 'transportadora' }) => {
  const { open } = useSidebar()

  // Ícone grande estilo Application Shell 08
  const LogoIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 328 329" fill="none" xmlns="http://www.w3.org/2000/svg" className="[&_rect]:fill-sidebar [&_rect:first-child]:fill-primary">
      <rect y="0.5" width="328" height="328" rx="164" fill="black" className="dark:fill-white" />
      <path d="M165.018 72.3008V132.771C165.018 152.653 148.9 168.771 129.018 168.771H70.2288" stroke="white" strokeWidth="20" className="dark:stroke-black" />
      <path d="M166.627 265.241L166.627 204.771C166.627 184.889 182.744 168.771 202.627 168.771L261.416 168.771" stroke="white" strokeWidth="20" className="dark:stroke-black" />
      <line x1="238.136" y1="98.8184" x2="196.76" y2="139.707" stroke="white" strokeWidth="20" className="dark:stroke-black" />
      <line x1="135.688" y1="200.957" x2="94.3128" y2="241.845" stroke="white" strokeWidth="20" className="dark:stroke-black" />
      <line x1="133.689" y1="137.524" x2="92.5566" y2="96.3914" stroke="white" strokeWidth="20" className="dark:stroke-black" />
      <line x1="237.679" y1="241.803" x2="196.547" y2="200.671" stroke="white" strokeWidth="20" className="dark:stroke-black" />
    </svg>
  )

  return (
    <div data-slot="sidebar-header" data-sidebar="header" className="flex flex-col gap-2 p-2">
      <ul data-slot="sidebar-menu" data-sidebar="menu" className="flex w-full min-w-0 flex-col gap-1">
        <li data-slot="sidebar-menu-item" data-sidebar="menu-item" className="group/menu-item relative">
          <Link
            href={panel === 'operador' ? '/operador' : panel === 'transportadora' ? '/transportadora' : '/admin'}
            data-slot="sidebar-menu-button"
            data-sidebar="menu-button"
            data-size="lg"
            data-active="false"
            className={cn(
              "peer/menu-button ring-sidebar-ring active:bg-sidebar-accent active:text-sidebar-accent-foreground",
              "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
              "data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground",
              "flex w-full items-center overflow-hidden rounded-md p-2 text-left outline-hidden",
              "transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8",
              "group-data-[collapsible=icon]:size-8! focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
              "aria-disabled:pointer-events-none aria-disabled:opacity-50",
              "data-[active=true]:font-medium [&>span:last-child]:truncate [&>svg]:shrink-0",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 text-sm group-data-[collapsible=icon]:p-0! gap-2.5 !bg-transparent [&>svg]:size-8"
            )}
          >
            <LogoIcon />
            <span className="text-xl font-semibold">Analytics</span>
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
  const { navigateWithTransition, isPending } = useViewTransition()
  const Icon = item.icon
  
  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
  const showOperationalAlerts = item.href.includes("/alertas")

  return (
    <li data-slot="sidebar-menu-item" data-sidebar="menu-item" className="group/menu-item relative">
      <Link
        href={item.href}
        data-slot="sidebar-menu-button"
        data-sidebar="menu-button"
        data-size="default"
        data-active={isActive ? "true" : "false"}
        data-state="closed"
        className={cn(
          "peer/menu-button ring-sidebar-ring active:bg-sidebar-accent active:text-sidebar-accent-foreground",
          "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
          "data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground",
          "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-hidden",
          "transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8",
          "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
          "focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
          "aria-disabled:pointer-events-none aria-disabled:opacity-50",
          "data-[active=true]:font-medium [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm",
          !open && "justify-center [&>svg]:size-4"
        )}
      >
        <Icon className="shrink-0" />
        {open && <span>{item.label}</span>}
      </Link>
      
      {/* Badge - Application Shell 08 style */}
      {item.badge && (
        <div 
          data-slot="sidebar-menu-badge" 
          data-sidebar="menu-badge"
          className={cn(
            "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center px-1 text-xs font-medium tabular-nums select-none",
            "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
            "peer-data-[size=sm]/menu-button:top-1 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5",
            "group-data-[collapsible=icon]:hidden bg-primary/10 rounded-full",
            !open && "hidden"
          )}
        >
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

// Grupo de menu com label - Application Shell 08 style
const MenuGroup = ({ group }: { group: MenuGroup }) => {
  const { open } = useSidebar()
  
  return (
    <div data-slot="sidebar-group" data-sidebar="group" className="relative flex w-full min-w-0 flex-col p-2">
      {group.label && (
        <div 
          data-slot="sidebar-group-label" 
          data-sidebar="group-label"
          className={cn(
            "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
            !open && "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0"
          )}
        >
          {group.label}
        </div>
      )}
      <div data-slot="sidebar-group-content" data-sidebar="group-content" className="w-full text-sm">
        <ul data-slot="sidebar-menu" data-sidebar="menu" className="flex w-full min-w-0 flex-col gap-1">
          {group.items.map((item, index) => (
            <MenuItem key={item.href} item={item} index={index} />
          ))}
        </ul>
      </div>
    </div>
  )
}

// Footer com promoção Premium - Application Shell 08 style
const SidebarFooter = () => {
  const { open } = useSidebar()
  
  return (
    <div data-slot="sidebar-footer" data-sidebar="footer" className={cn("flex flex-col gap-2 p-2", !open && "hidden", "[[data-state=collapsed]_&]:hidden")}>
      <div className="flex flex-col items-start gap-4 overflow-hidden rounded-md p-2">
        <p className="truncate text-xl font-semibold">Go to Premium</p>
        <p className="line-clamp-2 text-sm">
          Explore 600+ courses with lifetime membership
        </p>
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 min-h-[48px] h-auto p-3 sm:min-h-0 sm:h-9 sm:p-2 touch-manipulation truncate">
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

// Conteúdo da sidebar (reutilizável para Sheet e Sidebar)
const SidebarContentInner = ({ panel, menuGroups, user }: { 
  panel: 'admin' | 'operador' | 'transportadora'
  menuGroups: MenuGroup[]
  user?: PremiumSidebarProps['user']
}) => {
  return (
    <>
      {/* Header */}
      <SidebarHeader panel={panel} />

      {/* Content */}
      <div data-slot="sidebar-content" data-sidebar="content" className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden">
        {menuGroups.map((group, groupIndex) => (
          <MenuGroup key={groupIndex} group={group} />
        ))}
      </div>

      {/* Footer Premium (opcional) */}
      <SidebarFooter />

      {/* User Profile */}
      <UserProfile user={user} />
    </>
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

  useEffect(() => {
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        router.prefetch(item.href)
      })
    })
  }, [menuGroups, router])

  // Em mobile, usar Sheet (drawer)
  if (isMobile) {
    return (
      <Sheet 
        open={isOpen} 
        onOpenChange={(open) => {
          // Disparar evento customizado para fechar sidebar
          if (!open) {
            window.dispatchEvent(new CustomEvent('close-sidebar'))
          }
        }}
      >
        <SheetContent 
          side="left" 
          className="w-[280px] sm:w-[300px] p-0 bg-sidebar border-r border-sidebar-border overflow-y-auto scroll-smooth-touch"
          style={{
            paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex flex-col h-full">
            <SidebarContentInner panel={panel} menuGroups={menuGroups} user={user} />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Em desktop, usar Sidebar normal
  // Não passar open (undefined) para permitir hover automático + toggle manual via useSidebar() hook
  // Isso permite que o SidebarTrigger no topbar controle o sidebar em desktop usando useSidebar()
  return (
    <UISidebar
      animate={true}
      isMobile={false}
    >
      <SidebarBody
        className={cn(
          "flex flex-col bg-sidebar border-r border-sidebar-border",
          "top-16 sm:top-18 left-0 h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] z-50",
          "!px-0 !py-0"
        )}
        role="complementary"
        aria-label="Barra lateral de navegação"
      >
        <SidebarContentInner panel={panel} menuGroups={menuGroups} user={user} />
      </SidebarBody>
    </UISidebar>
  )
}
