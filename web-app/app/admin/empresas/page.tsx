"use client"

import { useEffect, useState, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Briefcase, Plus, Users, UserPlus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { CreateOperatorModal } from "@/components/modals/create-operator-modal"
import { AssociateOperatorModal } from "@/components/modals/associate-operator-modal"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useGlobalSync } from "@/hooks/use-global-sync"
import { notifySuccess, notifyError } from "@/lib/toast"

export default function EmpresasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthFast()
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null)
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [isCreateOperatorModalOpen, setIsCreateOperatorModalOpen] = useState(false)
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false)
  const [selectedCompanyForAssociation, setSelectedCompanyForAssociation] = useState<{ id: string; name: string } | null>(null)

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Empresas</h1>
            <p className="text-[var(--muted)]">Gerencie empresas e funcionários</p>
          </div>
          <Button onClick={() => setIsCreateOperatorModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Operador
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
            <p className="text-[var(--muted)] mb-4">Clique em "Criar Operador" para criar uma nova empresa e operador.</p>
          </Card>
        )}

        <div className="grid gap-4">
          {Array.isArray(empresas) && empresas.map((empresa: any) => (
            <Card key={empresa.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-5 w-5 text-[var(--brand)]" />
                    <h3 className="font-bold text-lg">{empresa.name}</h3>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{empresa.address || 'Sem endereço'}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCompanyForAssociation({ id: empresa.id, name: empresa.name })
                      setIsAssociateModalOpen(true)
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Associar Operador
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      loadFuncionarios(empresa.id)
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Ver Funcionários
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteEmpresa(empresa.id, empresa.name)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
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

        {/* Modal Associar Operador */}
        {selectedCompanyForAssociation && (
          <AssociateOperatorModal
            isOpen={isAssociateModalOpen}
            onClose={() => {
              setIsAssociateModalOpen(false)
              setSelectedCompanyForAssociation(null)
            }}
            onSave={() => {
              setIsAssociateModalOpen(false)
              setSelectedCompanyForAssociation(null)
            }}
            companyId={selectedCompanyForAssociation.id}
            companyName={selectedCompanyForAssociation.name}
          />
        )}
      </div>
    </AppShell>
  )
}

