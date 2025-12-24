"use client"

import { useEffect, useState } from "react"

import { motion } from "framer-motion"
import { Shield, FileWarning } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { useRouter } from "@/lib/next-navigation"
import { supabase } from "@/lib/supabase"
import { logError } from "@/lib/logger"

export default function ConformidadeOperatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [incidentes, setIncidentes] = useState<any[]>([])

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }
      setUser({ ...session.user })
      setLoading(false)
    }
    run()
  }, [router])

  useEffect(() => {
    if (user?.id) {
      load()
    }
  }, [user?.id])

  const load = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('empresa_id')
        .eq('id', user?.id)
        .single()

      let query = supabase
        .from('gf_incidents')
        .select('id, empresa_id, tipo, severidade, status, description, created_at, updated_at, resolved_at')
        .order('created_at', { ascending: false })

      if (userData?.empresa_id) {
        query = query.eq('empresa_id', userData.empresa_id)
      }

      const { data, error } = await query

      if (error) throw error
      setIncidentes(data || [])
    } catch (error) {
      logError("Erro ao carregar incidentes", { error }, 'ConformidadePage')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Conformidade & Segurança</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Incidentes, auditorias e documentos</p>
          </div>
        </div>

        <div className="grid gap-4">
          {incidentes.map((i, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="group"
            >
            <Card key={idx} className="p-4 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:border-brand/30">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-brand-light">
                  <FileWarning className="h-4 w-4 text-brand" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{i.tipo} â€¢ {i.severidade}</p>
                  <p className="text-xs text-ink-muted">{new Date(i.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-bg-soft border border-border">{i.status}</span>
              </div>
            </Card>
            </motion.div>
          ))}
          {incidentes.length === 0 && (
            <Card className="p-12 text-center text-sm text-ink-muted">Nenhum incidente registrado.</Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}

