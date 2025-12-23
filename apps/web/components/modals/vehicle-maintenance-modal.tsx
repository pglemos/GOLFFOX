"use client"

import { useState, useEffect } from "react"

import { Wrench, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSupabaseSync } from "@/hooks/use-supabase-sync"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"

interface VeiculoMaintenance {
  id?: string
  veiculo_id: string
  type: string
  due_at: string
  status: string
  notes?: string
}

interface VehicleMaintenanceModalProps {
  maintenance: VeiculoMaintenance | null
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
  const [formData, setFormData] = useState<VeiculoMaintenance>({
    veiculo_id: vehicleId,
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
        veiculo_id: vehicleId,
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
        veiculo_id: formData.veiculo_id,
        type: formData.type,
        due_at: formData.due_at,
        status: formData.status,
        notes: formData.notes || null,
      }

      if (maintenance?.id) {
        // Atualizar
        const { error } = await (supabase as any)
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
        const { data, error } = await (supabase as any)
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
          await (supabase as any).from('gf_audit_log').insert({
            actor_id: session.user.id,
            action_type: maintenance?.id ? 'update' : 'create',
            resource_type: 'veiculo_maintenance',
            resource_id: maintenance?.id || null,
            details: { veiculo_id: vehicleId, type: formData.type, status: formData.status }
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
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <Wrench className="h-5 w-5 flex-shrink-0" />
            {maintenance ? "Editar Manutenção" : "Nova Manutenção"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-base font-medium">Tipo de Manutenção *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              required
            >
              <SelectTrigger className="min-h-[48px] text-base">
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
            <Label htmlFor="due_at" className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              Data de Vencimento *
            </Label>
            <Input
              id="due_at"
              type="date"
              value={formData.due_at}
              onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
              required
              className="text-base"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-base font-medium">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="min-h-[48px] text-base">
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
            <Label htmlFor="notes" className="text-base font-medium">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Observações sobre a manutenção..."
              className="text-base min-h-[100px]"
            />
          </div>

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
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto order-1 sm:order-2 bg-brand hover:bg-brand-hover text-base font-medium"
            >
              {loading ? "Salvando..." : maintenance ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

