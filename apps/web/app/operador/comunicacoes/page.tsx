"use client"

import { Suspense, useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { BroadcastModal } from "@/components/operator/broadcast-modal"

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
        .select('company_id')
        .eq('id', session.user.id)
        .single()

      if (userData?.company_id) {
        setEmpresaId(userData.company_id)
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
        .select('*')
        .order('created_at', { ascending: false })
      
      if (empresaId) {
        query = query.eq('empresa_id', empresaId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error("Erro ao carregar comunicações:", error)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Comunicações</h1>
            <p className="text-[var(--ink-muted)]">Broadcasts internos e histórico</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setIsModalOpen(true)}>
            <Send className="h-4 w-4 mr-2" /> Novo Broadcast
          </Button>
        </div>

        <div className="grid gap-4">
          {items.map((m, i) => (
            <Card key={i} className="p-4">
              <p className="font-semibold">{m.title}</p>
              <p className="text-sm text-[var(--ink-muted)]">{m.message}</p>
              <p className="text-xs text-[var(--ink-muted)] mt-1">{new Date(m.created_at).toLocaleString('pt-BR')}</p>
            </Card>
          ))}
          {items.length === 0 && (
            <Card className="p-12 text-center text-sm text-[var(--ink-muted)]">Nenhuma comunicação ainda.</Card>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
      <ComunicacoesOperatorPageInner />
    </Suspense>
  )
}

