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
          "flex items-center justify-start gap-2 py-2.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors relative",
          "min-h-[44px] sm:min-h-[40px] touch-manipulation",
          isActive 
            ? ((panel === 'operador' || panel === 'operator')
                ? "bg-orange-50 dark:bg-orange-900/20 text-orange-500" 
                : "bg-[#FFF7ED] text-[#F97316]")
            : "hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200"
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
        <div className="relative">
          <Icon 
            className={cn(
              "h-5 w-5 transition-colors flex-shrink-0",
              "stroke-[1.5px]",
              isActive 
                ? ((panel === 'operador' || panel === 'operator') ? "text-orange-500" : "text-[#F97316]")
                : ((panel === 'operador' || panel === 'operator') ? "text-gray-500 group-hover:text-orange-500" : "text-gray-500 group-hover:text-[#F97316]")
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
              ? ((panel === 'operador' || panel === 'operator') ? "text-orange-500 font-semibold" : "text-[#F97316] font-semibold")
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
          (panel === 'operador' || panel === 'operator') ? "bg-orange-500" : "bg-[#F97316]"
        )} />
      )}
    </div>
  )
}

// Logo component
const SidebarLogo = ({ panel }: { panel: 'admin' | 'operador' | 'transportadora' }) => {
  const { open } = useSidebar()
  
  return (
      <a
        href={(panel === 'operador' || panel === 'operator') ? '/operador' : panel === 'transportadora' ? '/transportadora' : '/admin'}
        className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20 mb-6"
      >
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
        (panel === 'operador' || panel === 'operator') ? "bg-orange-500" : "gradient-brand"
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
        </div>
      </motion.div>
    </a>
  )
}

// User profile component
const SidebarUser = ({ user, panel }: { 
  user?: { id: string; name: string; email: string }
  panel: 'admin' | 'operador' | 'transportadora'
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
          (panel === 'operador' || panel === 'operator') ? "bg-orange-500" : "gradient-brand"
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
  const menuItems = (panel === 'operador' || panel === 'operator')
    ? operadorMenuItems 
    : panel === 'transportadora' 
    ? transportadoraMenuItems 
    : adminMenuItems

  // Estado interno para controle de hover (desktop) e toggle (mobile)
  const [internalOpen, setInternalOpen] = React.useState(isOpen)

  // Sincronização com controle externo (mobile)
  useEffect(() => {
    setInternalOpen(isOpen)
  }, [isOpen])

  const router = useRouter()

  useEffect(() => {
    const items = (panel === 'operador' || panel === 'operator') ? operadorMenuItems : panel === 'transportadora' ? transportadoraMenuItems : adminMenuItems
    for (const item of items) {
      router.prefetch(item.href)
    }
  }, [panel, router])

  // Em desktop, iniciar fechado (apenas ícones)
  useEffect(() => {
    if (!isMobile) {
      setInternalOpen(false)
    }
  }, [isMobile])

  // Em desktop, não passar isOpen nem setOpen para permitir controle interno (hover)
  // Em mobile, passar ambos para controle externo
  return (
    <UISidebar 
      open={internalOpen} 
      setOpen={setInternalOpen} 
      animate={true}
      isMobile={isMobile}
    >
      <SidebarBody className={cn(
        "justify-between gap-4 bg-white dark:bg-neutral-900 border-r border-[var(--border)]",
        !isMobile && "fixed top-16 sm:top-18 left-0 h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] z-50",
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
        
        <SidebarUser user={user} panel={panel} />
      </SidebarBody>
    </UISidebar>
  )
}

