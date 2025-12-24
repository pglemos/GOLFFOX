"use client"

import { Suspense, useEffect, useState } from "react"

import { motion } from "framer-motion"
import { Send } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { BroadcastModal } from "@/components/empresa/broadcast-modal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "@/lib/next-navigation"
import { supabase } from "@/lib/supabase"
import { logError } from "@/lib/logger"

function ComunicacoesOperatorPageInner() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [empresaId, setEmpresaId] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }
      
      const { data: userData } = await supabase
        .from('users')
        .select('empresa_id')
        .eq('id', session.user.id)
        .single()

      if (userData?.empresa_id) {
        setEmpresaId(userData.empresa_id)
      }
      
      setUser({ ...session.user })
      setLoading(false)
    }
    run()
  }, [router])

  useEffect(() => {
    if (empresaId) {
      load()
    }
  }, [empresaId])

  const load = async () => {
    try {
      let query = supabase
        .from('gf_announcements')
        .select('id, empresa_id, transportadora_id, title, message, type, target_role, expires_at, is_active, published_at, created_at')
        .order('created_at', { ascending: false })
      
      if (empresaId) {
        query = query.eq('empresa_id', empresaId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setItems(data || [])
    } catch (error) {
      logError("Erro ao carregar comunicações", { error }, 'ComunicacoesPage')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Comunicações</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Broadcasts internos e histórico</p>
          </div>
          <Button className="w-full sm:w-auto bg-brand hover:bg-brand-hover" onClick={() => setIsModalOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Broadcast</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        <div className="grid gap-4">
          {items.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group"
            >
            <Card key={i} className="p-4 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:border-text-brand/30">
              <p className="font-semibold">{m.title}</p>
              <p className="text-sm text-ink-muted">{m.message}</p>
              <p className="text-xs text-ink-muted mt-1">{new Date(m.created_at).toLocaleString('pt-BR')}</p>
            </Card>
            </motion.div>
          ))}
          {items.length === 0 && (
            <Card className="p-12 text-center text-sm text-ink-muted">Nenhuma comunicação ainda.</Card>
          )}
        </div>

        {empresaId && (
          <BroadcastModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={() => {
              load()
              setIsModalOpen(false)
            }}
            empresaId={empresaId}
          />
        )}
      </div>
    </AppShell>
  )
}

export default function ComunicacoesOperatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
      <ComunicacoesOperatorPageInner />
    </Suspense>
  )
}

