"use client"

// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Card } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import { useEffect, useState } from "react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function PrestadoresOperatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [prestadores, setPrestadores] = useState<any[]>([])

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }
      setUser({ ...session.user })
      setLoading(false)
      loadPrestadores()
    }
    run()
  }, [router])

  const loadPrestadores = async () => {
    const { data } = await supabase.from('v_operator_assigned_carriers').select('*').limit(50)
    setPrestadores(data || [])
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prestadores Alocados</h1>
          <p className="text-[var(--ink-muted)]">Lista read-only de transportadoras alocadas pela GOLF FOX</p>
        </div>

        <div className="grid gap-4">
          {prestadores.map((p, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <p className="font-semibold">{p.carrier_name || 'Transportadora'}</p>
                  <p className="text-xs text-[var(--ink-muted)]">Período: {p.period_start} — {p.period_end || 'atual'}</p>
                </div>
                <div className="text-sm text-right">
                  <p>SLA (Pontualidade): {(p.avg_punctuality || 0).toFixed(1)}%</p>
                  <p>Disponibilidade: {(p.avg_availability || 0).toFixed(1)}%</p>
                </div>
              </div>
            </Card>
          ))}
          {prestadores.length === 0 && (
            <Card className="p-12 text-center text-sm text-[var(--ink-muted)]">Nenhum prestador alocado.</Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
