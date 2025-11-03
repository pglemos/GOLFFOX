"use client"

// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useEffect, useState } from "react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function CustosOperatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState<any>({ total: 0, divergencias: 0 })

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }
      setUser({ ...session.user })
      setLoading(false)
      loadResumo()
    }
    run()
  }, [router])

  const loadResumo = async () => {
    const { data } = await supabase.from('v_operator_costs').select('*').limit(100)
    const total = (data || []).reduce((acc: number, r: any) => acc + Number(r.total_cost || 0), 0)
    const divergencias = (data || []).reduce((acc: number, r: any) => acc + Number(r.total_discrepancy || 0), 0)
    setResumo({ total, divergencias })
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Custos & Faturas</h1>
            <p className="text-[var(--ink-muted)]">Resumo dos custos faturados pela GOLF FOX</p>
          </div>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Exportar</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6">
            <p className="text-sm text-[var(--ink-muted)]">Custo Total (período)</p>
            <p className="text-3xl font-bold mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.total)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-[var(--ink-muted)]">Divergências</p>
            <p className="text-3xl font-bold mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.divergencias)}</p>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
