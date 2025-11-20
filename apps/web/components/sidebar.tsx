"use client"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
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
  MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"
import { listItem, staggerContainer, sidebarHighlight } from "@/lib/animations"
import { useNavigation } from "@/hooks/use-navigation"
import { OperationalAlertsBadge } from "@/components/operational-alerts-badge"

// Menus por painel
const adminMenuItems = [
  { 
    icon: LayoutDashboard, 
    label: "Dashboard", 
    href: "/admin",
    description: "Visão geral do sistema"
  },
  { 
    icon: MapPin, 
    label: "Mapa", 
    href: "/admin/mapa",
    description: "Frota em tempo real"
  },
  { 
    icon: Navigation, 
    label: "Rotas", 
    href: "/admin/rotas",
    description: "Gerenciar itinerários"
  },
  { 
    icon: Truck, 
    label: "Veículos", 
    href: "/admin/veiculos",
    description: "Frota e manutenção"
  },
  { 
    icon: Truck, 
    label: "Transportadoras", 
    href: "/admin/transportadoras",
    description: "Gestão de transportadoras"
  },
  { 
    icon: Briefcase, 
    label: "Empresas", 
    href: "/admin/empresas",
    description: "Operadores"
  },
  { 
    icon: Shield, 
    label: "Permissões", 
    href: "/admin/permissoes",
    description: "Controle de acesso"
  },
  { 
    icon: LifeBuoy, 
    label: "Socorro", 
    href: "/admin/socorro",
    description: "Despache de emergência"
  },
  { 
    icon: AlertTriangle, 
    label: "Alertas", 
    href: "/admin/alertas",
    description: "Notificações do sistema"
  },
  { 
    icon: BarChart3, 
    label: "Relatórios", 
    href: "/admin/relatorios",
    description: "Análise operacional"
  },
  { 
    icon: DollarSign, 
    label: "Custos", 
    href: "/admin/custos",
    description: "Gestão financeira"
  },
  { 
    icon: HelpCircle, 
    label: "Ajuda & Suporte", 
    href: "/admin/ajuda-suporte",
    description: "Central de ajuda"
  }
]

const operatorMenuItems = [
  { 
    icon: LayoutDashboard, 
    label: "Dashboard", 
    href: "/operator",
    description: "Visão geral do operador"
  },
  { 
    icon: Users, 
    label: "Funcionários", 
    href: "/operator/funcionarios",
    description: "Gerencie seus funcionários"
  },
  { 
    icon: Navigation, 
    label: "Rotas", 
    href: "/operator/rotas",
    description: "Solicitar e acompanhar rotas"
  },
  { 
    icon: Building2, 
    label: "Prestadores", 
    href: "/operator/prestadores",
    description: "Transportadoras alocadas pela GOLF FOX"
  },
  { 
    icon: FileText, 
    label: "Solicitações", 
    href: "/operator/solicitacoes",
    description: "Solicitações e mudanças para GOLF FOX"
  },
  { 
    icon: DollarSign, 
    label: "Custos", 
    href: "/operator/custos",
    description: "Faturas e conciliação GOLF FOX"
  },
  { 
    icon: AlertTriangle, 
    label: "Alertas", 
    href: "/operator/alertas",
    description: "Notificações do sistema"
  },
  { 
    icon: BarChart3, 
    label: "Relatórios", 
    href: "/operator/relatorios",
    description: "Análise e exportação"
  },
  { 
    icon: Shield, 
    label: "Conformidade", 
    href: "/operator/conformidade",
    description: "Incidentes e segurança"
  },
  { 
    icon: MessageSquare, 
    label: "Comunicações", 
    href: "/operator/comunicacoes",
    description: "Broadcasts e mensagens"
  },
  { 
    icon: Settings, 
    label: "Preferências", 
    href: "/operator/preferencias",
    description: "Configurações e integrações"
  },
  { 
    icon: HelpCircle, 
    label: "Ajuda", 
    href: "/operator/ajuda",
    description: "Central de ajuda"
  }
]

const carrierMenuItems = [
  { 
    icon: LayoutDashboard, 
    label: "Dashboard", 
    href: "/transportadora",
    description: "Visão geral da transportadora"
  },
  { 
    icon: MapPin, 
    label: "Mapa", 
    href: "/carrier/mapa",
    description: "Frota em tempo real"
  },
  { 
    icon: Truck, 
    label: "Veículos", 
    href: "/carrier/veiculos",
    description: "Frota da transportadora"
  },
  { 
    icon: Users, 
    label: "Motoristas", 
    href: "/carrier/motoristas",
    description: "Motoristas da transportadora"
  },
  { 
    icon: AlertTriangle, 
    label: "Alertas", 
    href: "/carrier/alertas",
    description: "Notificações"
  },
  { 
    icon: DollarSign, 
    label: "Custos", 
    href: "/carrier/custos",
    description: "Controle de custos"
  },
  { 
    icon: BarChart3, 
    label: "Relatórios", 
    href: "/carrier/relatorios",
    description: "Relatórios da transportadora"
  },
  { 
    icon: HelpCircle, 
    label: "Ajuda", 
    href: "/carrier/ajuda",
    description: "Central de ajuda"
  }
]

interface SidebarProps {
  isOpen?: boolean
  isMobile?: boolean
  panel?: 'admin' | 'operator' | 'carrier'
}

export function Sidebar({ isOpen = true, isMobile = false, panel = 'admin' }: SidebarProps) {
  const { isSidebarItemActive } = useNavigation()
  
  // Selecionar menu baseado no painel
  const menuItems = panel === 'operator' 
    ? operatorMenuItems 
    : panel === 'carrier' 
    ? carrierMenuItems 
    : adminMenuItems

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: isMobile ? -280 : 0, opacity: isMobile ? 0 : 1 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: isMobile ? -280 : 0, opacity: isMobile ? 0 : 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "fixed top-16 sm:top-18 left-0 h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] w-64 bg-white border-r border-[var(--border)] z-50 overflow-y-auto",
            isMobile ? "lg:hidden" : "hidden lg:block"
          )}
        >
          <nav className="h-full flex flex-col py-6 px-4">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-1 flex-1"
            >
              {menuItems.map((item, _i) => {
                const Icon = item.icon
                const isActive = isSidebarItemActive(item.href)
                const showOperationalAlerts = (item.href === "/admin/alertas" || item.href === "/operator/alertas" || item.href === "/carrier/alertas")
                
                return (
                  <motion.div
                    key={item.href}
                    variants={listItem}
                  >
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        "nav-link relative group",
                        isActive && "active"
                      )}
                    >
                      <motion.div
                        variants={sidebarHighlight}
                        whileHover="hover"
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-1 rounded-r opacity-0 group-hover:opacity-100 transition-opacity",
                          panel === 'operator' ? "bg-orange-500" : "bg-[var(--brand)]"
                        )}
                      />
                      <Icon 
                        className={cn(
                          "h-5 w-5 transition-colors flex-shrink-0",
                          "stroke-[1.5px]",
                          isActive 
                            ? (panel === 'operator' ? "text-orange-500" : "text-[var(--brand)]")
                            : (panel === 'operator' ? "text-[var(--ink-muted)] group-hover:text-orange-500" : "text-[var(--ink-muted)] group-hover:text-[var(--brand)]")
                        )} 
                      />
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <span className={cn(
                          "block transition-colors",
                          isActive 
                            ? (panel === 'operator' ? "text-orange-500 font-semibold" : "text-[var(--brand)] font-semibold")
                            : "group-hover:text-[var(--ink-strong)]"
                        )}>
                          {item.label}
                        </span>
                        <div className="flex items-center gap-1">
                          {showOperationalAlerts && <OperationalAlertsBadge />}
                        </div>
                      </div>
                      
                      {/* Tooltip - apenas em desktop */}
                      {!isMobile && (
                        <div className="absolute left-full ml-3 hidden group-hover:block z-[var(--z-tooltip)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="px-3 py-2 rounded-lg bg-[var(--accent)] text-white text-xs shadow-lg whitespace-nowrap">
                            {item.description}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[var(--accent)]"></div>
                          </div>
                        </div>
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
            
            {/* Footer */}
            <div className="border-t border-[var(--border)] pt-4 mt-auto">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                  panel === 'operator' ? "bg-orange-500" : "gradient-brand"
                )}>
                  <span className="text-white text-xs font-bold">GF</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--ink-strong)]">
                    GOLF FOX
                  </p>
                </div>
              </div>
            </div>
          </nav>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
