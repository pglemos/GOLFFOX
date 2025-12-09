"use client"

import React, { useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useViewTransition } from "@/hooks/use-view-transition"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  useSidebar
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  MapPin,
  Navigation,
  Truck,
  Users,
  Briefcase,
  LifeBuoy,
  AlertTriangle,
  BarChart3,
  DollarSign,
  FileText,
  Building2,
  ChevronRight
} from "lucide-react"
import { OperationalAlertsBadge } from "@/components/operational-alerts-badge"
import { cn } from "@/lib/utils"

// Tipos para itens de menu
interface MenuItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  badge?: number | string
  showOperationalAlerts?: boolean
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
    label: "Páginas Principais",
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
        icon: Truck,
        label: "Veículos",
        href: "/admin/veiculos"
      },
      {
        icon: AlertTriangle,
        label: "Alertas",
        href: "/admin/alertas",
        showOperationalAlerts: true
      }
    ]
  },
  {
    label: "Visualização",
    items: [
      {
        icon: DollarSign,
        label: "Custos",
        href: "/admin/custos"
      },
      {
        icon: BarChart3,
        label: "Analytics",
        href: "/admin/analytics"
      },
      {
        icon: FileText,
        label: "Relatórios",
        href: "/admin/relatorios"
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
    label: "Páginas Principais",
    items: [
      {
        icon: MapPin,
        label: "Mapa",
        href: "/operador/mapa"
      },
      {
        icon: Navigation,
        label: "Rotas",
        href: "/operador/rotas"
      },
      {
        icon: AlertTriangle,
        label: "Alertas",
        href: "/operador/alertas",
        showOperationalAlerts: true
      }
    ]
  },
  {
    label: "Visualização",
    items: [
      {
        icon: BarChart3,
        label: "Relatórios",
        href: "/operador/relatorios"
      },
      {
        icon: LifeBuoy,
        label: "Suporte",
        href: "/operador/suporte"
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
    label: "Páginas Principais",
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
        href: "/transportadora/alertas",
        showOperationalAlerts: true
      }
    ]
  },
  {
    label: "Visualização",
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

// Logo no header do sidebar
const SidebarLogo = ({ panel }: { panel: 'admin' | 'operador' | 'transportadora' }) => {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const panelLabels = {
    admin: 'Admin',
    operador: 'Operador',
    transportadora: 'Transport'
  }

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild className="!bg-transparent">
            <Link href={`/${panel === 'admin' ? 'admin' : panel}`}>
              {/* Logo SVG - estilo Application Shell 08 */}
              <svg
                width="1em"
                height="1em"
                viewBox="0 0 328 329"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn(
                  "[&_rect]:fill-sidebar [&_rect:first-child]:fill-primary",
                  isCollapsed ? "size-8" : "size-8"
                )}
              >
                <rect y="0.5" width="328" height="328" rx="164" fill="black" className="dark:fill-white" />
                <path d="M165.018 72.3008V132.771C165.018 152.653 148.9 168.771 129.018 168.771H70.2288" stroke="white" strokeWidth="20" className="dark:stroke-black" />
                <path d="M166.627 265.241L166.627 204.771C166.627 184.889 182.744 168.771 202.627 168.771L261.416 168.771" stroke="white" strokeWidth="20" className="dark:stroke-black" />
                <line x1="238.136" y1="98.8184" x2="196.76" y2="139.707" stroke="white" strokeWidth="20" className="dark:stroke-black" />
                <line x1="135.688" y1="200.957" x2="94.3128" y2="241.845" stroke="white" strokeWidth="20" className="dark:stroke-black" />
                <line x1="133.689" y1="137.524" x2="92.5566" y2="96.3914" stroke="white" strokeWidth="20" className="dark:stroke-black" />
                <line x1="237.679" y1="241.803" x2="196.547" y2="200.671" stroke="white" strokeWidth="20" className="dark:stroke-black" />
              </svg>
              <span className="text-xl font-semibold">Golf Fox</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}

// Componente principal PremiumSidebar
export function PremiumSidebar({
  isOpen,
  isMobile = false,
  panel = 'admin',
  user
}: PremiumSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { navigateWithTransition } = useViewTransition()

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

  // Prefetch de rotas
  useEffect(() => {
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        router.prefetch(item.href)
      })
    })
  }, [menuGroups, router])

  // Verificar se um item está ativo
  const isItemActive = (href: string) => {
    if (href === `/${panel}` || href === '/admin') {
      return pathname === href
    }
    return pathname?.startsWith(href) ?? false
  }

  return (
    <Sidebar variant="floating" collapsible="icon">
      {/* Logo/Header */}
      <SidebarLogo panel={panel} />

      {/* Content */}
      <SidebarContent>
        {menuGroups.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            {group.label && (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = isItemActive(item.href)
                  const Icon = item.icon

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link
                          href={item.href}
                          onClick={(e) => {
                            e.preventDefault()
                            navigateWithTransition(item.href)
                          }}
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {/* Badge */}
                      {item.badge && (
                        <SidebarMenuBadge className="bg-primary/10 rounded-full">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                      {/* Operational Alerts Badge */}
                      {item.showOperationalAlerts && (
                        <div className="absolute -top-1 -right-1 z-10">
                          <OperationalAlertsBadge />
                        </div>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
