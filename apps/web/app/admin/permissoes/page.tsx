"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Edit, Search, Filter, ChevronDown, ChevronUp, Save, X, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { ChangeRoleModal } from "@/components/modals/change-role-modal"
import { notifySuccess, notifyError } from "@/lib/toast"
import { EditUserModal } from "@/components/modals/edit-user-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthFast } from "@/hooks/use-auth-fast"

export default function PermissoesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthFast()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [tempFilterRole, setTempFilterRole] = useState<string>("all")
  const [tempFilterStatus, setTempFilterStatus] = useState<string>("all")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const handleSaveFilters = () => {
    setFilterRole(tempFilterRole)
    setFilterStatus(tempFilterStatus)
    setFiltersExpanded(false)
  }

  const handleResetFilters = () => {
    setTempFilterRole("all")
    setTempFilterStatus("all")
    setFilterRole("all")
    setFilterStatus("all")
    setFiltersExpanded(false)
  }
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<any>(null)
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Filtrar usuários baseado na busca
  const filteredUsers = usuarios.filter((usuario) => {
    const matchesSearch = searchQuery === "" || 
      usuario.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  useEffect(() => {
    if (user && !authLoading) {
      loadUsuarios()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, filterRole, filterStatus])

  const loadUsuarios = async () => {
    try {
      setDataLoading(true)
      // Usar API route para bypass RLS
      const params = new URLSearchParams()
      if (filterRole !== "all") {
        params.append('role', filterRole)
      }
      if (filterStatus !== "all") {
        params.append('status', filterStatus)
      }
      
      const response = await fetch(`/api/admin/users-list?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        setUsuarios(result.users || [])
      } else {
        throw new Error(result.error || 'Erro ao carregar usuários')
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      setUsuarios([])
    } finally {
      setDataLoading(false)
    }
  }

  const handleDeleteUsuario = async (usuarioId: string, usuarioName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${usuarioName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/delete?id=${usuarioId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Erro ao excluir usuário'
        const errorDetails = result.details ? ` (${result.details})` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      if (result.success) {
        notifySuccess('Usuário excluído com sucesso')
        await new Promise(resolve => setTimeout(resolve, 300))
        await loadUsuarios()
      } else {
        throw new Error(result.error || 'Erro ao excluir usuário')
      }
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error)
      const errorMessage = error.message || 'Erro desconhecido ao excluir usuário'
      notifyError(error, errorMessage)
    }
  }

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Permissões</h1>
          <p className="text-[var(--ink-muted)]">Gerencie permissões e papéis dos usuários</p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-[var(--brand)]" />
                <CardTitle className="text-lg">Filtros</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="gap-2"
              >
                {filtersExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Minimizar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Expandir
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {filtersExpanded && (
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={tempFilterRole} onValueChange={setTempFilterRole}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos os papéis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os papéis</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="carrier">Transportadora</SelectItem>
                    <SelectItem value="driver">Motorista</SelectItem>
                    <SelectItem value="passenger">Passageiro</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tempFilterStatus} onValueChange={setTempFilterStatus}>
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
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveFilters}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar Filtros
                </Button>
              </div>
            </CardContent>
          )}
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUserForEdit(usuario)
                              setIsEditModalOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
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
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUsuario(usuario.id, usuario.name || usuario.email || 'Usuário')}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
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

        {/* Modal Editar Usuário */}
        <EditUserModal
          user={selectedUserForEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedUserForEdit(null)
          }}
          onSave={async () => {
            setIsEditModalOpen(false)
            setSelectedUserForEdit(null)
            await loadUsuarios()
          }}
        />
      </div>
    </AppShell>
  )
}


