"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { useAuthFast } from "@/hooks/use-auth-fast"
import StopGenerator from '../../../../components/stop-generation/stop-generator'
import { useSearchParams } from "@/lib/next-navigation"
import { motion } from "framer-motion"

function GerarPontosContent() {
  const searchParams = useSearchParams()
  const { user, loading } = useAuthFast()
  const routeId = (searchParams?.get('routeId') as string) || ''

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-bg">
        <div className="w-8 h-8 border-2 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: user?.role || "admin", avatar_url: user?.avatar_url }} panel="admin">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">Gerador de Pontos da Rota</h1>
          <p className="text-ink-muted">Gere e otimize pontos de parada para suas rotas</p>
        </motion.div>

        {!routeId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-warning-light border-warning-light">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <p className="text-sm text-warning">Passe ?routeId=... na URL para carregar a rota.</p>
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="premium" className="p-6">
            <StopGenerator routeId={routeId} />
          </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <GerarPontosContent />
    </Suspense>
  )
}

