"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Briefcase, Plus, Users, UserPlus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useGlobalSync } from "@/hooks/use-global-sync"
import { notifySuccess, notifyError } from "@/lib/toast"
import { Edit } from "lucide-react"
import { SkeletonList } from "@/components/ui/skeleton"

// Lazy load modais pesados
const CreateOperatorModal = dynamic(
  () => import("@/components/modals/create-operator-modal").then(m => ({ default: m.CreateOperatorModal })),
  { ssr: false, loading: () => null }
)
const CompanyOperatorsModal = dynamic(
  () => import("@/components/modals/company-operators-modal").then(m => ({ default: m.CompanyOperatorsModal })),
  { ssr: false, loading: () => null }
)
const EditCompanyModal = dynamic(
  () => import("@/components/modals/edit-company-modal").then(m => ({ default: m.EditCompanyModal })),
  { ssr: false, loading: () => null }
)

export default function EmpresasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthFast()
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null)
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [isCreateOperatorModalOpen, setIsCreateOperatorModalOpen] = useState(false)
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false)
  const [selectedCompanyForOperators, setSelectedCompanyForOperators] = useState<{ id: string; name: string } | null>(null)
  const [isOperatorsModalOpen, setIsOperatorsModalOpen] = useState(false)
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Usar API route para carregar empresas (bypass RLS com service role)
  const [empresas, setEmpresas] = useState<any[]>([])
  const [loadingEmpresas, setLoadingEmpresas] = useState(true)
  const [errorEmpresas, setErrorEmpresas] = useState<Error | null>(null)

  const loadEmpresas = useCallback(async () => {
    setLoadingEmpresas(true)
    setErrorEmpresas(null)
    try {
      const response = await fetch('/api/admin/companies-list')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        setEmpresas(result.companies || [])
      } else {
        throw new Error(result.error || 'Erro ao carregar empresas')
      }
    } catch (error: any) {
      console.error('Erro ao carregar empresas:', error)
      setErrorEmpresas(error)
      setEmpresas([])
    } finally {
      setLoadingEmpresas(false)
    }
  }, [])

  const handleDeleteEmpresa = async (empresaId: string, empresaName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${empresaName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/companies/delete?id=${empresaId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Erro ao excluir empresa'
        const errorDetails = result.details ? ` (${result.details})` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      if (result.success) {
        notifySuccess('Empresa excluída com sucesso')
        // Aguardar um pouco antes de recarregar para garantir que o banco foi atualizado
        await new Promise(resolve => setTimeout(resolve, 300))
        await loadEmpresas()
      } else {
        throw new Error(result.error || 'Erro ao excluir empresa')
      }
    } catch (error: any) {
      console.error('Erro ao excluir empresa:', error)
      const errorMessage = error.message || 'Erro desconhecido ao excluir empresa'
      notifyError(error, errorMessage)
    }
  }

  useEffect(() => {
    loadEmpresas()
  }, [loadEmpresas])

  // Escutar eventos de sincronização global (apenas após carregamento inicial)
  useGlobalSync(
    ['company.created', 'company.updated', 'company.deleted', 'user.created', 'user.updated'],
    () => {
      // Recarregar empresas quando houver mudanças (apenas se não estiver carregando)
      if (!loadingEmpresas) {
        loadEmpresas()
      }
    },
    [loadingEmpresas]
  )

  const refetchEmpresas = useCallback(async () => {
    // Limpar cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem('golffox_cache_empresas_ativas')
    }
    await loadEmpresas()
  }, [loadEmpresas])

  // Autenticação otimizada via useAuthFast

  const loadFuncionarios = async (empresaId: string) => {
    try {
      const { data, error } = await supabase
        .from("gf_employee_company")
        .select("*")
        .eq("company_id", empresaId)

      if (error) {
        console.error('Erro ao carregar funcionários:', error)
        setFuncionarios([])
        return
      }
      
      setFuncionarios(data || [])
      const empresa = Array.isArray(empresas) ? empresas.find((e: any) => e.id === empresaId) : null
      setSelectedEmpresa(empresa)
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
      setFuncionarios([])
    }
  }

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin" }}>
      <div 
        className="w-full max-w-full overflow-x-hidden min-w-0 box-border"
        style={{
          backgroundImage: 'none',
          background: 'var(--bg)'
        } as React.CSSProperties}
      >
        <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 w-full">
          <div className="min-w-0 flex-1 w-full sm:w-auto">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words leading-tight">Empresas</h1>
              {!loadingEmpresas && !errorEmpresas && Array.isArray(empresas) && empresas.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-semibold bg-[var(--brand)]/10 text-[var(--brand)]">
                  {empresas.length}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm md:text-base text-[var(--ink-muted)] break-words leading-relaxed">Gerencie empresas e funcionários</p>
          </div>
          <Button 
            onClick={() => setIsCreateOperatorModalOpen(true)}
            className="w-full sm:w-auto flex-shrink-0 min-h-[44px] h-auto text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-2.5 whitespace-nowrap touch-manipulation"
          >
            <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Criar Empresa</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        </div>

        {errorEmpresas && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 w-full">
            <p className="text-xs sm:text-sm text-red-800 break-words">Erro ao carregar empresas: {errorEmpresas instanceof Error ? errorEmpresas.message : String(errorEmpresas)}</p>
          </div>
        )}

        {loadingEmpresas && (
          <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 gap-3 w-full">
            <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
            <span className="text-xs sm:text-sm md:text-base text-[var(--ink-muted)] text-center break-words">Carregando empresas...</span>
          </div>
        )}

        {!loadingEmpresas && !errorEmpresas && Array.isArray(empresas) && empresas.length === 0 && (
          <Card className="p-4 sm:p-6 md:p-8 text-center w-full max-w-full overflow-hidden">
            <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 text-[var(--ink-muted)] mx-auto mb-3 sm:mb-4 flex-shrink-0" />
            <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 break-words px-2">Nenhuma empresa cadastrada</h3>
            <p className="text-xs sm:text-sm md:text-base text-[var(--ink-muted)] mb-4 break-words px-2">Clique em "Criar Empresa" para criar uma nova empresa e operador.</p>
          </Card>
        )}

        {!loadingEmpresas && !errorEmpresas && Array.isArray(empresas) && empresas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 w-full max-w-full">
            {empresas.map((empresa: any) => (
              <Card key={empresa.id} className="p-4 sm:p-5 overflow-hidden w-full border border-[var(--border)] hover:shadow-lg transition-shadow duration-200 flex flex-col">
                <div className="flex-1 flex flex-col gap-3 w-full">
                  {/* Header com ícone e nome */}
                  <div className="flex items-start gap-3 mb-1">
                    <div className="p-2 rounded-lg bg-[var(--brand)]/10 flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-[var(--brand)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base sm:text-lg break-words leading-tight text-[var(--ink)]">
                        {empresa.name}
                      </h3>
                    </div>
                  </div>

                  {/* Informações da empresa */}
                  <div className="space-y-2 flex-1">
                    {empresa.address && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--ink-muted)] font-medium min-w-[60px]">Endereço:</span>
                        <p className="text-xs sm:text-sm text-[var(--ink-muted)] break-words flex-1 leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {empresa.address}
                        </p>
                      </div>
                    )}
                    {empresa.phone && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--ink-muted)] font-medium min-w-[60px]">Telefone:</span>
                        <p className="text-xs sm:text-sm text-[var(--ink-muted)] break-words flex-1 leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {empresa.phone}
                        </p>
                      </div>
                    )}
                    {empresa.email && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--ink-muted)] font-medium min-w-[60px]">Email:</span>
                        <p className="text-xs sm:text-sm text-[var(--ink-muted)] break-words flex-1 leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {empresa.email}
                        </p>
                      </div>
                    )}
                    {!empresa.address && !empresa.phone && !empresa.email && (
                      <p className="text-xs sm:text-sm text-[var(--ink-muted)] italic">Sem informações adicionais</p>
                    )}
                  </div>

                  {/* Botões de ação */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('Abrindo modal de edição para empresa:', empresa)
                        setSelectedCompanyForEdit(empresa)
                        setIsEditModalOpen(true)
                      }}
                      className="w-full min-h-[44px] h-auto text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 touch-manipulation"
                      title="Editar empresa"
                    >
                      <Edit className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate hidden sm:inline">Editar</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCompanyForOperators({ id: empresa.id, name: empresa.name })
                        setIsOperatorsModalOpen(true)
                      }}
                      className="w-full min-h-[44px] h-auto text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 touch-manipulation"
                      title="Gerenciar operadores"
                    >
                      <UserPlus className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate hidden sm:inline">Operador</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        loadFuncionarios(empresa.id)
                      }}
                      className="w-full min-h-[44px] h-auto text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 touch-manipulation"
                      title="Ver funcionários"
                    >
                      <Users className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate hidden sm:inline">Funcionários</span>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteEmpresa(empresa.id, empresa.name)
                      }}
                      className="w-full col-span-2 min-h-[44px] h-auto text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 touch-manipulation"
                      title="Excluir empresa"
                    >
                      <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">Excluir</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedEmpresa && (
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-4">Funcionários - {selectedEmpresa.name}</h3>
            <div className="space-y-2">
              {funcionarios.map((func) => (
                <div key={func.id} className="p-3 bg-[var(--bg-soft)] rounded-lg">
                  <p className="font-medium">{func.name}</p>
                  <p className="text-sm text-[var(--muted)]">CPF: {func.cpf}</p>
                  <p className="text-sm text-[var(--muted)]">Login: {func.login_cpf}</p>
                  <p className="text-sm text-[var(--muted)]">Endereço: {func.address}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Modal Criar Operador */}
        <CreateOperatorModal
          isOpen={isCreateOperatorModalOpen}
          onClose={() => setIsCreateOperatorModalOpen(false)}
          onSave={async () => {
            setIsCreateOperatorModalOpen(false)
            // Aguardar um pouco para garantir que a empresa foi criada no banco
            await new Promise(resolve => setTimeout(resolve, 1500))
            // Recarregar dados - refetchEmpresas já limpa cache e busca novos dados
            await refetchEmpresas()
          }}
        />

        {/* Modal Usuários Operadores */}
        {selectedCompanyForOperators && (
          <CompanyOperatorsModal
            company={selectedCompanyForOperators}
            isOpen={isOperatorsModalOpen}
            onClose={() => {
              setIsOperatorsModalOpen(false)
              setSelectedCompanyForOperators(null)
            }}
            onSave={async () => {
              await refetchEmpresas()
            }}
          />
        )}

        {/* Modal Editar Empresa */}
        <EditCompanyModal
          company={selectedCompanyForEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedCompanyForEdit(null)
          }}
          onSave={async () => {
            setIsEditModalOpen(false)
            setSelectedCompanyForEdit(null)
            await refetchEmpresas()
          }}
        />
        </div>
      </div>
    </AppShell>
  )
}

