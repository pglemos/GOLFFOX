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
import toast from "react-hot-toast"
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
        toast.error("Motorista e status são obrigatórios")
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
        const { error } = await supabase
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
        
        toast.success("Checklist atualizado com sucesso!")
      } else {
        // Criar
        const { data, error } = await supabase
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
        
        toast.success("Checklist cadastrado com sucesso!")
      }

      // Log de auditoria
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.from('gf_audit_log').insert({
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
      toast.error(error.message || "Erro ao salvar checklist")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {checklist ? "Editar Checklist" : "Novo Checklist"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Motorista */}
          <div className="space-y-2">
            <Label htmlFor="driver_id">Motorista *</Label>
            <Select
              value={formData.driver_id || ''}
              onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
              required
            >
              <SelectTrigger>
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
            <Label htmlFor="filled_at">Data de Preenchimento</Label>
            <input
              id="filled_at"
              type="date"
              value={formData.filled_at}
              onChange={(e) => setFormData({ ...formData, filled_at: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white"
            />
          </div>

          {/* Itens do Checklist */}
          <div className="space-y-2">
            <Label>Itens do Checklist</Label>
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
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              required
            >
              <SelectTrigger>
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
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Observações sobre o checklist..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : checklist ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

