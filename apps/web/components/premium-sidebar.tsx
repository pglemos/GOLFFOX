"use client"

import React, { useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "@/lib/next-navigation"
import {
  Sidebar,
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
  TrendingUp,
  MessageSquare,
  Layers,
  Activity,
  PieChart,
  Gauge,
  UserCircle,
  UsersRound
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
            icon: UserCircle,
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
            icon: UsersRound,
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
        icon: PieChart,
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
        icon: Activity,
        label: "Monitoramento",
        href: "/admin/monitoramento"
      },
      {
        icon: Layers,
        label: "Escalonamento",
        href: "/admin/escalonamento"
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
            icon: Gauge,
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
        icon: PieChart,
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
      },
      {
        icon: MessageSquare,
        label: "Mensagens",
        href: "/transportadora/mensagens"
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
        icon: Award,
        label: "Satisfação",
        href: "/empresa/satisfacao"
      },
      {
        icon: LifeBuoy,
        label: "Suporte",
        href: "/empresa/suporte"
      }
    ]
  }
]


// Componente principal PremiumSidebar
export function PremiumSidebar({
  isOpen,
  isMobile = false,
  panel = 'admin',
  user
}: PremiumSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

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
                            prefetch={true}
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
                                    prefetch={true}
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
