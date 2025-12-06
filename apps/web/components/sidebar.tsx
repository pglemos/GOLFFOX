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
  MessageSquare
} from "lucide-react"
import { useNavigation } from "@/hooks/use-navigation"
import { useEffect } from "react"
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
    icon: Building2,
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
    icon: Users,
    label: "Usuários",
    href: "/admin/usuarios",
    description: "Gestão de usuários"
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

const operadorMenuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/operador",
    description: "Visão geral do operador"
  },
  {
    icon: Users,
    label: "Funcionários",
    href: "/operador/funcionarios",
    description: "Gerencie seus funcionários"
  },
  {
    icon: Navigation,
    label: "Rotas",
    href: "/operador/rotas",
    description: "Solicitar e acompanhar rotas"
  },
  {
    icon: FileText,
    label: "Histórico de Rotas",
    href: "/operador/historico-rotas",
    description: "Histórico e métricas das rotas"
  },
  {
    icon: Building2,
    label: "Prestadores",
    href: "/operador/prestadores",
    description: "Transportadoras alocadas pela GOLF FOX"
  },
  {
    icon: FileText,
    label: "Solicitações",
    href: "/operador/solicitacoes",
    description: "Solicitações e mudanças para GOLF FOX"
  },
  {
    icon: DollarSign,
    label: "Custos",
    href: "/operador/custos",
    description: "Faturas e conciliação GOLF FOX"
  },
  {
    icon: AlertTriangle,
    label: "Alertas",
    href: "/operador/alertas",
    description: "Notificações do sistema"
  },
  {
    icon: BarChart3,
    label: "Relatórios",
    href: "/operador/relatorios",
    description: "Análise e exportação"
  },
  {
    icon: Shield,
    label: "Conformidade",
    href: "/operador/conformidade",
    description: "Incidentes e segurança"
  },
  {
    icon: MessageSquare,
    label: "Comunicações",
    href: "/operador/comunicacoes",
    description: "Broadcasts e mensagens"
  },
  {
    icon: Settings,
    label: "Preferências",
    href: "/operador/preferencias",
    description: "Configurações e integrações"
  },
  {
    icon: HelpCircle,
    label: "Ajuda",
    href: "/operador/ajuda",
    description: "Central de ajuda"
  }
]

const transportadoraMenuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/transportadora",
    description: "Visão geral da transportadora"
  },
  {
    icon: MapPin,
    label: "Mapa",
    href: "/transportadora/mapa",
    description: "Frota em tempo real"
  },
  {
    icon: Truck,
    label: "Veículos",
    href: "/transportadora/veiculos",
    description: "Frota da transportadora"
  },
  {
    icon: Users,
    label: "Motoristas",
    href: "/transportadora/motoristas",
    description: "Motoristas da transportadora"
  },
  {
    icon: AlertTriangle,
    label: "Alertas",
    href: "/transportadora/alertas",
    description: "Notificações"
  },
  {
    icon: DollarSign,
    label: "Custos",
    href: "/transportadora/custos",
    description: "Controle de custos"
  },
  {
    icon: BarChart3,
    label: "Relatórios",
    href: "/transportadora/relatorios",
    description: "Relatórios da transportadora"
  },
  {
    icon: HelpCircle,
    label: "Ajuda",
    href: "/transportadora/ajuda",
    description: "Central de ajuda"
  }
]

interface SidebarProps {
  isOpen?: boolean
  isMobile?: boolean
  panel?: 'admin' | 'operador' | 'transportadora'
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
  panel: 'admin' | 'operador' | 'transportadora'
}) => {
  const pathname = usePathname()
  const router = useRouter()
  const { open } = useSidebar()
  const Icon = item.icon

  // Verificar se o item está ativo
  // Para dashboards, apenas rota exata
  const isDashboard = item.href === "/admin" || item.href === "/operador" || item.href === "/transportadora"
  const isActive = isDashboard
    ? pathname === item.href
    : pathname === item.href || pathname?.startsWith(item.href + "/")

  const showOperationalAlerts = (item.href === "/admin/alertas" || item.href === "/operador/alertas" || item.href === "/transportadora/alertas")

  return (
    <div className="relative group">
      <Link
        href={item.href}
        prefetch={true}
        className={cn(
          "flex items-center justify-start gap-2 rounded-xl transition-all duration-300 relative group",
          "min-h-[44px] sm:min-h-[40px] touch-manipulation",
          "py-2.5 sm:py-2 px-3 sm:px-4",
          "backdrop-blur-sm",
          isActive
            ? (panel === 'operador'
              ? "bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/10 text-orange-500 shadow-sm"
              : "bg-gradient-to-r from-[#FFF7ED] to-[#FFF7ED]/80 text-[#F97316] shadow-sm")
            : "hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-50/50 dark:hover:from-gray-800/80 dark:hover:to-gray-800/50 active:bg-gray-100 dark:active:bg-gray-700"
        )}
        onMouseEnter={() => router.prefetch(item.href)}
        onClick={(e) => {
          e.preventDefault()
          router.push(item.href)
          // Fechar sidebar no mobile após clicar
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            const event = new CustomEvent('close-sidebar')
            window.dispatchEvent(event)
          }
        }}
      >
        <div className="relative flex-shrink-0">
          <Icon
            className={cn(
              "h-5 w-5 transition-all duration-200 flex-shrink-0 relative z-10",
              "stroke-[1.8px]",
              isActive
                ? (panel === 'operador' ? "text-orange-500 drop-shadow-sm" : "text-[#F97316] drop-shadow-sm")
                : (panel === 'operador' ? "text-gray-500 group-hover:text-orange-500 group-hover:drop-shadow-sm" : "text-gray-500 group-hover:text-[#F97316] group-hover:drop-shadow-sm")
            )}
          />
          {showOperationalAlerts && open && (
            <div className="absolute -top-1 -right-1 flex gap-1">
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
            "text-sm sm:text-base transition-colors whitespace-nowrap font-medium",
            isActive
              ? (panel === 'operador' ? "text-orange-500 font-semibold" : "text-[#F97316] font-semibold")
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
        <motion.div
          layoutId="activeIndicator"
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full",
            panel === 'operador' ? "bg-gradient-to-b from-orange-500 to-orange-400" : "bg-gradient-to-b from-[#F97316] to-[#FB923C]"
          )}
          initial={false}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        />
      )}
    </div>
  )
}

// Logo component
const SidebarLogo = ({ panel }: { panel: 'admin' | 'operador' | 'transportadora' }) => {
  const { open } = useSidebar()

  return (
    <a
      href={panel === 'operador' ? '/operador' : panel === 'transportadora' ? '/transportadora' : '/admin'}
      className={cn(
        "font-normal flex items-center text-sm text-black dark:text-white py-1 relative z-20 mb-6 transition-all",
        open ? "space-x-2" : "justify-center w-full"
      )}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden transition-transform duration-200 hover:scale-105 active:scale-95",
          panel === 'operador' ? "bg-gradient-to-br from-orange-500 to-orange-600" : "gradient-brand"
        )}
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"
        />
        <span className="text-white text-xs font-bold relative z-10 drop-shadow-sm">GF</span>
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
        </div>
      </motion.div>
    </a>
  )
}

export function Sidebar({ isOpen = false, isMobile = false, panel = 'admin', user }: SidebarProps) {
  const { isSidebarItemActive } = useNavigation()

  // Selecionar menu baseado no painel
  const menuItems = panel === 'operador'
    ? operadorMenuItems
    : panel === 'transportadora'
      ? transportadoraMenuItems
      : adminMenuItems

  // Estado interno para controle de hover (desktop) e toggle (mobile)
  // Em desktop, sempre começa fechado (false), em mobile usa o valor recebido
  const [internalOpen, setInternalOpen] = React.useState(isMobile ? isOpen : false)

  // Sincronização com controle externo (mobile)
  useEffect(() => {
    if (isMobile) {
      setInternalOpen(isOpen)
    } else {
      // Em desktop, sempre mantém fechado inicialmente
      setInternalOpen(false)
    }
  }, [isOpen, isMobile])

  const router = useRouter()

  useEffect(() => {
    const items = panel === 'operador' ? operadorMenuItems : panel === 'transportadora' ? transportadoraMenuItems : adminMenuItems
    for (const item of items) {
      router.prefetch(item.href)
    }
  }, [panel, router])


  // Em desktop, não passar isOpen nem setOpen para permitir controle interno (hover)
  // Em mobile, passar ambos para controle externo
  return (
    <UISidebar
      {...(isMobile ? { open: internalOpen, setOpen: setInternalOpen } : {})}
      animate={true}
      isMobile={isMobile}
    >
      <SidebarBody className={cn(
        "justify-between gap-4 bg-white dark:bg-neutral-900 border-r border-[var(--border)]",
        !isMobile && "top-16 sm:top-18 left-0 h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] z-50",
        isMobile && "w-[280px] sm:w-[300px]",
        "!px-0 !py-0"
      )}>
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pt-4 sm:pt-6 px-3 sm:px-4 h-full">
          <SidebarLogo panel={panel} />
          <div className="flex flex-col gap-1 mt-2">
            {menuItems.map((item) => (
              <motion.div key={item.href} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <CustomSidebarLink item={item} panel={panel} />
              </motion.div>
            ))}
          </div>
        </div>
      </SidebarBody>
    </UISidebar>
  )
}
