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
import { CreateCarrierModal } from "@/components/modals/create-carrier-modal"
import { CarrierUsersModal } from "@/components/modals/carrier-users-modal"
import { CarrierDriversModal } from "@/components/modals/carrier-drivers-modal"
import { CarrierVehiclesModal } from "@/components/modals/carrier-vehicles-modal"
import { EditCarrierModal } from "@/components/modals/edit-carrier-modal"

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
      const response = await fetch('/api/admin/carriers-list')
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
      const response = await fetch(`/api/admin/carriers/delete?id=${carrierId}`, {
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
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Transportadoras</h1>
            <p className="text-[var(--muted)]">Gerencie transportadoras e motoristas</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Transportadora
          </Button>
        </div>

        {errorCarriers && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Erro ao carregar transportadoras: {errorCarriers instanceof Error ? errorCarriers.message : String(errorCarriers)}</p>
          </div>
        )}

        {loadingCarriers && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-[var(--muted)]">Carregando transportadoras...</span>
          </div>
        )}

        {!loadingCarriers && !errorCarriers && Array.isArray(carriers) && carriers.length === 0 && (
          <Card className="p-8 text-center">
            <Truck className="h-12 w-12 text-[var(--muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma transportadora cadastrada</h3>
            <p className="text-[var(--muted)] mb-4">Clique em "Criar Transportadora" para criar uma nova transportadora.</p>
          </Card>
        )}

        <div className="grid gap-4">
          {Array.isArray(carriers) && carriers.map((carrier: any) => (
            <Card key={carrier.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-5 w-5 text-[var(--brand)] flex-shrink-0" />
                    <h3 className="font-bold text-lg break-words">{carrier.name}</h3>
                  </div>
                  <p className="text-sm text-[var(--muted)] break-words">{carrier.address || 'Sem endereço'}</p>
                  {carrier.phone && (
                    <p className="text-xs text-[var(--muted)] mt-1 break-words">📞 {carrier.phone}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCarrierForEdit(carrier)
                      setIsEditModalOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCarrierForUsers({ id: carrier.id, name: carrier.name })
                      setIsUsersModalOpen(true)
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Login de Acesso
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCarrierForDrivers({ id: carrier.id, name: carrier.name })
                      setIsDriversModalOpen(true)
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Motoristas
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCarrierForVehicles({ id: carrier.id, name: carrier.name })
                      setIsVehiclesModalOpen(true)
                    }}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Veículos
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCarrier(carrier.id, carrier.name)
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

        {/* Modal Criar Transportadora */}
        <CreateCarrierModal
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
          <CarrierUsersModal
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
          <CarrierDriversModal
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
          <CarrierVehiclesModal
            carrier={selectedCarrierForVehicles}
            isOpen={isVehiclesModalOpen}
            onClose={() => {
              setIsVehiclesModalOpen(false)
              setSelectedCarrierForVehicles(null)
            }}
          />
        )}

        {/* Modal Editar Transportadora */}
        <EditCarrierModal
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

