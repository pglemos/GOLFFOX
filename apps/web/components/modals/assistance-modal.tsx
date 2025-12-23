"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LifeBuoy, Send, Truck, Users, Navigation } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { formatError } from "@/lib/error-utils"
import { useSupabaseSync } from "@/hooks/use-supabase-sync"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AssistanceRequest {
  id: string
  trip_id?: string
  route_id?: string
  veiculo_id?: string
  motorista_id?: string
  request_type: string
  description?: string
  latitude?: number
  longitude?: number
  address?: string
  status: 'open' | 'dispatched' | 'resolved' | 'cancelled'
  dispatched_driver_id?: string
  dispatched_vehicle_id?: string
}

interface AssistanceModalProps {
  request: AssistanceRequest | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function AssistanceModal({ request, isOpen, onClose, onSave }: AssistanceModalProps) {
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([])
  const [selectedDriverId, setSelectedDriverId] = useState<string>("")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const { sync } = useSupabaseSync({ showToast: false })

  useEffect(() => {
    if (isOpen && request) {
      loadAvailableResources()
    }
  }, [isOpen, request])

  const loadAvailableResources = async () => {
    try {
      // Carregar motoristas disponíveis (sem viagem em andamento)
      const { data: motoristas } = await supabase
        .from("users")
        .select("*")
        .eq("role", "motorista")
        .eq("is_active", true)

      if (motoristas) {
        // Filtrar motoristas que não estão em viagem
        const { data: activeTrips } = await supabase
          .from("trips")
          .select("motorista_id")
          .eq("status", "inProgress")

        const activeDriverIds = new Set(activeTrips?.map((t: any) => t.motorista_id) || [])
        setAvailableDrivers(motoristas.filter((d: any) => !activeDriverIds.has(d.id)))
      }

      // Carregar veículos disponíveis (sem viagem em andamento)
      const { data: veiculos } = await supabase
        .from("veiculos")
        .select("*")
        .eq("is_active", true)

      if (veiculos) {
        const { data: activeTrips } = await supabase
          .from("trips")
          .select("veiculo_id")
          .eq("status", "inProgress")

        const activeVehicleIds = new Set(activeTrips?.map((t: any) => t.veiculo_id) || [])
        setAvailableVehicles(veiculos.filter((v: any) => !activeVehicleIds.has(v.id)))
      }
    } catch (error) {
      console.error("Erro ao carregar recursos:", error)
    }
  }

  const handleDispatch = async () => {
    if (!selectedDriverId || !selectedVehicleId) {
      notifyError("Selecione um motorista e um veículo", undefined, { i18n: { ns: 'common', key: 'validation.selectDriverVehicle' } })
      return
    }

    if (!request) return

    setLoading(true)
    try {
      const { error } = await (supabase as any)
        .from("gf_assistance_requests")
        .update({
          status: 'dispatched',
          dispatched_driver_id: selectedDriverId,
          dispatched_vehicle_id: selectedVehicleId,
          updated_at: new Date().toISOString()
        })
        .eq("id", request.id)

      if (error) throw error

      // Sincronização com Supabase (garantia adicional)
      await sync({
        resourceType: 'assistance',
        resourceId: request.id,
        action: 'update',
        data: {
          status: 'dispatched',
          dispatched_driver_id: selectedDriverId,
          dispatched_vehicle_id: selectedVehicleId,
        },
      })

      notifySuccess("Socorro despachado com sucesso!", { i18n: { ns: 'common', key: 'success.assistanceDispatched' } })
      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao despachar:", error)
      notifyError(formatError(error, "Erro ao despachar socorro"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <LifeBuoy className="h-5 w-5 text-error flex-shrink-0" />
            Despachar Socorro
          </DialogTitle>
        </DialogHeader>

        {request && (
          <div className="space-y-4 sm:space-y-6">
            {/* Informações da Ocorrência */}
            <div className="p-4 bg-error-light rounded-lg border border-error/20">
              <h3 className="font-semibold mb-2">Ocorrência #{request.id.slice(0, 8)}</h3>
              <p className="text-sm mb-2">
                <span className="font-medium">Tipo:</span> {request.request_type}
              </p>
              {request.description && (
                <p className="text-sm mb-2">
                  <span className="font-medium">Descrição:</span> {request.description}
                </p>
              )}
              {request.address && (
                <p className="text-sm">
                  <span className="font-medium">Local:</span> {request.address}
                </p>
              )}
            </div>

            {/* Seleção de Motorista */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0" />
                Motorista de Socorro *
              </Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger className="min-h-[48px] text-base">
                  <SelectValue placeholder="Selecione um motorista disponível" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((motorista) => (
                    <SelectItem key={motorista.id} value={motorista.id}>
                      {motorista.name} - {motorista.email}
                    </SelectItem>
                  ))}
                  {availableDrivers.length === 0 && (
                    <SelectItem value="none" disabled>
                      Nenhum motorista disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-ink-muted">
                {availableDrivers.length} motorista(s) disponível(is)
              </p>
            </div>

            {/* Seleção de Veículo */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Truck className="h-4 w-4 flex-shrink-0" />
                Veículo de Socorro *
              </Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger className="min-h-[48px] text-base">
                  <SelectValue placeholder="Selecione um veículo disponível" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((veiculo) => (
                    <SelectItem key={veiculo.id} value={veiculo.id}>
                      {veiculo.plate} - {veiculo.model || "Sem modelo"}
                    </SelectItem>
                  ))}
                  {availableVehicles.length === 0 && (
                    <SelectItem value="none" disabled>
                      Nenhum veículo disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-ink-muted">
                {availableVehicles.length} veículo(s) disponível(is)
              </p>
            </div>

            {/* Rota Afetada (se houver) */}
            {request.route_id && (
              <div className="p-3 bg-bg-soft rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className="h-4 w-4 text-brand" />
                  <span className="text-sm font-medium">Rota Afetada</span>
                </div>
                <p className="text-xs text-ink-muted">ID: {request.route_id.slice(0, 8)}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto order-2 sm:order-1 text-base font-medium"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDispatch} 
            disabled={loading || !selectedDriverId || !selectedVehicleId}
            className="bg-error hover:bg-error/90 w-full sm:w-auto order-1 sm:order-2 text-base font-medium"
          >
            <Send className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">{loading ? "Despachando..." : "Despachar Socorro"}</span>
            <span className="sm:hidden">{loading ? "Despachando..." : "Despachar"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

