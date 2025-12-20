"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Edit, Search, Filter, ChevronDown, ChevronUp, Save, X, Trash2, UserPlus } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "@/lib/next-navigation"
import { Input } from "@/components/ui/input"
import { ChangeRoleModal } from "@/components/modals/change-role-modal"
import { notifySuccess, notifyError } from "@/lib/toast"
import { EditUserModal } from "@/components/modals/edit-user-modal"
import { CreateUserModal } from "@/components/modals/create-operador-login-modal"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useMobile } from "@/hooks/use-mobile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FilterDrawer } from "@/components/shared/filter-drawer"

export default function UsuariosPage() {
    const router = useRouter()
    const isMobile = useMobile() // Hook mobile-first
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
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)

    // Filtrar usuários baseado na busca
    const filteredUsers = usuarios.filter((usuario) => {
        const matchesSearch = searchQuery === "" ||
            usuario.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            usuario.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            usuario.cpf?.includes(searchQuery)
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
        return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div></div>
    }

    return (
        <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 w-full">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Usuários</h1>
                        <p className="text-sm sm:text-base text-ink-muted break-words">Gerencie todos os usuários do sistema</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateUserModalOpen(true)}
                        className="w-full sm:w-auto flex-shrink-0 min-h-[44px] h-auto text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-2.5 whitespace-nowrap touch-manipulation"
                    >
                        <UserPlus className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Criar Usuário</span>
                        <span className="sm:hidden">Criar</span>
                    </Button>
                </div>

                {/* Busca - Sempre visível */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground pointer-events-none z-10" />
                    <Input
                        placeholder="Buscar por nome, email ou CPF..."
                        className="pl-10 w-full min-h-[44px] text-base"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filtros - Mobile: Drawer, Desktop: Card */}
                {isMobile ? (
                    <FilterDrawer
                        filters={[
                            {
                                key: "role",
                                label: "Papel",
                                type: "select",
                                options: [
                                    { label: "Administrador", value: "admin" },
                                    { label: "Operador", value: "operador" },
                                    { label: "Transportadora", value: "transportadora" },
                                    { label: "Motorista", value: "motorista" },
                                    { label: "Passageiro", value: "passageiro" }
                                ]
                            },
                            {
                                key: "status",
                                label: "Status",
                                type: "select",
                                options: [
                                    { label: "Ativo", value: "active" },
                                    { label: "Inativo", value: "inactive" }
                                ]
                            }
                        ]}
                        values={{
                            role: tempFilterRole,
                            status: tempFilterStatus
                        }}
                        onFilterChange={(key, value) => {
                            if (key === "role") {
                                setTempFilterRole(value)
                            } else if (key === "status") {
                                setTempFilterStatus(value)
                            }
                        }}
                        onReset={handleResetFilters}
                        title="Filtros"
                        description="Filtre os usuários por papel e status"
                    />
                ) : (
                    <Card className="overflow-hidden bg-card border-border">
                        <CardHeader className="p-3 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-brand flex-shrink-0" />
                                    <CardTitle className="text-base sm:text-lg font-semibold break-words">Filtros</CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                                    className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
                                >
                                    {filtersExpanded ? (
                                        <>
                                            <ChevronUp className="h-4 w-4" />
                                            <span className="hidden sm:inline">Minimizar</span>
                                            <span className="sm:hidden">Fechar</span>
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-4 w-4" />
                                            <span className="hidden sm:inline">Expandir</span>
                                            <span className="sm:hidden">Abrir</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        {filtersExpanded && (
                            <CardContent className="p-3 sm:p-6 pt-0">
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                                    <Select value={tempFilterRole} onValueChange={setTempFilterRole}>
                                        <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                                            <SelectValue placeholder="Todos os papéis" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os papéis</SelectItem>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="operador">Operador</SelectItem>
                                            <SelectItem value="transportadora">Transportadora</SelectItem>
                                            <SelectItem value="motorista">Motorista</SelectItem>
                                            <SelectItem value="passageiro">Passageiro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={tempFilterStatus} onValueChange={setTempFilterStatus}>
                                        <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                                            <SelectValue placeholder="Todos os status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os status</SelectItem>
                                            <SelectItem value="active">Ativo</SelectItem>
                                            <SelectItem value="inactive">Inativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2 pt-4 border-t border-border">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
                                    >
                                        <X className="h-4 w-4" />
                                        Limpar
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSaveFilters}
                                        className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
                                    >
                                        <Save className="h-4 w-4" />
                                        Salvar Filtros
                                    </Button>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                )}

                {/* Tabela de Usuários - Mobile: Cards, Desktop: Tabela */}
                <Card className="overflow-hidden bg-card border-border">
                    {isMobile ? (
                        /* Mobile: Cards Layout */
                        <div className="p-3 space-y-3">
                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
                                </div>
                            ) : (
                                filteredUsers.map((usuario, index) => (
                                    <Card
                                        key={usuario.id}
                                        className="mobile-table-card p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-12 w-12 flex-shrink-0">
                                                <AvatarImage src={usuario.avatar_url} alt={usuario.name} />
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    {(usuario.name || 'U').charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div>
                                                    <p className="font-semibold text-sm truncate">{usuario.name || "N/A"}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">CPF:</span>
                                                    <span className="text-xs font-medium">{usuario.cpf || "-"}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">Papel:</span>
                                                    <Badge variant="outline" className="text-xs">{usuario.role || "N/A"}</Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">Status:</span>
                                                    <Badge variant={usuario.is_active ? "default" : "secondary"} className="text-xs">
                                                        {usuario.is_active ? "Ativo" : "Inativo"}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col gap-2 pt-2 border-t">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUserForEdit(usuario)
                                                            setIsEditModalOpen(true)
                                                        }}
                                                        className="w-full min-h-[44px] touch-manipulation"
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
                                                        className="w-full min-h-[44px] touch-manipulation"
                                                    >
                                                        <Shield className="h-4 w-4 mr-2" />
                                                        Alterar Papel
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteUsuario(usuario.id, usuario.name || usuario.email || 'Usuário')}
                                                        className="w-full min-h-[44px] touch-manipulation"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Excluir
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    ) : (
                        /* Desktop: Table Layout */
                        <div className="overflow-x-auto -webkit-overflow-scrolling-touch rounded-lg border bg-card">
                            <table className="w-full min-w-[640px] bg-card">
                            <thead className="bg-card">
                                <tr className="border-b border-border">
                                    <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm bg-card">Nome</th>
                                    <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm bg-card">Email</th>
                                    <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm bg-card">CPF</th>
                                    <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm bg-card">Papel</th>
                                    <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm bg-card">Status</th>
                                    <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm bg-card">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card">
                                {filteredUsers.length === 0 ? (
                                    <tr className="bg-card">
                                        <td colSpan={6} className="p-6 sm:p-8 text-center text-muted-foreground text-sm sm:text-base bg-card">
                                            Nenhum usuário encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((usuario, index) => (
                                        <motion.tr 
                                            key={usuario.id} 
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="border-b border-border/50 hover:bg-muted/50 transition-colors bg-card"
                                        >
                                            <td className="p-2 sm:p-4 text-xs sm:text-sm break-words bg-card">{usuario.name || "N/A"}</td>
                                            <td className="p-2 sm:p-4 text-xs sm:text-sm break-words bg-card">{usuario.email}</td>
                                            <td className="p-2 sm:p-4 text-xs sm:text-sm break-words bg-card">{usuario.cpf || "-"}</td>
                                            <td className="p-2 sm:p-4 bg-card">
                                                <Badge variant="outline" className="text-xs whitespace-nowrap">{usuario.role || "N/A"}</Badge>
                                            </td>
                                            <td className="p-2 sm:p-4 bg-card">
                                                <Badge variant={usuario.is_active ? "default" : "secondary"} className="text-xs whitespace-nowrap">
                                                    {usuario.is_active ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </td>
                                            <td className="p-2 sm:p-4 bg-card">
                                                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUserForEdit(usuario)
                                                            setIsEditModalOpen(true)
                                                        }}
                                                        className="min-h-[44px] touch-manipulation text-xs"
                                                    >
                                                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                                        <span className="hidden sm:inline">Editar</span>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUserForRoleChange(usuario)
                                                            setIsChangeRoleModalOpen(true)
                                                        }}
                                                        className="min-h-[44px] touch-manipulation text-xs"
                                                    >
                                                        <Shield className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                                        <span className="hidden sm:inline">Papel</span>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteUsuario(usuario.id, usuario.name || usuario.email || 'Usuário')}
                                                        className="min-h-[44px] touch-manipulation text-xs"
                                                    >
                                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                                        <span className="hidden sm:inline">Excluir</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    )}
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

                {/* Modal Criar Usuário */}
                <CreateUserModal
                    isOpen={isCreateUserModalOpen}
                    onClose={() => setIsCreateUserModalOpen(false)}
                    onSave={async () => {
                        setIsCreateUserModalOpen(false)
                        await loadUsuarios()
                    }}
                    companyId="" // Passando vazio para indicar criação global
                    companyName="Sistema"
                />
            </div>
        </AppShell>
    )
}
