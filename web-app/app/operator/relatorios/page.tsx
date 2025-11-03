"use client"

// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"
import { useEffect, useState } from "react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function RelatoriosOperatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }
      setUser({ ...session.user })
      setLoading(false)
    }
    run()
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  const reports = [
    { id: 'atrasos', title: 'Atrasos', desc: 'Atrasos por rota/turno' },
    { id: 'ocupacao', title: 'Ocupação', desc: 'Ocupação por horário/rota' },
    { id: 'nao-embarcados', title: 'Não embarcados', desc: 'Motivos e frequência' },
    { id: 'eficiencia', title: 'Eficiência', desc: 'Planejado vs realizado' },
    { id: 'sla', title: 'SLA GOLF FOX', desc: 'Pontualidade de resposta' },
    { id: 'roi', title: 'ROI', desc: 'Custo por colaborador e tempo economizado' },
  ]

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
            <p className="text-[var(--ink-muted)]">Geração e exportação de relatórios</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {reports.map(r => (
            <Card key={r.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold">{r.title}</h3>
                  </div>
                  <p className="text-sm text-[var(--ink-muted)]">{r.desc}</p>
                </div>
                <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Exportar</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
