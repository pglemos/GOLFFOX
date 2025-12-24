"use client"

import { useEffect, useState, useCallback, useMemo } from "react"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"

import { motion } from "framer-motion"
import { Briefcase, Plus, Users, UserPlus, Trash2, Edit, Search } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SkeletonList } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
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
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

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
    if (!confirm(`Tem certeza que deseja excluir a empresa "${empresaName}"? Esta ação não pode ser desfeita.`)) return

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

  // Remover padrão de grid em mobile - Igual ao transportadoras
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const removeGridPattern = () => {
        const style = document.createElement('style')
        style.id = 'remove-grid-pattern-mobile-empresas'
        style.textContent = `
          @media (max-width: 1023px) {
            body::before {
              display: none !important;
              content: none !important;
              background-image: none !important;
              background: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              position: absolute !important;
              width: 0 !important;
              height: 0 !important;
              overflow: hidden !important;
              pointer-events: none !important;
              z-index: -9999 !important;
            }
            body, html, main, [class*="AppShell"], [class*="app-shell"] {
              background-image: none !important;
              background: var(--bg) !important;
            }
            body > div, main > div, [class*="container"], [class*="Container"] {
              background-image: none !important;
            }
            [class*="empresas"], 
            [id*="empresas"],
            div[class*="space-y"] {
              background-image: none !important;
            }
          }
        `
        const existingStyle = document.getElementById('remove-grid-pattern-mobile-empresas')
        if (existingStyle) {
          existingStyle.remove()
        }
        document.head.appendChild(style)

        const bodyElement = document.body
        if (bodyElement) {
          bodyElement.style.setProperty('background-image', 'none', 'important')
        }
      }

      removeGridPattern()
      const timeouts = [
        setTimeout(removeGridPattern, 50),
        setTimeout(removeGridPattern, 300)
      ]
      window.addEventListener('resize', removeGridPattern)

      return () => {
        timeouts.forEach(clearTimeout)
        window.removeEventListener('resize', removeGridPattern)
        const style = document.getElementById('remove-grid-pattern-mobile-empresas')
        if (style) {
          style.remove()
        }
      }
    }
  }, [])

  // Escutar eventos de sincronização global
  useGlobalSync(
    ['company.created', 'company.updated', 'company.deleted', 'user.created', 'user.updated'],
    () => {
      if (!loadingEmpresas) {
        loadEmpresas()
      }
    },
    [loadingEmpresas]
  )

  const refetchEmpresas = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('golffox_cache_empresas_ativas')
    }
    await loadEmpresas()
  }, [loadEmpresas])

  // Filtrar empresas por busca
  const filteredEmpresas = useMemo(() => {
    if (!debouncedSearchQuery) return empresas
    const query = debouncedSearchQuery.toLowerCase()
    return empresas.filter((c: Company) =>
      c.name?.toLowerCase().includes(query) ||
      c.address?.toLowerCase().includes(query) ||
      c.phone?.includes(query) ||
      c.email?.toLowerCase().includes(query)
    )
  }, [empresas, debouncedSearchQuery])

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
      <div
        className="w-full max-w-full overflow-x-hidden min-w-0 box-border"
        style={{
          backgroundImage: 'none',
          background: 'var(--bg)'
        } as React.CSSProperties}
      >
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

          {/* Busca */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light h-4 w-4" />
              <Input
                placeholder="Buscar empresas por nome, endereço, telefone ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {errorEmpresas && (
            <div className="bg-error-light border border-error-light rounded-lg p-3 sm:p-4 w-full">
              <p className="text-xs sm:text-sm text-error break-words">Erro ao carregar empresas: {errorEmpresas}</p>
            </div>
          )}

          {loadingEmpresas && (
            <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 gap-3 w-full">
              <div className="w-8 h-8 border-4 border-text-brand border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              <span className="text-xs sm:text-sm md:text-base text-ink-muted text-center break-words">Carregando empresas...</span>
            </div>
          )}

          {!loadingEmpresas && !errorEmpresas && Array.isArray(filteredEmpresas) && filteredEmpresas.length === 0 && (
            <Card variant="premium" className="p-4 sm:p-6 md:p-8 text-center w-full max-w-full overflow-hidden">
              <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 text-ink-muted mx-auto mb-3 sm:mb-4 flex-shrink-0" />
              <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 break-words px-2">
                {debouncedSearchQuery ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-ink-muted mb-4 break-words px-2">
                {debouncedSearchQuery ? "Tente buscar por outros termos." : "Clique em \"Criar Empresa\" para criar uma nova empresa."}
              </p>
            </Card>
          )}

          {!loadingEmpresas && !errorEmpresas && Array.isArray(filteredEmpresas) && filteredEmpresas.length > 0 && (
            <div className="grid gap-3 sm:gap-4 w-full">
              {filteredEmpresas.map((empresa, index) => (
                <motion.div
                  key={empresa.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card variant="premium" className="p-3 sm:p-4 group">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 flex gap-3 sm:gap-4 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <div className="p-1 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                              <Briefcase className="h-4 w-4 text-brand" />
                            </div>
                            <h3 className="font-bold text-base sm:text-lg group-hover:text-brand transition-colors">{empresa.name}</h3>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-ink-muted">
                            {empresa.address && (
                              <span className="flex items-center gap-1">
                                Endereço: {empresa.address}
                              </span>
                            )}
                            {empresa.phone && (
                              <span className="flex items-center gap-1">
                                Tel: {empresa.phone}
                              </span>
                            )}
                            {empresa.email && (
                              <span className="flex items-center gap-1">
                                Email: {empresa.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCompanyForEdit(empresa)
                            setIsEditModalOpen(true)
                          }}
                          className="min-h-[44px] touch-manipulation"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCompanyForUsers({ id: empresa.id, name: empresa.name })
                            setIsUsersModalOpen(true)
                          }}
                          className="min-h-[44px] touch-manipulation"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Logins
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmpresa(empresa.id, empresa.name)}
                          className="min-h-[44px] touch-manipulation text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Criar Operador */}
        <CreateOperatorModal
          isOpen={isCreateOperatorModalOpen}
          onClose={() => setIsCreateOperatorModalOpen(false)}
          onSave={async () => {
            setIsCreateOperatorModalOpen(false)
            await new Promise(resolve => setTimeout(resolve, 1500))
            await refetchEmpresas()
          }}
        />

        {/* Modal Usuários */}
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


