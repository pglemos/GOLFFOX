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
import toast from "react-hot-toast"
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
  vehicle_id?: string
  driver_id?: string
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
      const { data: drivers } = await supabase
        .from("users")
        .select("*")
        .eq("role", "driver")
        .eq("is_active", true)

      if (drivers) {
        // Filtrar motoristas que não estão em viagem
        const { data: activeTrips } = await supabase
          .from("trips")
          .select("driver_id")
          .eq("status", "inProgress")

        const activeDriverIds = new Set(activeTrips?.map((t: any) => t.driver_id) || [])
        setAvailableDrivers(drivers.filter((d: any) => !activeDriverIds.has(d.id)))
      }

      // Carregar veículos disponíveis (sem viagem em andamento)
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("*")
        .eq("is_active", true)

      if (vehicles) {
        const { data: activeTrips } = await supabase
          .from("trips")
          .select("vehicle_id")
          .eq("status", "inProgress")

        const activeVehicleIds = new Set(activeTrips?.map((t: any) => t.vehicle_id) || [])
        setAvailableVehicles(vehicles.filter((v: any) => !activeVehicleIds.has(v.id)))
      }
    } catch (error) {
      console.error("Erro ao carregar recursos:", error)
    }
  }

  const handleDispatch = async () => {
    if (!selectedDriverId || !selectedVehicleId) {
      toast.error("Selecione um motorista e um veículo")
      return
    }

    if (!request) return

    setLoading(true)
    try {
      const { error } = await supabase
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

      toast.success("Socorro despachado com sucesso!")
      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao despachar:", error)
      toast.error(error.message || "Erro ao despachar socorro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-[var(--error)]" />
            Despachar Socorro
          </DialogTitle>
        </DialogHeader>

        {request && (
          <div className="space-y-6">
            {/* Informações da Ocorrência */}
            <div className="p-4 bg-[var(--error-light)] rounded-lg border border-[var(--error)]/20">
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
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Motorista de Socorro *
              </Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um motorista disponível" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name} - {driver.email}
                    </SelectItem>
                  ))}
                  {availableDrivers.length === 0 && (
                    <SelectItem value="none" disabled>
                      Nenhum motorista disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--ink-muted)]">
                {availableDrivers.length} motorista(s) disponível(is)
              </p>
            </div>

            {/* Seleção de Veículo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Veículo de Socorro *
              </Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um veículo disponível" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.model || "Sem modelo"}
                    </SelectItem>
                  ))}
                  {availableVehicles.length === 0 && (
                    <SelectItem value="none" disabled>
                      Nenhum veículo disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--ink-muted)]">
                {availableVehicles.length} veículo(s) disponível(is)
              </p>
            </div>

            {/* Rota Afetada (se houver) */}
            {request.route_id && (
              <div className="p-3 bg-[var(--bg-soft)] rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className="h-4 w-4 text-[var(--brand)]" />
                  <span className="text-sm font-medium">Rota Afetada</span>
                </div>
                <p className="text-xs text-[var(--ink-muted)]">ID: {request.route_id.slice(0, 8)}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDispatch}
            disabled={loading || !selectedDriverId || !selectedVehicleId}
            className="bg-[var(--error)] hover:bg-[var(--error)]/90"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? "Despachando..." : "Despachar Socorro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

