"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wrench, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { useSupabaseSync } from "@/hooks/use-supabase-sync"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface VehicleMaintenance {
  id?: string
  vehicle_id: string
  type: string
  due_at: string
  status: string
  notes?: string
}

interface VehicleMaintenanceModalProps {
  maintenance: VehicleMaintenance | null
  vehicleId: string
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const MAINTENANCE_TYPES = [
  { value: 'preventiva', label: 'Preventiva' },
  { value: 'corretiva', label: 'Corretiva' },
  { value: 'revisao', label: 'Revisão' },
]

const MAINTENANCE_STATUS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'scheduled', label: 'Agendada' },
  { value: 'completed', label: 'Concluída' },
  { value: 'cancelled', label: 'Cancelada' },
]

export function VehicleMaintenanceModal({
  maintenance,
  vehicleId,
  isOpen,
  onClose,
  onSave,
}: VehicleMaintenanceModalProps) {
  const [loading, setLoading] = useState(false)
  const { sync } = useSupabaseSync({ showToast: false })
  const [formData, setFormData] = useState<VehicleMaintenance>({
    vehicle_id: vehicleId,
    type: '',
    due_at: '',
    status: 'pending',
    notes: '',
  })

  useEffect(() => {
    if (maintenance) {
      setFormData({
        ...maintenance,
        due_at: maintenance.due_at ? maintenance.due_at.split('T')[0] : '',
      })
    } else {
      setFormData({
        vehicle_id: vehicleId,
        type: '',
        due_at: '',
        status: 'pending',
        notes: '',
      })
    }
  }, [maintenance, vehicleId, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.type || !formData.due_at) {
        notifyError('', undefined, { i18n: { ns: 'common', key: 'validation.maintenanceTypeExpiryRequired' } })
        return
      }

      const maintenanceData = {
        vehicle_id: formData.vehicle_id,
        type: formData.type,
        due_at: formData.due_at,
        status: formData.status,
        notes: formData.notes || null,
      }

      if (maintenance?.id) {
        // Atualizar
        const { error } = await supabase
          .from("gf_vehicle_maintenance")
          .update(maintenanceData)
          .eq("id", maintenance.id)

        if (error) throw error
        
        // Sincronização com Supabase (garantia adicional)
        await sync({
          resourceType: 'maintenance',
          resourceId: maintenance.id,
          action: 'update',
          data: maintenanceData,
        })
        
        notifySuccess('', { i18n: { ns: 'common', key: 'success.maintenanceUpdated' } })
      } else {
        // Criar
        const { data, error } = await supabase
          .from("gf_vehicle_maintenance")
          .insert(maintenanceData)
          .select()
          .single()

        if (error) throw error
        
        // Sincronização com Supabase (garantia adicional)
        if (data?.id) {
          await sync({
            resourceType: 'maintenance',
            resourceId: data.id,
            action: 'create',
            data: maintenanceData,
          })
        }
        
        notifySuccess('', { i18n: { ns: 'common', key: 'success.maintenanceCreated' } })
      }

      // Log de auditoria
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.from('gf_audit_log').insert({
            actor_id: session.user.id,
            action_type: maintenance?.id ? 'update' : 'create',
            resource_type: 'vehicle_maintenance',
            resource_id: maintenance?.id || null,
            details: { vehicle_id: vehicleId, type: formData.type, status: formData.status }
          })
        }
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError)
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao salvar manutenção:", error)
      notifyError(error, 'Erro ao salvar manutenção', { i18n: { ns: 'common', key: 'errors.saveMaintenance' } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {maintenance ? "Editar Manutenção" : "Nova Manutenção"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Manutenção *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data de Vencimento */}
          <div className="space-y-2">
            <Label htmlFor="due_at" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data de Vencimento *
            </Label>
            <Input
              id="due_at"
              type="date"
              value={formData.due_at}
              onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
              required
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_STATUS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Observações sobre a manutenção..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : maintenance ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

