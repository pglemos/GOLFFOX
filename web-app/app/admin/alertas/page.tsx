"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Search, Filter } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function AlertasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<any[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadAlertas()
    }
    getUser()
  }, [router])

  const loadAlertas = async () => {
    try {
      const { data, error } = await supabase
        .from("gf_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setAlertas(data || [])
    } catch (error) {
      console.error("Erro ao carregar alertas:", error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Alertas</h1>
          <p className="text-[var(--muted)]">Histórico de alertas e notificações</p>
        </div>

        <Card className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
              <Input placeholder="Filtrar alertas..." className="pl-10" />
            </div>
            <select className="px-3 py-2 rounded-xl border border-[var(--muted)]/20">
              <option>Todos os tipos</option>
              <option>Crítico</option>
              <option>Aviso</option>
              <option>Info</option>
            </select>
          </div>
        </Card>

        <div className="grid gap-4">
          {alertas.map((alerta) => (
            <Card key={alerta.id} className="p-4">
              <div className="flex items-start gap-4">
                <AlertTriangle className={`h-5 w-5 ${alerta.severity === 'critical' ? 'text-[var(--err)]' : alerta.severity === 'warning' ? 'text-[var(--warn)]' : 'text-[var(--brand)]'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={alerta.severity === 'critical' ? 'destructive' : 'warning'}>{alerta.severity}</Badge>
                    <span className="text-sm text-[var(--muted)]">{new Date(alerta.created_at).toLocaleString()}</span>
                  </div>
                  <p className="font-medium">{alerta.message}</p>
                  {alerta.metadata && (
                    <p className="text-sm text-[var(--muted)] mt-1">{JSON.stringify(alerta.metadata)}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

