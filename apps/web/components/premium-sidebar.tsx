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
  ChevronRight,
  Wrench,
  Award,
  TrendingUp
} from "lucide-react"
import { OperationalAlertsBadge } from "@/components/operational-alerts-badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// Tipos para itens de menu
interface MenuItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  badge?: number | string
  showOperationalAlerts?: boolean
  children?: MenuItem[]  // Sub-menus
}

interface MenuGroup {
  label?: string
  items: MenuItem[]
}

interface PremiumSidebarProps {
  isOpen?: boolean
  isMobile?: boolean
  panel?: 'admin' | 'operador' | 'transportadora' | 'empresa'
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
        href: "/admin/transportadoras",
        children: [
          {
            icon: Users,
            label: "Motoristas",
            href: "/admin/transportadoras/motoristas"
          },
          {
            icon: Truck,
            label: "Veículos",
            href: "/admin/transportadoras/veiculos"
          }
        ]
      },
      {
        icon: Briefcase,
        label: "Empresas",
        href: "/admin/empresas",
        children: [
          {
            icon: Users,
            label: "Funcionários",
            href: "/admin/empresas/funcionarios"
          }
        ]
      },
      {
        icon: Users,
        label: "Usuários",
        href: "/admin/usuarios"
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
        icon: TrendingUp,
        label: "Projeções",
        href: "/admin/projecoes"
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
  },
  {
    label: "Sistema",
    items: [
      {
        icon: BarChart3,
        label: "Monitoramento",
        href: "/admin/monitoramento"
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
        icon: Users,
        label: "Funcionários",
        href: "/operador/funcionarios"
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
        href: "/transportadora/veiculos",
        children: [
          {
            icon: Wrench,
            label: "Manutenção",
            href: "/transportadora/veiculos/manutencao"
          }
        ]
      },
      {
        icon: Users,
        label: "Motoristas",
        href: "/transportadora/motoristas",
        children: [
          {
            icon: Award,
            label: "Ranking",
            href: "/transportadora/motoristas/ranking"
          },
          {
            icon: BarChart3,
            label: "SLA",
            href: "/transportadora/motoristas/sla"
          }
        ]
      },
      {
        icon: Navigation,
        label: "Rotas",
        href: "/transportadora/rotas"
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
    label: "Financeiro",
    items: [
      {
        icon: DollarSign,
        label: "Custos",
        href: "/transportadora/custos"
      },
      {
        icon: TrendingUp,
        label: "Receitas",
        href: "/transportadora/receitas"
      },
      {
        icon: BarChart3,
        label: "Margens",
        href: "/transportadora/margens"
      }
    ]
  },
  {
    label: "Visualização",
    items: [
      {
        icon: FileText,
        label: "Relatórios",
        href: "/transportadora/relatorios"
      }
    ]
  }
]

const empresaMenuGroups: MenuGroup[] = [
  {
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/empresa",
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
        href: "/empresa/rotas/mapa"
      },
      {
        icon: Navigation,
        label: "Rotas",
        href: "/empresa/rotas"
      },
      {
        icon: Users,
        label: "Funcionários",
        href: "/empresa/funcionarios"
      },
      {
        icon: FileText,
        label: "Contratos",
        href: "/empresa/contratos"
      },
      {
        icon: Building2,
        label: "Centros de Custo",
        href: "/empresa/centros-custo"
      }
    ]
  },
  {
    label: "Visualização",
    items: [
      {
        icon: DollarSign,
        label: "Custos",
        href: "/empresa/custos"
      },
      {
        icon: BarChart3,
        label: "Relatórios",
        href: "/empresa/relatorios"
      },
      {
        icon: LifeBuoy,
        label: "Suporte",
        href: "/empresa/suporte"
      }
    ]
  }
]

// Avatar no header do sidebar - 32x32
const SidebarLogo = ({ panel, user }: { panel: 'admin' | 'operador' | 'transportadora' | 'empresa', user?: { name: string, email: string, avatar_url?: string } }) => {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  // Iniciais do nome para fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <button
            type="button"
            data-slot="button"
            className={cn(
              "focus-visible:border-ring focus-visible:ring-ring/50 inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
              "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
              "size-9",
              isCollapsed ? "mx-auto" : "ml-1"
            )}
            aria-label="User menu"
          >
            <Avatar className="size-8 rounded-md">
              {user?.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={user?.name || 'User'} />
              ) : null}
              <AvatarFallback className="rounded-md text-xs">
                {user?.name ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
          </button>
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
      case 'empresa':
        return empresaMenuGroups
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

  // Verificar estado do sidebar para esconder subitens quando colapsado
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar variant="floating" collapsible="icon">
      {/* Avatar/Header */}
      <SidebarLogo panel={panel} user={user} />

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
                    <React.Fragment key={item.href}>
                      <SidebarMenuItem>
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
                      {/* Sub-menus hierárquicos - ícones visíveis mesmo colapsado */}
                      {item.children && item.children.length > 0 && (
                        <div className={cn(
                          "space-y-1",
                          !isCollapsed && "ml-6 border-l border-border/50 pl-2"
                        )}>
                          {item.children.map((child) => {
                            const isChildActive = isItemActive(child.href)
                            const ChildIcon = child.icon
                            return (
                              <SidebarMenuItem key={child.href}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={isChildActive}
                                  tooltip={child.label}
                                  className={cn(
                                    "h-8 text-sm",
                                    isCollapsed && "justify-center px-2"
                                  )}
                                >
                                  <Link
                                    href={child.href}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      navigateWithTransition(child.href)
                                    }}
                                  >
                                    <ChildIcon className="size-4" />
                                    {!isCollapsed && <span>{child.label}</span>}
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            )
                          })}
                        </div>
                      )}
                    </React.Fragment>
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
