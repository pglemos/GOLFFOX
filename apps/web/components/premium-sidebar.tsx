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
import { supabase } from "@/lib/supabase"

// Tipos para itens de menu
interface MenuItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  description?: string
  badge?: React.ReactNode
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

// Menus por painel
const adminMenuItems: MenuItem[] = [
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

const operadorMenuItems: MenuItem[] = [
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

const transportadoraMenuItems: MenuItem[] = [
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

// Componente de Logo Premium
const PremiumSidebarLogo = ({ panel }: { panel: 'admin' | 'operador' | 'transportadora' }) => {
  const { open } = useSidebar()
  
  const panelBranding = useMemo(() => {
    switch (panel) {
      case 'operador':
        return { text: 'GOLF FOX', subtitle: 'Operador' }
      case 'transportadora':
        return { text: 'GOLF FOX', subtitle: 'Transportadora' }
      default:
        return { text: 'GOLF FOX', subtitle: 'Admin • Premium' }
    }
  }, [panel])

  return (
    <div className="px-4 py-4 mb-2">
      <Link
        href={panel === 'operador' ? '/operador' : panel === 'transportadora' ? '/transportadora' : '/admin'}
        className="flex items-center gap-3 group/logo"
        aria-label="GOLF FOX - Ir para página inicial"
      >
        <motion.div
          className={cn(
            "relative flex-shrink-0 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-[#F97316] to-[#FB923C]",
            "shadow-lg shadow-orange-500/20",
            open ? "w-12 h-12" : "w-10 h-10"
          )}
          animate={{
            scale: open ? 1 : 0.9,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ willChange: 'transform' }}
          aria-hidden="true"
        >
          <span className="text-white font-bold text-lg">GF</span>
        </motion.div>
        
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: -10, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: -10, width: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                  {panelBranding.text}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  {panelBranding.subtitle}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    </div>
  )
}

// Componente de Link Premium com animações
const PremiumSidebarLink = ({
  item,
  panel,
  index
}: {
  item: MenuItem
  panel: 'admin' | 'operador' | 'transportadora'
  index: number
}) => {
  const pathname = usePathname()
  const router = useRouter()
  const { open } = useSidebar()
  const Icon = item.icon
  const [isHovered, setIsHovered] = React.useState(false)

  const isDashboard = item.href === "/admin" || item.href === "/operador" || item.href === "/transportadora"
  const isActive = isDashboard
    ? pathname === item.href
    : pathname === item.href || pathname?.startsWith(item.href + "/")

  const showOperationalAlerts = item.href.includes("/alertas")

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    router.push(item.href)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const event = new CustomEvent('close-sidebar')
      window.dispatchEvent(event)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.03,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group/item"
    >
      <Link
        href={item.href}
        prefetch={true}
        onClick={handleClick}
        className={cn(
          "relative flex items-center gap-3 rounded-xl transition-all duration-300",
          "min-h-[48px] touch-manipulation px-4 py-2.5",
          "group/link",
          isActive
            ? "bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/10 text-orange-600 dark:text-orange-400 shadow-sm shadow-orange-500/10"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 active:bg-gray-200 dark:active:bg-gray-700"
        )}
        onMouseEnter={() => router.prefetch(item.href)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e)
          }
        }}
        aria-current={isActive ? "page" : undefined}
        aria-label={item.description ? `${item.label} - ${item.description}` : item.label}
        role="menuitem"
        tabIndex={0}
      >
        {/* Indicador de item ativo */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className={cn(
              "absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full",
              "bg-gradient-to-b from-orange-500 via-orange-500 to-orange-400",
              "shadow-sm shadow-orange-500/50"
            )}
            initial={false}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30
            }}
            style={{ willChange: 'transform' }}
          />
        )}

        {/* Ícone */}
        <div className="relative flex-shrink-0">
          <motion.div
            animate={{
              scale: isHovered && !isActive ? 1.1 : 1,
              rotate: isHovered && !isActive ? 5 : 0,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ willChange: 'transform' }}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-all duration-200 flex-shrink-0",
                "stroke-[2px]",
                isActive
                  ? "text-orange-600 dark:text-orange-400 drop-shadow-sm"
                  : "text-gray-500 dark:text-gray-400 group-hover/link:text-orange-500 dark:group-hover/link:text-orange-400"
              )}
            />
          </motion.div>
          
          {/* Badge de alertas */}
          {showOperationalAlerts && open && (
            <div className="absolute -top-1 -right-1">
              <OperationalAlertsBadge />
            </div>
          )}
        </div>

        {/* Label e descrição */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="flex-1 min-w-0 overflow-hidden"
            >
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-sm font-medium leading-tight transition-colors",
                    isActive
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-gray-900 dark:text-gray-100 group-hover/link:text-gray-950 dark:group-hover/link:text-white"
                  )}
                >
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                    {item.description}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicador de hover */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity duration-300"
          initial={false}
          aria-hidden="true"
        />
      </Link>
    </motion.div>
  )
}

// Componente de Perfil do Usuário
const PremiumUserProfile = ({ 
  user, 
  panel 
}: { 
  user?: PremiumSidebarProps['user']
  panel: 'admin' | 'operador' | 'transportadora'
}) => {
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

  return (
    <div className="px-4 py-4 mt-auto border-t border-gray-200 dark:border-gray-800">
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Informações do usuário */}
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Avatar className="h-10 w-10 border-2 border-orange-200 dark:border-orange-900">
                <AvatarImage src={user?.avatar_url} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold">
                  {getUserInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || 'email@exemplo.com'}
                </p>
              </div>
            </div>

            {/* Botão de logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? 'Saindo...' : 'Sair'}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex justify-center"
          >
            <Avatar className="h-10 w-10 border-2 border-orange-200 dark:border-orange-900">
              <AvatarImage src={user?.avatar_url} alt={user?.name || 'User'} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold text-sm">
                {getUserInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Componente principal Premium Sidebar
export function PremiumSidebar({ 
  isOpen = false, 
  isMobile = false, 
  panel = 'admin', 
  user 
}: PremiumSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  
  // Selecionar menu baseado no painel
  const menuItems = useMemo(() => {
    switch (panel) {
      case 'operador':
        return operadorMenuItems
      case 'transportadora':
        return transportadoraMenuItems
      default:
        return adminMenuItems
    }
  }, [panel])

  // Estado interno para controle
  const [internalOpen, setInternalOpen] = React.useState(isMobile ? isOpen : false)

  // Sincronização com controle externo (mobile)
  useEffect(() => {
    if (isMobile) {
      setInternalOpen(isOpen)
    } else {
      setInternalOpen(false)
    }
  }, [isOpen, isMobile])

  // Prefetch das rotas
  useEffect(() => {
    for (const item of menuItems) {
      router.prefetch(item.href)
    }
  }, [menuItems, router])

  return (
    <UISidebar
      {...(isMobile ? { open: internalOpen, setOpen: setInternalOpen } : {})}
      animate={true}
      isMobile={isMobile}
    >
      <SidebarBody
        className={cn(
          "flex flex-col bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-gray-800",
          !isMobile && "top-16 sm:top-18 left-0 h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] z-50",
          isMobile && "w-[280px] sm:w-[300px]",
          "!px-0 !py-0"
        )}
        role="complementary"
        aria-label="Barra lateral de navegação"
      >
        {/* Logo */}
        <PremiumSidebarLogo panel={panel} />

        {/* Navegação */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
          <nav 
            className="flex flex-col gap-1" 
            role="navigation" 
            aria-label={`Menu de navegação - ${panel === 'operador' ? 'Operador' : panel === 'transportadora' ? 'Transportadora' : 'Administrativo'}`}
          >
            {menuItems.map((item, index) => (
              <PremiumSidebarLink
                key={item.href}
                item={item}
                panel={panel}
                index={index}
              />
            ))}
          </nav>
        </div>

        {/* Perfil do usuário */}
        <PremiumUserProfile user={user} panel={panel} />
      </SidebarBody>
    </UISidebar>
  )
}

