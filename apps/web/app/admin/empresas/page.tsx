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
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 break-words">Empresas</h1>
            <p className="text-sm sm:text-base text-[var(--muted)] break-words">Gerencie empresas e funcionários</p>
          </div>
          <Button 
            onClick={() => setIsCreateOperatorModalOpen(true)}
            className="w-full sm:w-auto flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Criar Empresa</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        </div>

        {errorEmpresas && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Erro ao carregar empresas: {errorEmpresas instanceof Error ? errorEmpresas.message : String(errorEmpresas)}</p>
          </div>
        )}

        {loadingEmpresas && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-[var(--muted)]">Carregando empresas...</span>
          </div>
        )}

        {!loadingEmpresas && !errorEmpresas && Array.isArray(empresas) && empresas.length === 0 && (
          <Card className="p-8 text-center">
            <Briefcase className="h-12 w-12 text-[var(--muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-[var(--muted)] mb-4">Clique em "Criar Empresa" para criar uma nova empresa e operador.</p>
          </Card>
        )}

        <div className="grid gap-3 sm:gap-4 w-full">
          {Array.isArray(empresas) && empresas.map((empresa: any) => (
            <Card key={empresa.id} className="p-3 sm:p-4 overflow-hidden">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    <Briefcase className="h-5 w-5 text-[var(--brand)] flex-shrink-0 mt-0.5" />
                    <h3 className="font-bold text-base sm:text-lg break-words flex-1">{empresa.name}</h3>
                  </div>
                  <p className="text-sm text-[var(--muted)] break-words pl-7">{empresa.address || 'Sem endereço'}</p>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('Abrindo modal de edição para empresa:', empresa)
                      setSelectedCompanyForEdit(empresa)
                      setIsEditModalOpen(true)
                    }}
                    className="w-full text-xs sm:text-sm"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="truncate">Editar</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCompanyForOperators({ id: empresa.id, name: empresa.name })
                      setIsOperatorsModalOpen(true)
                    }}
                    className="w-full text-xs sm:text-sm"
                  >
                    <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="truncate hidden sm:inline">Usuário Operador</span>
                    <span className="truncate sm:hidden">Operador</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      loadFuncionarios(empresa.id)
                    }}
                    className="w-full text-xs sm:text-sm"
                  >
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="truncate hidden sm:inline">Ver Funcionários</span>
                    <span className="truncate sm:hidden">Funcionários</span>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteEmpresa(empresa.id, empresa.name)
                    }}
                    className="w-full col-span-2 sm:col-span-1 text-xs sm:text-sm"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="truncate">Excluir</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

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
    </AppShell>
  )
}

