"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LifeBuoy, Send } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SocorroPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ocorrencias, setOcorrencias] = useState<any[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadOcorrencias()
    }
    getUser()
  }, [router])

  const loadOcorrencias = async () => {
    try {
      const { data, error } = await supabase
        .from("gf_assistance_requests")
        .select("*")
        .eq("status", "open")

      if (error) throw error
      setOcorrencias(data || [])
    } catch (error) {
      console.error("Erro ao carregar ocorrências:", error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Socorro</h1>
          <p className="text-[var(--muted)]">Gerencie ocorrências e emergências</p>
        </div>

        <div className="grid gap-4">
          {ocorrencias.map((ocorrencia) => (
            <Card key={ocorrencia.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <LifeBuoy className="h-5 w-5 text-[var(--err)]" />
                    <h3 className="font-bold text-lg">{ocorrencia.request_type}</h3>
                    <Badge variant="destructive">{ocorrencia.status}</Badge>
                  </div>
                  <p className="text-sm text-[var(--muted)] mb-2">{ocorrencia.description}</p>
                  <p className="text-xs text-[var(--muted)]">Localização: {ocorrencia.address || `${ocorrencia.latitude}, ${ocorrencia.longitude}`}</p>
                  <p className="text-xs text-[var(--muted)]">Hora: {new Date(ocorrencia.created_at).toLocaleString()}</p>
                </div>
                <Button variant="destructive">
                  <Send className="h-4 w-4 mr-2" />
                  Despachar Socorro
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

