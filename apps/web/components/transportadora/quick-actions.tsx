"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Truck, 
  Users, 
  FileText, 
  AlertCircle, 
  MapPin, 
  Wrench,
  Upload,
  Download
} from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { t } from "@/lib/i18n"

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
  variant?: "default" | "outline" | "secondary"
}

interface QuickActionsProps {
  className?: string
}

export function QuickActions({ className }: QuickActionsProps) {
  const router = useRouter()
  
  const defaultActions: QuickAction[] = [
    {
      id: "vehicles",
      label: t('transportadora', 'quick_actions_vehicles'),
      icon: Truck,
      href: "/transportadora/veiculos"
    },
    {
      id: "drivers",
      label: t('transportadora', 'quick_actions_drivers'),
      icon: Users,
      href: "/transportadora/motoristas"
    },
    {
      id: "alerts",
      label: t('transportadora', 'quick_actions_alerts'),
      icon: AlertCircle,
      href: "/transportadora/alertas"
    },
    {
      id: "map",
      label: t('transportadora', 'quick_actions_map'),
      icon: MapPin,
      href: "/transportadora/mapa"
    },
    {
      id: "reports",
      label: t('transportadora', 'quick_actions_reports'),
      icon: FileText,
      href: "/transportadora/relatorios"
    },
    {
      id: "costs",
      label: t('transportadora', 'quick_actions_costs'),
      icon: Download,
      href: "/transportadora/custos"
    }
  ]

  const handleAction = (action: QuickAction, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      router.push(action.href)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="px-3 sm:px-6 pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">{t('transportadora', 'quick_actions_title')}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {defaultActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={action.variant || "outline"}
                  className="w-full h-auto flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[80px] sm:min-h-[100px] touch-manipulation"
                  onClick={(e) => handleAction(action, e)}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-center leading-tight">{action.label}</span>
                </Button>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

