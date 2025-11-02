"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Plus, Award, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function MotoristasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [motoristas, setMotoristas] = useState<any[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadMotoristas()
    }
    getUser()
  }, [router])

  const loadMotoristas = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "driver")

      if (error) throw error
      setMotoristas(data || [])
    } catch (error) {
      console.error("Erro ao carregar motoristas:", error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Motoristas</h1>
            <p className="text-[var(--muted)]">Gerencie os motoristas do sistema</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Motorista
          </Button>
        </div>

        <div className="grid gap-4">
          {motoristas.map((motorista) => (
            <Card key={motorista.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-[var(--brand)]" />
                    <h3 className="font-bold text-lg">{motorista.name}</h3>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{motorista.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Award className="h-4 w-4 mr-2" />
                    Ranking
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Documentos
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

