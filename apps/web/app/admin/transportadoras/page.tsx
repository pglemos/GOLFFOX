"use client"

import { useEffect, useState, useCallback, useMemo } from "react"

import { motion } from "framer-motion"
import { Truck, Plus, UserPlus, Trash2, Edit, Search } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { CreateTransportadoraModal } from "@/components/modals/create-transportadora-modal"
import { EditTransportadoraModal } from "@/components/modals/edit-transportadora-modal"
import { TransportadoraUsersModal } from "@/components/modals/transportadora-users-modal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/providers/auth-provider"
import { useDebounce } from "@/hooks/use-debounce"
import { useGlobalSync } from "@/hooks/use-global-sync"
import { useRouter } from "@/lib/next-navigation"
import { notifySuccess, notifyError } from "@/lib/toast"

export default function TransportadorasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [carriers, setCarriers] = useState<any[]>([])
  const [loadingCarriers, setLoadingCarriers] = useState(true)
  const [errorCarriers, setErrorCarriers] = useState<Error | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedCarrierForUsers, setSelectedCarrierForUsers] = useState<{ id: string; name: string } | null>(null)
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false)
  const [selectedCarrierForEdit, setSelectedCarrierForEdit] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const loadCarriers = useCallback(async () => {
    setLoadingCarriers(true)
    setErrorCarriers(null)
    try {
      const response = await fetch('/api/admin/transportadoras-list', {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        setCarriers(result.data || [])
      } else {
        throw new Error(result.error || 'Erro ao carregar transportadoras')
      }
    } catch (error: any) {
      console.error('Erro ao carregar transportadoras:', error)
      setErrorCarriers(error)
      setCarriers([])
    } finally {
      setLoadingCarriers(false)
    }
  }, [])

  const handleDeleteCarrier = async (carrierId: string, carrierName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a transportadora "${carrierName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/transportadoras/delete?id=${carrierId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Erro ao excluir transportadora'
        const errorDetails = result.details ? ` (${result.details})` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      if (result.success) {
        notifySuccess('Transportadora excluída com sucesso')
        await new Promise(resolve => setTimeout(resolve, 300))
        await loadCarriers()
      } else {
        throw new Error(result.error || 'Erro ao excluir transportadora')
      }
    } catch (error: any) {
      console.error('Erro ao excluir transportadora:', error)
      const errorMessage = error.message || 'Erro desconhecido ao excluir transportadora'
      notifyError(error, errorMessage)
    }
  }

  useEffect(() => {
    loadCarriers()
  }, [loadCarriers])

  // Remover padrão de grid em mobile - FORÇA BRUTA (sempre executa)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const removeGridPattern = () => {
        // Sempre criar/atualizar o estilo, independente de detectar o padrão
        const style = document.createElement('style')
        style.id = 'remove-grid-pattern-mobile-transportadoras'
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
            /* Forçar remoção em todos os elementos da página de transportadoras */
            [class*="transportadoras"], 
            [id*="transportadoras"],
            div[class*="space-y"] {
              background-image: none !important;
            }
          }
        `
        // Remover estilo anterior se existir
        const existingStyle = document.getElementById('remove-grid-pattern-mobile-transportadoras')
        if (existingStyle) {
          existingStyle.remove()
        }
        document.head.appendChild(style)

        // Também tentar remover diretamente do body via JavaScript
        const bodyElement = document.body
        if (bodyElement) {
          const bodyBefore = window.getComputedStyle(bodyElement, '::before')
          // Forçar remoção mesmo que não detecte
          bodyElement.style.setProperty('background-image', 'none', 'important')
        }
      }

      // Executar imediatamente
      removeGridPattern()

      // Executar após delays para garantir que seja aplicado
      const timeouts = [
        setTimeout(removeGridPattern, 50),
        setTimeout(removeGridPattern, 100),
        setTimeout(removeGridPattern, 300),
        setTimeout(removeGridPattern, 500)
      ]

      // Executar quando a janela redimensionar
      window.addEventListener('resize', removeGridPattern)

      // Executar quando o DOM estiver completamente carregado
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeGridPattern)
      }

      return () => {
        timeouts.forEach(clearTimeout)
        window.removeEventListener('resize', removeGridPattern)
        document.removeEventListener('DOMContentLoaded', removeGridPattern)
        const style = document.getElementById('remove-grid-pattern-mobile-transportadoras')
        if (style) {
          style.remove()
        }
      }
    }
  }, [])

  useGlobalSync(
    ['transportadora.created', 'transportadora.updated', 'transportadora.deleted', 'user.created', 'user.updated'],
    () => {
      if (!loadingCarriers) {
        loadCarriers()
      }
    },
    [loadingCarriers]
  )

  const refetchCarriers = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('golffox_cache_carriers')
    }
    await loadCarriers()
  }, [loadCarriers])

  // Filtrar transportadoras por busca
  const filteredCarriers = useMemo(() => {
    if (!debouncedSearchQuery) return carriers
    const query = debouncedSearchQuery.toLowerCase()
    return carriers.filter((c: any) =>
      c.name?.toLowerCase().includes(query) ||
      c.address?.toLowerCase().includes(query) ||
      c.phone?.includes(query)
    )
  }, [carriers, debouncedSearchQuery])

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
                <h1 className="text-2xl sm:text-3xl font-bold break-words">Transportadoras</h1>
                {!loadingCarriers && !errorCarriers && Array.isArray(carriers) && carriers.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-semibold bg-text-brand/10 text-brand">
                    {carriers.length}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-muted-foreground break-words">Gerencie transportadoras</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Criar Transportadora</span>
              <span className="sm:hidden">Criar</span>
            </Button>
          </div>

          {/* Busca */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light h-4 w-4" />
              <Input
                placeholder="Buscar transportadoras por nome, endereço ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {errorCarriers && (
            <div className="bg-error-light border border-error-light rounded-lg p-3 sm:p-4 w-full">
              <p className="text-xs sm:text-sm text-error break-words">Erro ao carregar transportadoras: {errorCarriers instanceof Error ? errorCarriers.message : String(errorCarriers)}</p>
            </div>
          )}

          {loadingCarriers && (
            <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 gap-3 w-full">
              <div className="w-8 h-8 border-4 border-text-brand border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              <span className="text-xs sm:text-sm md:text-base text-ink-muted text-center break-words">Carregando transportadoras...</span>
            </div>
          )}

          {!loadingCarriers && !errorCarriers && Array.isArray(filteredCarriers) && filteredCarriers.length === 0 && (
            <Card variant="premium" className="p-4 sm:p-6 md:p-8 text-center w-full max-w-full overflow-hidden">
              <Truck className="h-10 w-10 sm:h-12 sm:w-12 text-ink-muted mx-auto mb-3 sm:mb-4 flex-shrink-0" />
              <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 break-words px-2">
                {debouncedSearchQuery ? "Nenhuma transportadora encontrada" : "Nenhuma transportadora cadastrada"}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-ink-muted mb-4 break-words px-2">
                {debouncedSearchQuery ? "Tente buscar por outros termos." : "Clique em \"Criar Transportadora\" para criar uma nova transportadora."}
              </p>
            </Card>
          )}

          {!loadingCarriers && !errorCarriers && Array.isArray(filteredCarriers) && filteredCarriers.length > 0 && (
            <div className="grid gap-3 sm:gap-4 w-full">
              {filteredCarriers.map((transportadora: any, index: number) => (
                <motion.div
                  key={transportadora.id}
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
                              <Truck className="h-4 w-4 text-brand" />
                            </div>
                            <h3 className="font-bold text-base sm:text-lg group-hover:text-brand transition-colors">{transportadora.name}</h3>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-ink-muted">
                            {transportadora.address && (
                              <span className="flex items-center gap-1">
                                Endereço: {transportadora.address}
                              </span>
                            )}
                            {transportadora.phone && (
                              <span className="flex items-center gap-1">
                                Tel: {transportadora.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCarrierForEdit(transportadora)
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
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCarrierForUsers({ id: transportadora.id, name: transportadora.name })
                            setIsUsersModalOpen(true)
                          }}
                          className="min-h-[44px] touch-manipulation"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Login
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCarrier(transportadora.id, transportadora.name)
                          }}
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

        {/* Modal Criar Transportadora */}
        <CreateTransportadoraModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={async () => {
            setIsCreateModalOpen(false)
            await new Promise(resolve => setTimeout(resolve, 1500))
            await refetchCarriers()
          }}
        />

        {/* Modal Usuários de Acesso */}
        {selectedCarrierForUsers && (
          <TransportadoraUsersModal
            transportadora={selectedCarrierForUsers}
            isOpen={isUsersModalOpen}
            onClose={() => {
              setIsUsersModalOpen(false)
              setSelectedCarrierForUsers(null)
            }}
            onSave={async () => {
              await refetchCarriers()
            }}
          />
        )}

        {/* Modal Editar Transportadora */}
        <EditTransportadoraModal
          transportadora={selectedCarrierForEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedCarrierForEdit(null)
          }}
          onSave={async () => {
            setIsEditModalOpen(false)
            setSelectedCarrierForEdit(null)
            await refetchCarriers()
          }}
        />
      </div>
    </AppShell>
  )
}
