"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function OperatorRotasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [rotas, setRotas] = useState<any[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadRotas()
    }
    getUser()
  }, [router])

  const loadRotas = async () => {
    try {
      const { data, error } = await supabase
        .from("routes")
        .select("*, companies(name), gf_route_plan(*, gf_employee_company(name, cpf))")
        .eq("is_active", true)

      if (error) throw error
      setRotas(data || [])
    } catch (error) {
      console.error("Erro ao carregar rotas:", error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Rotas dos Funcionários</h1>
          <p className="text-[var(--muted)]">Visualize em qual rota cada funcionário está</p>
        </div>

        <div className="grid gap-4">
          {rotas.map((rota) => (
            <Card key={rota.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="h-5 w-5 text-[var(--brand)]" />
                    <h3 className="font-bold text-lg">{rota.name}</h3>
                    <Badge>{rota.companies?.name || "Sem empresa"}</Badge>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{rota.origin} → {rota.destination}</p>
                </div>
              </div>

              {rota.gf_route_plan && rota.gf_route_plan.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Funcionários nesta rota:</h4>
                  <div className="space-y-2">
                    {rota.gf_route_plan
                      .filter((stop: any) => stop.gf_employee_company)
                      .map((stop: any, idx: number) => (
                        <div key={idx} className="p-2 bg-[var(--bg-soft)] rounded-lg flex items-center gap-2">
                          <Users className="h-4 w-4 text-[var(--muted)]" />
                          <div>
                            <p className="text-sm font-medium">{stop.gf_employee_company.name}</p>
                            <p className="text-xs text-[var(--muted)]">CPF: {stop.gf_employee_company.cpf} • Ordem: {stop.stop_order}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

