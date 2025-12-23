"use client"

import { useEffect, useState, useCallback, useMemo } from "react"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"

import { motion } from "framer-motion"
import { Briefcase, Plus, Users, UserPlus, Trash2 } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { CompanyCard } from "@/components/companies/company-card"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SkeletonList } from "@/components/ui/skeleton"
import { useGlobalSync } from "@/hooks/use-global-sync"
import { CompanyService, type Company } from "@/lib/services/company-service"
import { notifySuccess, notifyError } from "@/lib/toast"

// Lazy load modais pesados
const CreateOperatorModal = dynamic(
  () => import("@/components/modals/create-operador-modal").then(m => ({ default: m.CreateOperatorModal })),
  { ssr: false, loading: () => null }
)
const CompanyUsersModal = dynamic(
  () => import("@/components/modals/company-operadores-modal").then(m => ({ default: m.CompanyUsersModal })),
  { ssr: false, loading: () => null }
)
const EditCompanyModal = dynamic(
  () => import("@/components/modals/edit-company-modal").then(m => ({ default: m.EditCompanyModal })),
  { ssr: false, loading: () => null }
)

export default function EmpresasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isCreateOperatorModalOpen, setIsCreateOperatorModalOpen] = useState(false)
  const [selectedCompanyForUsers, setSelectedCompanyForUsers] = useState<{ id: string; name: string } | null>(null)
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false)
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Estados de dados tipados (Pilar 3)
  const [empresas, setEmpresas] = useState<Company[]>([])
  const [loadingEmpresas, setLoadingEmpresas] = useState(true)
  const [errorEmpresas, setErrorEmpresas] = useState<string | null>(null)

  const loadEmpresas = useCallback(async () => {
    setLoadingEmpresas(true)
    setErrorEmpresas(null)
    try {
      const data = await CompanyService.listCompanies()
      setEmpresas(data)
    } catch (error: any) {
      setErrorEmpresas(error.message || "Erro ao carregar empresas")
    } finally {
      setLoadingEmpresas(false)
    }
  }, [])

  const handleDeleteEmpresa = async (empresaId: string, empresaName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${empresaName}"?`)) return

    try {
      const success = await CompanyService.deleteCompany(empresaId)
      if (success) {
        notifySuccess('Empresa excluída com sucesso')
        loadEmpresas()
      }
    } catch (error: any) {
      notifyError(error, 'Erro ao excluir empresa')
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

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold break-words">Empresas</h1>
              {!loadingEmpresas && !errorEmpresas && Array.isArray(empresas) && empresas.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-semibold bg-text-brand/10 text-brand">
                  {empresas.length}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground break-words">Gerencie empresas e funcionários</p>
          </div>
          <Button
            onClick={() => setIsCreateOperatorModalOpen(true)}
            className="w-full sm:w-auto flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Criar Empresa</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        </div>

        {errorEmpresas && (
          <div className="bg-error-light border border-error-light rounded-lg p-3 sm:p-4 w-full">
            <p className="text-xs sm:text-sm text-error break-words">Erro: {errorEmpresas}</p>
          </div>
        )}

        {loadingEmpresas && (
          <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 gap-3 w-full">
            <div className="w-8 h-8 border-4 border-text-brand border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
            <span className="text-xs sm:text-sm md:text-base text-ink-muted text-center break-words">Carregando empresas...</span>
          </div>
        )}

        {!loadingEmpresas && !errorEmpresas && Array.isArray(empresas) && empresas.length === 0 && (
          <Card variant="premium" className="p-4 sm:p-6 md:p-8 text-center w-full max-w-full overflow-hidden">
            <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 text-ink-muted mx-auto mb-3 sm:mb-4 flex-shrink-0" />
            <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 break-words px-2">Nenhuma empresa cadastrada</h3>
            <p className="text-xs sm:text-sm md:text-base text-ink-muted mb-4 break-words px-2">Clique em &quot;Criar Empresa&quot; para criar uma nova empresa e operador.</p>
          </Card>
        )}

        {!loadingEmpresas && !errorEmpresas && empresas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 w-full">
            {empresas.map((empresa, index) => (
              <CompanyCard
                key={empresa.id}
                company={empresa}
                index={index}
                onEdit={(c) => {
                  setSelectedCompanyForEdit(c)
                  setIsEditModalOpen(true)
                }}
                onUsers={(c) => {
                  setSelectedCompanyForUsers(c)
                  setIsUsersModalOpen(true)
                }}
                onDelete={handleDeleteEmpresa}
              />
            ))}
          </div>
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

        {/* Modal Usuários/Funcionários */}
        {selectedCompanyForUsers && (
          <CompanyUsersModal
            company={selectedCompanyForUsers}
            isOpen={isUsersModalOpen}
            onClose={() => {
              setIsUsersModalOpen(false)
              setSelectedCompanyForUsers(null)
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

