"use client"

import { useEffect, useState, Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { LazyPageWrapper, TablePageSkeleton } from "@/components/shared/lazy-page-wrapper"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Edit, Search, Filter, Trash2, UserPlus, User } from "lucide-react"
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

function UsuariosPageContent() {
    const router = useRouter()
    const isMobile = useMobile() // Hook mobile-first
    const { user, loading: authLoading } = useAuthFast()
    const [usuarios, setUsuarios] = useState<any[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterRole, setFilterRole] = useState<string>("all")
    const [filterStatus, setFilterStatus] = useState<string>("all")
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
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Usuários</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Gerencie todos os usuários do sistema</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateUserModalOpen(true)}
                        className="w-full sm:w-auto flex-shrink-0 touch-manipulation"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Criar Usuário</span>
                        <span className="sm:hidden">Criar</span>
                    </Button>
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Buscar por nome, email ou CPF..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

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
                                role: filterRole,
                                status: filterStatus
                            }}
                            onFilterChange={(key, value) => {
                                if (key === "role") {
                                    setFilterRole(value)
                                } else if (key === "status") {
                                    setFilterStatus(value)
                                }
                            }}
                            onReset={() => {
                                setFilterRole("all")
                                setFilterStatus("all")
                            }}
                            title="Filtros"
                            description="Filtre os usuários por papel e status"
                        />
                    ) : (
                        <>
                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger className="w-full sm:w-[220px]">
                                    <Shield className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Papel" />
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
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full sm:w-[220px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os status</SelectItem>
                                    <SelectItem value="active">Ativo</SelectItem>
                                    <SelectItem value="inactive">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </>
                    )}
                </div>

                {/* Lista de Usuários - Cards em Grid */}
                {dataLoading && usuarios.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <Card variant="premium" className="p-8 text-center">
                        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                    </Card>
                ) : (
                    <div className="grid gap-2 sm:gap-3 w-full">
                        {filteredUsers.map((usuario, index) => (
                            <motion.div
                                key={usuario.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                whileHover={{ y: -4 }}
                            >
                                <Card variant="premium" className="p-2 sm:p-3 group">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                        <div className="flex-1 flex gap-2 sm:gap-3 min-w-0">
                                            <Avatar className="h-12 w-12 sm:w-14 sm:h-14 flex-shrink-0">
                                                <AvatarImage src={usuario.avatar_url} alt={usuario.name} />
                                                <AvatarFallback className="bg-gradient-to-br from-bg-brand-light to-bg-brand-soft text-brand font-bold text-sm">
                                                    {(usuario.name || 'U').charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                    <div className="p-0.5 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                                                        <User className="h-3 w-3 text-brand" />
                                                    </div>
                                                    <h3 className="font-bold text-sm sm:text-base group-hover:text-brand transition-colors">{usuario.name || "N/A"}</h3>
                                                    <Badge variant="outline" className="text-xs">{usuario.role || "N/A"}</Badge>
                                                    <Badge variant={usuario.is_active ? "default" : "secondary"} className="text-xs">
                                                        {usuario.is_active ? "Ativo" : "Inativo"}
                                                    </Badge>
                                                </div>
                                                <p className="font-medium mb-0.5 text-xs sm:text-sm text-muted-foreground">{usuario.email}</p>
                                                <div className="flex flex-wrap gap-2 text-xs text-ink-muted">
                                                    {usuario.cpf && <span>CPF: {usuario.cpf}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUserForEdit(usuario)
                                                    setIsEditModalOpen(true)
                                                }}
                                                className="min-h-[44px] touch-manipulation"
                                            >
                                                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                                                <span className="hidden sm:inline">Editar</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUserForRoleChange(usuario)
                                                    setIsChangeRoleModalOpen(true)
                                                }}
                                                className="min-h-[44px] touch-manipulation"
                                            >
                                                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                                                <span className="hidden sm:inline">Papel</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteUsuario(usuario.id, usuario.name || usuario.email || 'Usuário')}
                                                className="min-h-[44px] touch-manipulation text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

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

export default function UsuariosPage() {
    return (
        <LazyPageWrapper fallback={<TablePageSkeleton />}>
            <UsuariosPageContent />
        </LazyPageWrapper>
    )
}
