"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Edit } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function PermissoesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<any[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadUsuarios()
    }
    getUser()
  }, [router])

  const loadUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Permissões</h1>
          <p className="text-[var(--muted)]">Gerencie papéis e permissões dos usuários</p>
        </div>

        <div className="grid gap-4">
          {usuarios.map((usuario) => (
            <Card key={usuario.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-[var(--brand)]" />
                    <h3 className="font-bold text-lg">{usuario.name}</h3>
                    <Badge>{usuario.role}</Badge>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{usuario.email}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Trocar Papel
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

