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
    href: "/transportadora/veiculos"
  },
  {
    id: "drivers",
    label: "Ver Motoristas",
    icon: Users,
    href: "/transportadora/motoristas"
  },
  {
    id: "alerts",
    label: "Ver Alertas",
    icon: AlertCircle,
    href: "/transportadora/alertas"
  },
  {
    id: "map",
    label: "Ver Mapa",
    icon: MapPin,
    href: "/transportadora/mapa"
  },
  {
    id: "reports",
    label: "Relatórios",
    icon: FileText,
    href: "/transportadora/relatorios"
  },
  {
    id: "costs",
    label: "Custos",
    icon: Download,
    href: "/transportadora/custos"
  }
]

export function QuickActions({ className }: QuickActionsProps) {
  const router = useRouter()

  const handleAction = (action: QuickAction) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/802544c4-70d0-43c7-a57c-6692b28ca17d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quick-actions.tsx:73',message:'Quick action clicked',data:{actionId:action.id,hasOnClick:!!action.onClick,hasHref:!!action.href,href:action.href},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      router.push(action.href)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="px-3 sm:px-6 pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Ações Rápidas</CardTitle>
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
                  onClick={() => handleAction(action)}
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

