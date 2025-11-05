"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Edit, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChangeRoleModal } from "@/components/modals/change-role-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function PermissoesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<any>(null)
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false)

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
      let query = supabase
        .from("users")
        .select("*")

      if (filterRole !== "all") {
        query = query.eq("role", filterRole)
      }
      if (filterStatus !== "all") {
        query = query.eq("is_active", filterStatus === "active")
      }

      const { data, error } = await query

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    }
  }

  useEffect(() => {
    if (user) {
      loadUsuarios()
    }
  }, [filterRole, filterStatus, user])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Permissões</h1>
          <p className="text-[var(--ink-muted)]">Gerencie permissões e papéis dos usuários</p>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os papéis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="operator">Operador</SelectItem>
                <SelectItem value="driver">Motorista</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Tabela de Usuários */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Nome</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Papel</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--ink-muted)]">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((usuario) => (
                    <tr key={usuario.id} className="border-b hover:bg-[var(--bg-hover)]">
                      <td className="p-4">{usuario.name || "N/A"}</td>
                      <td className="p-4">{usuario.email}</td>
                      <td className="p-4">
                        <Badge variant="outline">{usuario.role || "N/A"}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={usuario.is_active ? "default" : "secondary"}>
                          {usuario.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserForRoleChange(usuario)
                            setIsChangeRoleModalOpen(true)
                          }}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Trocar Papel
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal Trocar Papel */}
        {selectedUserForRoleChange && (
          <ChangeRoleModal
            user={selectedUserForRoleChange}
            isOpen={isChangeRoleModalOpen}
            onClose={() => {
              setIsChangeRoleModalOpen(false)
              setSelectedUserForRoleChange(null)
            }}
            onSave={loadUsuarios}
          />
        )}
      </div>
    </AppShell>
  )
}

