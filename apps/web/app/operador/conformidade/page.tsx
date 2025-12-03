"use client"

// @ts-expect-error Legacy: valid em ambiente sem tipagem
import { AppShell } from "@/components/app-shell"
// @ts-expect-error Legacy: valid em ambiente sem tipagem
import { Card } from "@/components/ui/card"
import { Shield, FileWarning } from "lucide-react"
import { useEffect, useState } from "react"
// @ts-expect-error Legacy: valid em ambiente sem tipagem
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function ConformidadeOperatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [incidentes, setIncidentes] = useState<any[]>([])

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }
      setUser({ ...session.user })
      setLoading(false)
    }
    run()
  }, [router])

  useEffect(() => {
    if (user?.id) {
      load()
    }
  }, [user?.id])

  const load = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single()

      let query = supabase
        .from('gf_operator_incidents')
        .select('*')
        .order('created_at', { ascending: false })

      if (userData?.company_id) {
        query = query.eq('empresa_id', userData.company_id)
      }

      const { data, error } = await query

      if (error) throw error
      setIncidentes(data || [])
    } catch (error) {
      console.error("Erro ao carregar incidentes:", error)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Conformidade & SeguranÃ§a</h1>
          <p className="text-[var(--ink-muted)]">Incidentes, auditorias e documentos</p>
        </div>

        <div className="grid gap-4">
          {incidentes.map((i, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex items-center gap-3">
                <FileWarning className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <p className="font-semibold">{i.tipo} â€¢ {i.severidade}</p>
                  <p className="text-xs text-[var(--ink-muted)]">{new Date(i.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-[var(--bg-soft)] border border-[var(--border)]">{i.status}</span>
              </div>
            </Card>
          ))}
          {incidentes.length === 0 && (
            <Card className="p-12 text-center text-sm text-[var(--ink-muted)]">Nenhum incidente registrado.</Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}

