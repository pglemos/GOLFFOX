"use client"
import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Sidebar as UISidebar, 
  SidebarBody, 
  SidebarLink as UISidebarLink,
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
  Building
} from "lucide-react"
import { useNavigation } from "@/hooks/use-navigation"
import { useEffect } from "react"
import { SyncAlertBadge } from "@/components/sync-alert-badge"
import { OperationalAlertsBadge } from "@/components/operational-alerts-badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

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
    icon: Building, 
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
    icon: Settings, 
    label: "Sincronização", 
    href: "/admin/sincronizacao",
    description: "Monitoramento de sincronização"
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
    href: "/carrier",
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
  user?: {
    id: string
    name: string
    email: string
  }
}

// Componente de Link customizado com badges e estados ativos
const CustomSidebarLink = ({ 
  item, 
  panel
}: { 
  item: typeof adminMenuItems[0]
  panel: 'admin' | 'operator' | 'carrier'
}) => {
  const pathname = usePathname()
  const router = useRouter()
  const { open } = useSidebar()
  const Icon = item.icon
  
  // Verificar se o item está ativo
  // Para dashboards, apenas rota exata
  const isDashboard = item.href === "/admin" || item.href === "/operator" || item.href === "/carrier"
  const isActive = isDashboard 
    ? pathname === item.href 
    : pathname === item.href || pathname?.startsWith(item.href + "/")
  
  const showSyncAlert = item.href === "/admin/sincronizacao"
  const showOperationalAlerts = (item.href === "/admin/alertas" || item.href === "/operator/alertas" || item.href === "/carrier/alertas")
  
  return (
    <div className="relative group">
      <Link
        href={item.href}
        prefetch={true}
        className={cn(
          "flex items-center justify-start gap-2 py-2 px-3 rounded-lg transition-colors relative",
          isActive 
            ? (panel === 'operator' 
                ? "bg-orange-50 dark:bg-orange-900/20 text-orange-500" 
                : "bg-[#FFF7ED] text-[#F97316]")
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        onMouseEnter={() => router.prefetch(item.href)}
        onClick={(e) => { e.preventDefault(); router.push(item.href) }}
      >
        <div className="relative">
          <Icon 
            className={cn(
              "h-5 w-5 transition-colors flex-shrink-0",
              "stroke-[1.5px]",
              isActive 
                ? (panel === 'operator' ? "text-orange-500" : "text-[#F97316]")
                : (panel === 'operator' ? "text-gray-500 group-hover:text-orange-500" : "text-gray-500 group-hover:text-[#F97316]")
            )} 
          />
          {(showSyncAlert || showOperationalAlerts) && open && (
            <div className="absolute -top-1 -right-1 flex gap-1">
              {showSyncAlert && <SyncAlertBadge />}
              {showOperationalAlerts && <OperationalAlertsBadge />}
            </div>
          )}
        </div>
        <motion.span
          animate={{
            opacity: open ? 1 : 0,
            display: open ? "inline-block" : "none",
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
          className={cn(
            "text-sm transition-colors whitespace-nowrap font-medium",
            isActive 
              ? (panel === 'operator' ? "text-orange-500 font-semibold" : "text-[#F97316] font-semibold")
              : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100"
          )}
          style={{
            overflow: "hidden",
          }}
        >
          {item.label}
        </motion.span>
      </Link>
      {isActive && (
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-r",
          panel === 'operator' ? "bg-orange-500" : "bg-[#F97316]"
        )} />
      )}
    </div>
  )
}

// Logo component
const SidebarLogo = ({ panel }: { panel: 'admin' | 'operator' | 'carrier' }) => {
  const { open } = useSidebar()
  
  return (
      <a
        href={panel === 'operator' ? '/operator' : panel === 'carrier' ? '/carrier' : '/admin'}
        className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20 mb-6"
      >
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
        panel === 'operator' ? "bg-orange-500" : "gradient-brand"
      )}>
        <span className="text-white text-xs font-bold">GF</span>
      </div>
      <motion.div
        animate={{
          opacity: open ? 1 : 0,
          display: open ? "block" : "none",
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
        className="overflow-hidden"
      >
        <div>
          <p className="text-xs font-semibold text-[var(--ink-strong)]">
            GOLF FOX
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            {panel === 'operator' ? 'v42.6' : 'v42.0'}
          </p>
        </div>
      </motion.div>
    </a>
  )
}

// User profile component
const SidebarUser = ({ user, panel }: { 
  user?: { id: string; name: string; email: string }
  panel: 'admin' | 'operator' | 'carrier'
}) => {
  const { open } = useSidebar()
  
  if (!user) return null
  
  // Usar iniciais do nome como fallback
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  return (
    <div className="border-t border-[var(--border)] pt-4 mt-auto">
      <a
        href="#"
        className="flex items-center justify-start gap-2 py-2 px-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white",
          panel === 'operator' ? "bg-orange-500" : "gradient-brand"
        )}>
          {initials}
        </div>
        <motion.span
          animate={{
            opacity: open ? 1 : 0,
            display: open ? "inline-block" : "none",
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
          className="text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap overflow-hidden"
        >
          {user.name}
        </motion.span>
      </a>
    </div>
  )
}

export function Sidebar({ isOpen = true, isMobile = false, panel = 'admin', user }: SidebarProps) {
  const { isSidebarItemActive } = useNavigation()
  
  // Selecionar menu baseado no painel
  const menuItems = panel === 'operator' 
    ? operatorMenuItems 
    : panel === 'carrier' 
    ? carrierMenuItems 
    : adminMenuItems

  // Estado inicial: fechado (apenas ícones)
  const [open, setOpen] = React.useState(false)

  const router = useRouter()

  useEffect(() => {
    const items = panel === 'operator' ? operatorMenuItems : panel === 'carrier' ? carrierMenuItems : adminMenuItems
    for (const item of items) {
      router.prefetch(item.href)
    }
  }, [panel, router])

  return (
    <UISidebar open={open} setOpen={setOpen} animate={true}>
      <SidebarBody className={cn(
        "justify-between gap-4 bg-white dark:bg-neutral-900 border-r border-[var(--border)]",
        "fixed top-16 sm:top-18 left-0 h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] z-50",
        "!px-0 !py-0"
      )}>
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pt-6 px-4 h-full">
          <div className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <motion.div key={item.href} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <CustomSidebarLink item={item} panel={panel} />
              </motion.div>
            ))}
          </div>
        </div>
        
        <SidebarUser user={user} panel={panel} />
      </SidebarBody>
    </UISidebar>
  )
}

