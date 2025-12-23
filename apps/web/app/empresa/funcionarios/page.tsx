"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Mail, Phone, Building, AlertCircle, Plus, MoreVertical, Edit, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useRouter } from "@/lib/next-navigation"
import { notifySuccess, notifyError } from "@/lib/toast"
import { CSVImportModal } from "@/components/empresa/csv-import-modal"
import { FuncionarioModal } from "@/components/empresa/funcionario-modal"
import { FuncionariosErrorBoundary } from "./error-boundary"
import { useOperatorTenant } from "@/components/providers/empresa-tenant-provider"
import { useEmployees } from "@/hooks/use-empresa-data"
import { useDebounce } from "@/lib/debounce"
import { Pagination } from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface Funcionario {
  id: string
  company_id: string
  name: string
  cpf?: string
  email?: string
  phone?: string
  is_active: boolean
  address?: string
}

// Validação simples para UUID v4
const isValidUUID = (id: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

function FuncionariosPageContent() {
  const router = useRouter()
  const { tenantCompanyId, companyName, loading: tenantLoading, error: tenantError } = useOperatorTenant()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [isFuncionarioModalOpen, setIsFuncionarioModalOpen] = useState(false)
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null)
  const queryClient = useQueryClient()

  const debouncedSearch = useDebounce(searchQuery, 300)
  const pageSize = 50

  // Usar React Query para carregar funcionários
  const { data: employeesData, isLoading: employeesLoading, refetch } = useEmployees(
    tenantCompanyId,
    currentPage,
    pageSize,
    debouncedSearch
  )

  // Carregar usuário
  useEffect(() => {
    const getUser = async () => {
      try {
        console.log('[FuncionariosPage] Verificando sessão do usuário')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('[FuncionariosPage] Erro ao obter sessão:', sessionError)
          setError('Erro ao carregar sessão')
          setLoading(false)
          return
        }

        if (!session) {
          // Sem sessão - redirecionando
          router.push("/")
          return
        }

        console.log('[FuncionariosPage] Usuário autenticado:', session.user.email)
        setUser(session.user)
        setLoading(false)
      } catch (err) {
        console.error('[FuncionariosPage] Erro ao obter usuário:', err)
        setError('Erro ao carregar dados do usuário')
        setLoading(false)
      }
    }

    // Timeout de segurança
    const timeout = setTimeout(() => {
      console.warn('⚠️  Timeout ao carregar usuário')
      setLoading(false)
    }, 5000)

    getUser().finally(() => clearTimeout(timeout))
  }, [router])

  // Resetar página quando busca mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch])

  // Mutation para excluir funcionário
  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("gf_employee_company")
        .update({ is_active: false })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", tenantCompanyId] })
      notifySuccess("Funcionário desativado com sucesso")
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      notifyError(`Erro ao desativar funcionário: ${error.message}`)
    },
  })

  const handleEdit = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario)
    setIsFuncionarioModalOpen(true)
  }

  const handleDelete = async (funcionario: Funcionario) => {
    if (confirm(`Tem certeza que deseja desativar ${funcionario.name}?`)) {
      await deleteEmployee.mutateAsync(funcionario.id)
    }
  }

  const handleNew = () => {
    setSelectedFuncionario(null)
    setIsFuncionarioModalOpen(true)
  }

  // Preparar user object com todas as propriedades necessárias (sempre válido)
  const getUserName = () => {
    if (!user) return "Usuário"
    if (user.user_metadata?.name) return user.user_metadata.name
    if (user.email) return user.email.split("@")[0]
    return "Usuário"
  }

  const userObj = {
    id: user?.id || "guest",
    name: getUserName(),
    email: user?.email || "guest@demo.com",
    role: "operador" as const,
    avatar_url: user?.user_metadata?.avatar_url || undefined
  }

  // Se ainda está carregando o usuário (primeira vez), mostra loading simples
  if (loading && !user && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-soft">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink-muted">Carregando usuário...</p>
          <p className="text-xs text-ink-light mt-2">Se demorar muito, recarregue a página</p>
        </div>
      </div>
    )
  }

  // Se não tem company ID
  if (!tenantCompanyId && !tenantLoading) {
    return (
      <AppShell user={userObj}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Nenhuma empresa selecionada</h2>
            <p className="text-ink-muted mb-4">
              Selecione uma empresa para continuar.
            </p>
            <Button onClick={() => router.push('/operador')} variant="default">
              Voltar para Dashboard
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  // Se tem erro
  if (error && !loading) {
    return (
      <AppShell user={userObj}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-error">Erro ao carregar</h2>
            <p className="text-ink-muted mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()} variant="default">
                Tentar Novamente
              </Button>
              <Button onClick={() => router.push('/operador')} variant="outline">
                Voltar
              </Button>
            </div>
          </Card>
        </div>
      </AppShell>
    )
  }

  const funcionarios = employeesData?.data || []
  const totalPages = employeesData?.totalPages || 0
  const totalCount = employeesData?.count || 0

  return (
    <AppShell user={userObj}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 break-words">Funcionários</h1>
            <p className="text-sm sm:text-base text-text-muted-foreground break-words">
              {companyName ? `Empresa: ${companyName}` : "Gerencie seus funcionários"}
              {totalCount > 0 && ` • ${totalCount} funcionário${totalCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => router.push('/operador')} variant="outline" className="w-full sm:w-auto min-h-[44px] touch-manipulation text-xs sm:text-sm">
              Voltar
            </Button>
            <Button variant="outline" onClick={() => setIsCsvModalOpen(true)} className="w-full sm:w-auto min-h-[44px] touch-manipulation text-xs sm:text-sm">
              <span className="hidden sm:inline">Importar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button variant="default" onClick={handleNew} className="w-full sm:w-auto touch-manipulation text-xs sm:text-sm">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Novo Funcionário</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading */}
        {(loading || employeesLoading || tenantLoading) && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-ink-muted">Carregando funcionários...</p>
          </div>
        )}

        {/* Lista de funcionários */}
        {!(loading || employeesLoading || tenantLoading) && (
          <div className="space-y-4">
            {funcionarios.length > 0 ? (
              <>
                <div className="grid gap-3 sm:gap-4">
                  {funcionarios.map((funcionario: any, index: number) => (
                    <motion.div
                      key={funcionario.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card className="p-3 sm:p-4 hover:shadow-xl transition-all duration-300 overflow-hidden bg-card/50 backdrop-blur-sm border-border hover:border-text-brand/30 group">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <div className="p-1.5 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                                <Users className="h-4 w-4 text-brand flex-shrink-0" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-base sm:text-lg break-words flex-1 min-w-0 group-hover:text-brand transition-colors">
                                    {funcionario.name || "Nome não disponível"}
                                  </h3>
                                  {funcionario.is_active ? (
                                    <Badge variant="outline" className="bg-success-light text-success text-xs flex-shrink-0">
                                      Ativo
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-bg-soft text-ink-strong text-xs flex-shrink-0">
                                      Inativo
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1 text-sm text-ink-muted pl-7">
                              {funcionario.email && (
                                <div className="flex items-start gap-2">
                                  <Mail className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                  <span className="break-words">{funcionario.email}</span>
                                </div>
                              )}
                              {funcionario.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 flex-shrink-0" />
                                  <span className="break-words">{funcionario.phone}</span>
                                </div>
                              )}
                              {funcionario.cpf && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-ink-muted break-words">CPF: {funcionario.cpf}</span>
                                </div>
                              )}
                              {funcionario.address && (
                                <div className="flex items-start gap-2">
                                  <Building className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                  <span className="text-xs text-ink-muted break-words">{funcionario.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="self-start sm:self-auto min-h-[44px] min-w-[44px] touch-manipulation">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[160px]">
                              <DropdownMenuItem onClick={() => handleEdit(funcionario)} className="min-h-[44px] touch-manipulation">
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(funcionario)}
                                className="text-error min-h-[44px] touch-manipulation"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Desativar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="mt-6"
                  />
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 text-ink-light mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum funcionário encontrado</h3>
                <p className="text-sm text-ink-muted mb-4">
                  {debouncedSearch
                    ? "Tente ajustar sua busca"
                    : "Nenhum funcionário cadastrado para esta empresa"}
                </p>
                {!debouncedSearch && (
                  <Button onClick={() => setIsCsvModalOpen(true)} className="min-h-[44px] touch-manipulation">
                    <Plus className="h-4 w-4 mr-2" />
                    Importar Funcionários
                  </Button>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
      {/* Modal de Importação CSV */}
      <CSVImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSave={() => {
          setIsCsvModalOpen(false)
          refetch()
        }}
        empresaId={tenantCompanyId ? String(tenantCompanyId) : ''}
      />

      {/* Modal de CRUD de Funcionário */}
      {tenantCompanyId && (
        <FuncionarioModal
          funcionario={selectedFuncionario}
          isOpen={isFuncionarioModalOpen}
          onClose={() => {
            setIsFuncionarioModalOpen(false)
            setSelectedFuncionario(null)
          }}
          onSave={() => {
            refetch()
            setIsFuncionarioModalOpen(false)
            setSelectedFuncionario(null)
          }}
          empresaId={tenantCompanyId}
        />
      )}
    </AppShell>
  )
}

export default function FuncionariosPage() {
  return (
    <FuncionariosErrorBoundary>
      {/* Suspense removido - não necessário */}
      <FuncionariosPageContent />
    </FuncionariosErrorBoundary>
  )
}
