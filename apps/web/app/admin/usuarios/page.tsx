"use client"

import { useEffect, useState, Suspense } from "react"

import { motion } from "framer-motion"
import { Shield, Edit, Search, Filter, Trash2, UserPlus, User } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { ChangeRoleModal } from "@/components/modals/change-role-modal"
import { CreateUserModal } from "@/components/modals/create-operador-login-modal"
import { EditUserModal } from "@/components/modals/edit-user-modal"
import { useAuth } from "@/components/providers/auth-provider"
import { FilterDrawer } from "@/components/shared/filter-drawer"
import { LazyPageWrapper, TablePageSkeleton } from "@/components/shared/lazy-page-wrapper"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { UserCard } from "@/components/users/user-card"
import { useResponsive } from "@/hooks/use-responsive"
import { useRouter } from "@/lib/next-navigation"
import { UserService, type UserProfile } from "@/lib/services/user-service"
import { notifySuccess, notifyError } from "@/lib/toast"

function UsuariosPageContent() {
    const router = useRouter()
    const { isMobile } = useResponsive()
    const { user, loading: authLoading } = useAuth()

    // Estados tipados (Pilar 3)
    const [usuarios, setUsuarios] = useState<UserProfile[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterRole, setFilterRole] = useState<string>("all")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<UserProfile | null>(null)
    const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false)
    const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null)
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
            const data = await UserService.listUsers({
                role: filterRole,
                status: filterStatus
            })
            setUsuarios(data)
        } catch (error) {
            console.error("Erro ao carregar usuários:", error)
            setUsuarios([])
        } finally {
            setDataLoading(false)
        }
    }

    const handleDeleteUsuario = async (usuarioId: string, usuarioName: string) => {
        if (!confirm(`Tem certeza que deseja excluir o usuário "${usuarioName}"?`)) return

        try {
            const success = await UserService.deleteUser(usuarioId)
            if (success) {
                notifySuccess('Usuário excluído com sucesso')
                loadUsuarios()
            }
        } catch (error: any) {
            notifyError(error, 'Erro ao excluir usuário')
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
                                        { label: "Admin", value: "admin" },
                                        { label: "Gestor da Empresa", value: "gestor_empresa" },
                                        { label: "Gestor da Transportadora", value: "gestor_transportadora" },
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
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="gestor_empresa">Gestor da Empresa</SelectItem>
                                    <SelectItem value="gestor_transportadora">Gestor da Transportadora</SelectItem>
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
                            <UserCard
                                key={usuario.id}
                                user={usuario}
                                index={index}
                                onEdit={(u) => {
                                    setSelectedUserForEdit(u)
                                    setIsEditModalOpen(true)
                                }}
                                onRoleChange={(u) => {
                                    setSelectedUserForRoleChange(u)
                                    setIsChangeRoleModalOpen(true)
                                }}
                                onDelete={handleDeleteUsuario}
                            />
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
                    company_id="" // Passando vazio para indicar criação global
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
