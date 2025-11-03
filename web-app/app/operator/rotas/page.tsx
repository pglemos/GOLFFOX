"use client"

import { useEffect, useState } from "react"
// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Badge } from "@/components/ui/badge"
import { Navigation, Users, MapPin, Plus } from "lucide-react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
// @ts-ignore
import { Button } from "@/components/ui/button"
// @ts-ignore
import { default as Link } from "next/link"

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
    }
    getUser()
  }, [router])

  useEffect(() => {
    if (user?.id) {
      loadRotas()
    }
  }, [user?.id])

  const loadRotas = async () => {
    try {
      // Filtrar rotas apenas da empresa do operador
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single()

      let query = supabase
        .from("routes")
        .select("*, companies(name), gf_route_plan(*, gf_employee_company(name, cpf))")
        .eq("is_active", true)

      if (userData?.company_id) {
        query = query.eq("company_id", userData.company_id)
      }

      const { data, error } = await query

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Rotas</h1>
            <p className="text-[var(--ink-muted)]">Solicite e acompanhe rotas atribuídas pela GOLF FOX</p>
          </div>
          <Link href="/operator/solicitacoes">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Solicitar Nova Rota
            </Button>
          </Link>
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
                  <p className="text-sm text-[var(--ink-muted)]">{rota.origin} → {rota.destination}</p>
                </div>
                <Link href={`/operator/rotas/mapa?route_id=${rota.id}`}>
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Ver no Mapa
                  </Button>
                </Link>
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

