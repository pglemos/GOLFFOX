"use client"

// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Button } from "@/components/ui/button"
import { Plus, Columns } from "lucide-react"
import { useEffect, useState } from "react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SolicitacoesOperatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }
      setUser({ ...session.user })
      setLoading(false)
      load()
    }
    run()
  }, [router])

  const load = async () => {
    const { data } = await supabase.from('gf_service_requests').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  const columns = [
    { key: 'rascunho', label: 'Rascunho' },
    { key: 'enviado', label: 'Enviado' },
    { key: 'em_analise', label: 'Em Análise' },
    { key: 'aprovado', label: 'Aprovado' },
    { key: 'reprovado', label: 'Reprovado' },
  ]

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Solicitações & Mudanças</h1>
            <p className="text-[var(--ink-muted)]">Abra solicitações para a GOLF FOX e acompanhe o status</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" /> Nova Solicitação
          </Button>
        </div>

        <div className="grid md:grid-cols-5 gap-4">
          {columns.map(col => (
            <Card key={col.key} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{col.label}</h3>
                <Columns className="h-4 w-4 text-[var(--ink-muted)]" />
              </div>
              <div className="space-y-3">
                {items.filter(i => i.status === col.key).map(item => (
                  <div key={item.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-soft)]">
                    <p className="text-sm font-medium">{item.tipo}</p>
                    <p className="text-xs text-[var(--ink-muted)]">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                ))}
                {items.filter(i => i.status === col.key).length === 0 && (
                  <p className="text-xs text-[var(--ink-muted)]">Sem itens</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
