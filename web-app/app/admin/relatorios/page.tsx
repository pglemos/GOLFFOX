"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BarChart3, Download, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function RelatoriosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
    }
    getUser()
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
          <p className="text-[var(--muted)]">Visões de operação e análises</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Rotas do Dia", icon: FileText },
            { title: "Atrasos", icon: BarChart3 },
            { title: "Ocupação", icon: BarChart3 },
            { title: "Empresas Atendidas", icon: FileText },
            { title: "Ranking de Motoristas", icon: BarChart3 },
          ].map((report, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <report.icon className="h-8 w-8 text-[var(--brand)] mb-2" />
                  <h3 className="font-bold text-lg">{report.title}</h3>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

