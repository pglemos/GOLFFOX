"use client"

// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { useEffect, useState } from "react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function ComunicacoesOperatorPage() {
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
    const { data } = await supabase.from('gf_announcements').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Comunicações</h1>
            <p className="text-[var(--ink-muted)]">Broadcasts internos e histórico</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600"><Send className="h-4 w-4 mr-2" /> Novo Broadcast</Button>
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
      </div>
    </AppShell>
  )
}
