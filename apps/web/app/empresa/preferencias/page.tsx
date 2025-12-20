"use client"

import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthFast } from "@/hooks/use-auth-fast"

export default function PreferenciasOperatorPage() {
  const { user, loading: authLoading } = useAuthFast()
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    if (user) {
      load()
    }
  }, [user])

  const load = async () => {
    const { data } = await supabase.from('gf_operator_settings').select('*').limit(1).maybeSingle()
    setSettings(data)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-muted">Carregando informações do usuário...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Operador", email: user.email, role: user.role || "operador", avatar_url: user.avatar_url }} panel="operador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Preferências & Integrações</h1>
            <p className="text-ink-muted">Definições de turnos, tolerâncias e conectores</p>
          </div>
          <Button variant="outline"><Settings className="h-4 w-4 mr-2" /> Salvar</Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-xl transition-all duration-300">
          <p className="text-sm text-ink-muted">Em breve: formulário de turnos padrão, tolerâncias, centros de custo, feriados corporativos e conectores (RH/SSO/Webhooks/API Keys).</p>
          {settings && (
            <pre className="mt-4 text-xs bg-bg-soft p-3 rounded-lg overflow-auto">{JSON.stringify(settings, null, 2)}</pre>
          )}
        </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}
