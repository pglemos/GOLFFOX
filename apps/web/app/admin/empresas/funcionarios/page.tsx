"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, Briefcase, Shield } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"
import { motion } from "framer-motion"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useDebounce } from "@/hooks/use-debounce"
import { SkeletonList } from "@/components/ui/skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Employee {
    id: string
    name: string
    email: string
    phone?: string
    cpf?: string
    role: string
    company_id?: string
    company_name?: string
    is_active?: boolean
}

interface Company {
    id: string
    name: string
}

export default function EmpresasFuncionariosPage() {
    const { user, loading: authLoading } = useAuthFast()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [companies, setCompanies] = useState<Company[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSelectCompanyOpen, setIsSelectCompanyOpen] = useState(false)
    const [newEmployeeCompanyId, setNewEmployeeCompanyId] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState("")
    const [filterCompany, setFilterCompany] = useState<string>("all")
    const debouncedSearchQuery = useDebounce(searchQuery, 300)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        role: "operador",
        company_id: "",
    })

    // Abre dialog de seleção de empresa para novo funcionário
    const handleNewEmployee = () => {
        setNewEmployeeCompanyId("")
        setIsSelectCompanyOpen(true)
    }

    // Após selecionar empresa, abre modal de cadastro
    const handleCompanySelected = () => {
        if (!newEmployeeCompanyId) return
        const selectedCompany = companies.find(c => c.id === newEmployeeCompanyId)
        setSelectedEmployee(null)
        setFormData({
            name: "",
            email: "",
            phone: "",
            cpf: "",
            role: "operador",
            company_id: newEmployeeCompanyId,
        })
        setIsSelectCompanyOpen(false)
        setIsModalOpen(true)
    }

    useEffect(() => {
        if (user && !authLoading) {
            loadEmployees()
            loadCompanies()
        }
    }, [user, authLoading])

    useEffect(() => {
        if (selectedEmployee) {
            setFormData({
                name: selectedEmployee.name || "",
                email: selectedEmployee.email || "",
                phone: selectedEmployee.phone || "",
                cpf: selectedEmployee.cpf || "",
                role: selectedEmployee.role || "operador",
                company_id: selectedEmployee.company_id || "",
            })
        } else {
            setFormData({ name: "", email: "", phone: "", cpf: "", role: "operador", company_id: "" })
        }
    }, [selectedEmployee])

    const loadEmployees = useCallback(async () => {
        try {
            setDataLoading(true)
            const response = await fetch('/api/admin/employees-list')
            if (!response.ok) throw new Error('Erro ao carregar funcionários')
            const data = await response.json()
            setEmployees(Array.isArray(data) ? data : data.employees || [])
        } catch (error) {
            notifyError(error, "Erro ao carregar funcionários")
            setEmployees([])
        } finally {
            setDataLoading(false)
        }
    }, [])

    const loadCompanies = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/companies-list')
            if (!response.ok) return
            const data = await response.json()
            setCompanies(Array.isArray(data) ? data : data.companies || [])
        } catch {
            setCompanies([])
        }
    }, [])

    const filteredEmployees = useMemo(() => {
        let result = employees

        // Filtrar por empresa
        if (filterCompany !== "all") {
            result = result.filter(e => e.company_id === filterCompany)
        }

        // Filtrar por busca
        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase()
            result = result.filter(e =>
                e.name?.toLowerCase().includes(query) ||
                e.email?.toLowerCase().includes(query) ||
                e.cpf?.includes(query) ||
                e.company_name?.toLowerCase().includes(query)
            )
        }

        return result
    }, [employees, debouncedSearchQuery, filterCompany])

    const handleSave = async () => {
        if (!formData.name || !formData.email) {
            notifyError(new Error("Campos obrigatórios"), "Preencha nome e email")
            return
        }

        setSaving(true)
        try {
            const url = selectedEmployee
                ? `/api/admin/users/${selectedEmployee.id}`
                : '/api/admin/create-user'
            const method = selectedEmployee ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) throw new Error('Erro ao salvar')
            notifySuccess(selectedEmployee ? 'Funcionário atualizado' : 'Funcionário criado')
            setIsModalOpen(false)
            loadEmployees()
        } catch (error) {
            notifyError(error, "Erro ao salvar funcionário")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (employeeId: string, employeeName: string) => {
        if (!confirm(`Excluir funcionário "${employeeName}"?`)) return

        try {
            const response = await fetch(`/api/admin/users/delete?id=${employeeId}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Erro ao excluir')
            notifySuccess('Funcionário excluído')
            loadEmployees()
        } catch (error) {
            notifyError(error, "Erro ao excluir funcionário")
        }
    }

    const getRoleBadge = (role: string) => {
        const roles: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
            admin: { label: "Admin", variant: "default" },
            operador: { label: "Operador", variant: "secondary" },
            funcionario: { label: "Funcionário", variant: "outline" },
        }
        return roles[role] || { label: role, variant: "outline" }
    }

    if (authLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin" /></div>
    }

    return (
        <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Funcionários</h1>
                        <p className="text-sm sm:text-base text-text-muted-foreground">Todos os funcionários de todas as empresas</p>
                    </div>
                    <Button
                        onClick={handleNewEmployee}
                        className="w-full sm:w-auto flex-shrink-0 min-h-[44px] touch-manipulation"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Cadastrar Funcionário</span>
                        <span className="sm:hidden">Cadastrar</span>
                    </Button>
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light h-4 w-4" />
                        <Input
                            placeholder="Buscar funcionários..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={filterCompany} onValueChange={setFilterCompany}>
                        <SelectTrigger className="w-full sm:w-[220px]">
                            <Briefcase className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Empresa" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas Empresas</SelectItem>
                            {companies.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Grid */}
                {dataLoading && employees.length === 0 ? (
                    <SkeletonList count={5} />
                ) : (
                    <div className="grid gap-3 sm:gap-4 w-full">
                        {filteredEmployees.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">Nenhum funcionário encontrado</p>
                            </Card>
                        ) : (
                            filteredEmployees.map((employee) => {
                                const roleBadge = getRoleBadge(employee.role)
                                return (
                                    <motion.div
                                        key={employee.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        whileHover={{ y: -4 }}
                                    >
                                        <Card className="p-3 sm:p-4 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:border-text-brand/30 group">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <div className="p-1 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                                                            <Users className="h-4 w-4 text-brand" />
                                                        </div>
                                                        <h3 className="font-bold text-base sm:text-lg group-hover:text-brand transition-colors">{employee.name}</h3>
                                                        <Badge variant={roleBadge.variant}>
                                                            <Shield className="h-3 w-3 mr-1" />
                                                            {roleBadge.label}
                                                        </Badge>
                                                        <Badge variant={employee.is_active !== false ? "default" : "secondary"}>
                                                            {employee.is_active !== false ? "Ativo" : "Inativo"}
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-1 text-sm text-ink-muted">
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-3 w-3" />
                                                            <span>{employee.email}</span>
                                                        </div>
                                                        {employee.phone && (
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="h-3 w-3" />
                                                                <span>{employee.phone}</span>
                                                            </div>
                                                        )}
                                                        {employee.company_name && (
                                                            <div className="flex items-center gap-2">
                                                                <Briefcase className="h-3 w-3" />
                                                                <span>{employee.company_name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setSelectedEmployee(employee); setIsModalOpen(true) }}
                                                        className="min-h-[44px] touch-manipulation"
                                                    >
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(employee.id, employee.name)}
                                                        className="min-h-[44px] touch-manipulation text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Dialog de seleção de empresa */}
            <Dialog open={isSelectCompanyOpen} onOpenChange={setIsSelectCompanyOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            Selecionar Empresa
                        </DialogTitle>
                        <DialogDescription>
                            Escolha a empresa para vincular o novo funcionário
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Empresa *</Label>
                            <Select value={newEmployeeCompanyId} onValueChange={setNewEmployeeCompanyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a empresa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSelectCompanyOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCompanySelected} disabled={!newEmployeeCompanyId}>
                            Continuar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Funcionário */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {selectedEmployee ? "Editar Funcionário" : "Novo Funcionário"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label>Nome *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nome completo"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@empresa.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>CPF</Label>
                                <Input
                                    value={formData.cpf}
                                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                    placeholder="000.000.000-00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Cargo</Label>
                                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="operador">Operador</SelectItem>
                                        <SelectItem value="funcionario">Funcionário</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>Empresa</Label>
                                <Select value={formData.company_id} onValueChange={(v) => setFormData({ ...formData, company_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a empresa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    )
}
