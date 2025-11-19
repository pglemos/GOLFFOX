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
import { Label } from "@/components/ui/label"
import { ClipboardCheck } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"

interface VehicleChecklist {
  id?: string
  vehicle_id: string
  driver_id?: string
  filled_at: string
  status: string
  issues: any
  notes?: string
}

interface VehicleChecklistModalProps {
  checklist: VehicleChecklist | null
  vehicleId: string
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const CHECKLIST_STATUS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'completed', label: 'Concluído' },
  { value: 'failed', label: 'Falhou' },
]

const CHECKLIST_ITEMS = [
  { key: 'lights', label: 'Faróis' },
  { key: 'tires', label: 'Pneus' },
  { key: 'brakes', label: 'Freios' },
  { key: 'fluids', label: 'Fluidos' },
  { key: 'mirrors', label: 'Espelhos' },
  { key: 'seatbelts', label: 'Cintos de Segurança' },
  { key: 'horn', label: 'Buzina' },
  { key: 'wipers', label: 'Limpadores' },
]

export function VehicleChecklistModal({
  checklist,
  vehicleId,
  isOpen,
  onClose,
  onSave,
}: VehicleChecklistModalProps) {
  const [loading, setLoading] = useState(false)
  const { sync } = useSupabaseSync({ showToast: false })
  const [drivers, setDrivers] = useState<any[]>([])
  const [formData, setFormData] = useState<VehicleChecklist>({
    vehicle_id: vehicleId,
    driver_id: '',
    filled_at: new Date().toISOString().split('T')[0],
    status: 'pending',
    issues: {},
    notes: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadDrivers()
    }
    if (checklist) {
      setFormData({
        ...checklist,
        filled_at: checklist.filled_at ? checklist.filled_at.split('T')[0] : new Date().toISOString().split('T')[0],
        issues: checklist.issues || {},
      })
    } else {
      setFormData({
        vehicle_id: vehicleId,
        driver_id: '',
        filled_at: new Date().toISOString().split('T')[0],
        status: 'pending',
        issues: {},
        notes: '',
      })
    }
  }, [checklist, vehicleId, isOpen])

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "driver")
        .eq("is_active", true)

      if (error) throw error
      setDrivers(data || [])
    } catch (error) {
      console.error("Erro ao carregar motoristas:", error)
    }
  }

  const handleIssueChange = (itemKey: string, checked: boolean) => {
    setFormData({
      ...formData,
      issues: {
        ...formData.issues,
        [itemKey]: checked ? 'ok' : 'failed',
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.driver_id || !formData.status) {
        notifyError('', undefined, { i18n: { ns: 'common', key: 'validation.driverStatusRequired' } })
        return
      }

      const checklistData = {
        vehicle_id: formData.vehicle_id,
        driver_id: formData.driver_id,
        filled_at: formData.filled_at,
        status: formData.status,
        issues: formData.issues,
        notes: formData.notes || null,
      }

      if (checklist?.id) {
        // Atualizar
        const { error } = await (supabase as any)
          .from("gf_vehicle_checklists")
          .update(checklistData)
          .eq("id", checklist.id)

        if (error) throw error
        
        // Sincronização com Supabase (garantia adicional)
        await sync({
          resourceType: 'checklist',
          resourceId: checklist.id,
          action: 'update',
          data: checklistData,
        })
        
        notifySuccess('', { i18n: { ns: 'common', key: 'success.checklistUpdated' } })
      } else {
        // Criar
        const { data, error } = await (supabase as any)
          .from("gf_vehicle_checklists")
          .insert(checklistData)
          .select()
          .single()

        if (error) throw error
        
        // Sincronização com Supabase (garantia adicional)
        if (data?.id) {
          await sync({
            resourceType: 'checklist',
            resourceId: data.id,
            action: 'create',
            data: checklistData,
          })
        }
        
        notifySuccess('', { i18n: { ns: 'common', key: 'success.checklistCreated' } })
      }

      // Log de auditoria
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await (supabase as any).from('gf_audit_log').insert({
            actor_id: session.user.id,
            action_type: checklist?.id ? 'update' : 'create',
            resource_type: 'vehicle_checklist',
            resource_id: checklist?.id || null,
            details: { vehicle_id: vehicleId, status: formData.status, issues_count: Object.keys(formData.issues).length }
          })
        }
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError)
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao salvar checklist:", error)
      notifyError(error, 'Erro ao salvar checklist', { i18n: { ns: 'common', key: 'errors.saveChecklist' } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <ClipboardCheck className="h-5 w-5 flex-shrink-0" />
            {checklist ? "Editar Checklist" : "Novo Checklist"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Motorista */}
          <div className="space-y-2">
            <Label htmlFor="driver_id" className="text-base font-medium">Motorista *</Label>
            <Select
              value={formData.driver_id || ''}
              onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
              required
            >
              <SelectTrigger className="h-11 sm:h-12 text-base">
                <SelectValue placeholder="Selecione o motorista" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name || driver.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="filled_at" className="text-base font-medium">Data de Preenchimento</Label>
            <input
              id="filled_at"
              type="date"
              value={formData.filled_at}
              onChange={(e) => setFormData({ ...formData, filled_at: e.target.value })}
              className="w-full h-11 sm:h-12 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-[var(--border)] bg-white text-base"
            />
          </div>

          {/* Itens do Checklist */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Itens do Checklist</Label>
            <div className="space-y-2 border rounded-lg p-4">
              {CHECKLIST_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.issues[item.key] === 'ok'}
                    onCheckedChange={(checked) => handleIssueChange(item.key, checked as boolean)}
                  />
                  <Label className="cursor-pointer">{item.label}</Label>
                  {formData.issues[item.key] === 'failed' && (
                    <span className="text-xs text-red-500 ml-auto">Falhou</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-base font-medium">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              required
            >
              <SelectTrigger className="h-11 sm:h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHECKLIST_STATUS.map((status) => (
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
              rows={3}
              placeholder="Observações sobre o checklist..."
              className="text-base min-h-[80px]"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1 min-h-[44px] text-base font-medium"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto order-1 sm:order-2 bg-orange-500 hover:bg-orange-600 min-h-[44px] text-base font-medium"
            >
              {loading ? "Salvando..." : checklist ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

