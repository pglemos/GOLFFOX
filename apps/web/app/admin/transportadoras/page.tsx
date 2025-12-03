"use client"

import { useEffect, useState, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Truck, Plus, Users, UserPlus, Trash2, Edit } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useGlobalSync } from "@/hooks/use-global-sync"
import { notifySuccess, notifyError } from "@/lib/toast"
import { CreateTransportadoraModal } from "@/components/modals/create-transportadora-modal"
import { TransportadoraUsersModal } from "@/components/modals/transportadora-users-modal"
import { TransportadoraDriversModal } from "@/components/modals/transportadora-drivers-modal"
import { TransportadoraVehiclesModal } from "@/components/modals/transportadora-vehicles-modal"
import { EditTransportadoraModal } from "@/components/modals/edit-transportadora-modal"

export default function TransportadorasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthFast()
  const [carriers, setCarriers] = useState<any[]>([])
  const [loadingCarriers, setLoadingCarriers] = useState(true)
  const [errorCarriers, setErrorCarriers] = useState<Error | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedCarrierForUsers, setSelectedCarrierForUsers] = useState<{ id: string; name: string } | null>(null)
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false)
  const [selectedCarrierForDrivers, setSelectedCarrierForDrivers] = useState<{ id: string; name: string } | null>(null)
  const [isDriversModalOpen, setIsDriversModalOpen] = useState(false)
  const [selectedCarrierForVehicles, setSelectedCarrierForVehicles] = useState<{ id: string; name: string } | null>(null)
  const [isVehiclesModalOpen, setIsVehiclesModalOpen] = useState(false)
  const [selectedCarrierForEdit, setSelectedCarrierForEdit] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

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
        setCarriers(result.carriers || [])
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
      const response = await fetch(`/api/admin/transportadora/delete?id=${carrierId}`, {
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
    ['carrier.created', 'carrier.updated', 'carrier.deleted', 'user.created', 'user.updated'],
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

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
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
        <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 w-full">
            <div className="min-w-0 flex-1 w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words leading-tight">Transportadoras</h1>
                {!loadingCarriers && !errorCarriers && Array.isArray(carriers) && carriers.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-semibold bg-[var(--brand)]/10 text-[var(--brand)]">
                    {carriers.length}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm md:text-base text-[var(--ink-muted)] break-words leading-relaxed">Gerencie transportadoras e motoristas</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto flex-shrink-0 min-h-[44px] h-auto text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-2.5 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Criar Transportadora</span>
              <span className="sm:hidden">Criar</span>
            </Button>
          </div>

          {errorCarriers && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 w-full">
              <p className="text-xs sm:text-sm text-red-800 break-words">Erro ao carregar transportadoras: {errorCarriers instanceof Error ? errorCarriers.message : String(errorCarriers)}</p>
            </div>
          )}

          {loadingCarriers && (
            <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 gap-3 w-full">
              <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              <span className="text-xs sm:text-sm md:text-base text-[var(--ink-muted)] text-center break-words">Carregando transportadoras...</span>
            </div>
          )}

          {!loadingCarriers && !errorCarriers && Array.isArray(carriers) && carriers.length === 0 && (
            <Card className="p-4 sm:p-6 md:p-8 text-center w-full max-w-full overflow-hidden">
              <Truck className="h-10 w-10 sm:h-12 sm:w-12 text-[var(--ink-muted)] mx-auto mb-3 sm:mb-4 flex-shrink-0" />
              <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 break-words px-2">Nenhuma transportadora cadastrada</h3>
              <p className="text-xs sm:text-sm md:text-base text-[var(--ink-muted)] mb-4 break-words px-2">Clique em &quot;Criar Transportadora&quot; para criar uma nova transportadora.</p>
            </Card>
          )}

          {!loadingCarriers && !errorCarriers && Array.isArray(carriers) && carriers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 w-full max-w-full">
              {carriers.map((carrier: any) => (
                <Card key={carrier.id} className="p-4 sm:p-5 overflow-hidden w-full border border-[var(--border)] hover:shadow-lg transition-shadow duration-200 flex flex-col">
                  <div className="flex-1 flex flex-col gap-3 w-full">
                    {/* Header com ícone e nome */}
                    <div className="flex items-start gap-3 mb-1">
                      <div className="p-2 rounded-lg bg-[var(--brand)]/10 flex-shrink-0">
                        <Truck className="h-5 w-5 text-[var(--brand)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base sm:text-lg break-words leading-tight text-[var(--ink)]">
                          {carrier.name}
                        </h3>
                      </div>
                    </div>

                    {/* Informações da transportadora */}
                    <div className="space-y-2 flex-1">
                      {carrier.address && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-[var(--ink-muted)] font-medium min-w-[60px]">Endereço:</span>
                          <p className="text-xs sm:text-sm text-[var(--ink-muted)] break-words flex-1 leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {carrier.address}
                          </p>
                        </div>
                      )}
                      {carrier.phone && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-[var(--ink-muted)] font-medium min-w-[60px]">Telefone:</span>
                          <p className="text-xs sm:text-sm text-[var(--ink-muted)] break-words flex-1 leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {carrier.phone}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCarrierForEdit(carrier)
                          setIsEditModalOpen(true)
                        }}
                        className="w-full min-h-[44px] h-auto text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 touch-manipulation"
                        title="Editar transportadora"
                      >
                        <Edit className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCarrierForUsers({ id: carrier.id, name: carrier.name })
                          setIsUsersModalOpen(true)
                        }}
                        className="w-full min-h-[44px] h-auto text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 touch-manipulation"
                        title="Gerenciar usuários"
                      >
                        <UserPlus className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate hidden sm:inline">Login</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCarrierForDrivers({ id: carrier.id, name: carrier.name })
                          setIsDriversModalOpen(true)
                        }}
                        className="w-full min-h-[44px] h-auto text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 touch-manipulation"
                        title="Gerenciar motoristas"
                      >
                        <Users className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate hidden sm:inline">Motoristas</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCarrierForVehicles({ id: carrier.id, name: carrier.name })
                          setIsVehiclesModalOpen(true)
                        }}
                        className="w-full min-h-[44px] h-auto text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 touch-manipulation"
                        title="Gerenciar veículos"
                      >
                        <Truck className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate hidden sm:inline">Veículos</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCarrier(carrier.id, carrier.name)
                        }}
                        className="w-full col-span-2 min-h-[44px] h-auto text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 touch-manipulation"
                        title="Excluir transportadora"
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
            carrier={selectedCarrierForUsers}
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

        {/* Modal Motoristas */}
        {selectedCarrierForDrivers && (
          <TransportadoraDriversModal
            carrier={selectedCarrierForDrivers}
            isOpen={isDriversModalOpen}
            onClose={() => {
              setIsDriversModalOpen(false)
              setSelectedCarrierForDrivers(null)
            }}
          />
        )}

        {/* Modal Veículos */}
        {selectedCarrierForVehicles && (
          <TransportadoraVehiclesModal
            carrier={selectedCarrierForVehicles}
            isOpen={isVehiclesModalOpen}
            onClose={() => {
              setIsVehiclesModalOpen(false)
              setSelectedCarrierForVehicles(null)
            }}
          />
        )}

        {/* Modal Editar Transportadora */}
        <EditTransportadoraModal
          carrier={selectedCarrierForEdit}
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

