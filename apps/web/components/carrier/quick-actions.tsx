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

const defaultActions: QuickAction[] = [
  {
    id: "vehicles",
    label: "Ver Veículos",
    icon: Truck,
    href: "/carrier/veiculos"
  },
  {
    id: "drivers",
    label: "Ver Motoristas",
    icon: Users,
    href: "/carrier/motoristas"
  },
  {
    id: "alerts",
    label: "Ver Alertas",
    icon: AlertCircle,
    href: "/carrier/alertas"
  },
  {
    id: "map",
    label: "Ver Mapa",
    icon: MapPin,
    href: "/carrier/mapa"
  },
  {
    id: "reports",
    label: "Relatórios",
    icon: FileText,
    href: "/carrier/relatorios"
  },
  {
    id: "costs",
    label: "Custos",
    icon: Download,
    href: "/carrier/custos"
  }
]

export function QuickActions({ className }: QuickActionsProps) {
  const router = useRouter()

  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      router.push(action.href)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {defaultActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant={action.variant || "outline"}
                  className="w-full h-auto flex flex-col items-center gap-2 p-4"
                  onClick={() => handleAction(action)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs sm:text-sm">{action.label}</span>
                </Button>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

