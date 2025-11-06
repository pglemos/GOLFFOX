"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
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
import { Truck, Upload, X, Calendar, Wrench, ClipboardCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"
import { auditLogs } from "@/lib/audit-log"
import { useSupabaseSync } from "@/hooks/use-supabase-sync"

interface Vehicle {
  id?: string
  plate: string
  model: string
  year: number | string
  capacity: number | string
  prefix?: string
  company_id?: string
  is_active?: boolean
  photo_url?: string | null
}

interface VehicleModalProps {
  vehicle: Vehicle | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function VehicleModal({ vehicle, isOpen, onClose, onSave }: VehicleModalProps) {
  const [formData, setFormData] = useState<Vehicle>({
    plate: "",
    model: "",
    year: "",
    capacity: "",
    prefix: "",
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const { sync } = useSupabaseSync({ showToast: false }) // Toast já é mostrado no modal
  const [capacitySupported, setCapacitySupported] = useState<boolean>(true)

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle)
      setPhotoPreview(vehicle.photo_url || "")
    } else {
      setFormData({
        plate: "",
        model: "",
        year: "",
        capacity: "",
        prefix: "",
        is_active: true
      })
      setPhotoPreview("")
    }
    setPhotoFile(null)
  }, [vehicle, isOpen])

  // Verificar suporte à coluna 'capacity' (alguns ambientes podem não ter aplicado a migration)
  useEffect(() => {
    const checkCapacitySupport = async () => {
      try {
        // Tentar fazer uma query simples para verificar se a coluna existe
        const { error } = await supabase
          .from("vehicles")
          .select("id, capacity")
          .limit(1)

        if (error) {
          const msg = String(error.message || error).toLowerCase()
          // PostgREST costuma retornar erro de schema cache quando a coluna não existe
          if (msg.includes("capacity") || msg.includes("schema cache") || msg.includes("column")) {
            console.warn("⚠️ Coluna 'capacity' não disponível no schema atual. O campo será omitido ao salvar.")
            setCapacitySupported(false)
            return
          }
          // Se for outro tipo de erro, assumir que não suporta
          console.warn("⚠️ Erro ao verificar capacity, assumindo não suportado:", error.message)
          setCapacitySupported(false)
          return
        }
        
        // Se não houve erro, a coluna existe
        console.log("✅ Coluna 'capacity' está disponível no schema")
        setCapacitySupported(true)
      } catch (e: any) {
        // Em caso de erro, assumir que não suporta para evitar problemas
        console.warn("⚠️ Falha ao verificar suporte de 'capacity', assumindo não suportado:", e?.message || e)
        setCapacitySupported(false)
      }
    }
    checkCapacitySupport()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 5MB")
        return
      }
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadPhoto = async (vehicleId: string): Promise<string | null> => {
    if (!photoFile) return formData.photo_url || null

    try {
      const fileExt = photoFile.name.split('.').pop()
      const fileName = `${vehicleId}-${Date.now()}.${fileExt}`
      const filePath = `vehicles/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('vehicle-photos')
        .upload(filePath, photoFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error)
      toast.error("Erro ao fazer upload da foto")
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let vehicleId = vehicle?.id

      // Upload da foto primeiro se houver
      let photoUrl: string | null = formData.photo_url ?? null
      if (photoFile && vehicleId) {
        photoUrl = await uploadPhoto(vehicleId)
      }

      // Preparar dados do veículo (SEM capacity, company_id e is_active - sempre removidos por segurança)
      const vehicleDataRaw: any = {
        plate: formData.plate,
        model: formData.model,
        year: formData.year ? parseInt(formData.year as string) : null,
        prefix: formData.prefix || null,
        photo_url: photoUrl || null,
        // NÃO incluir company_id, capacity ou is_active - essas colunas não existem no banco de produção
      }
      
      // NUNCA adicionar capacity, company_id ou is_active ao payload - essas colunas não existem no banco
      
      // Criar objeto final SEM capacity, company_id e is_active (sempre removidos)
      const finalVehicleData: any = { ...vehicleDataRaw }
      
      // GARANTIR que capacity, company_id e is_active NUNCA estão presentes (remoção definitiva)
      if ('capacity' in finalVehicleData) {
        delete finalVehicleData.capacity
      }
      if ('company_id' in finalVehicleData) {
        delete finalVehicleData.company_id
      }
      if ('is_active' in finalVehicleData) {
        delete finalVehicleData.is_active
      }
      
      // Log para debug
      if (formData.capacity) {
        console.warn('⚠️ Capacity removido do payload (coluna não existe no banco):', {
          capacityOriginal: formData.capacity,
          finalDataKeys: Object.keys(finalVehicleData),
          hasCapacity: 'capacity' in finalVehicleData
        })
      }
      
      // GARANTIR que capacity, company_id e is_active NUNCA estão presentes antes de qualquer operação
      if ('capacity' in finalVehicleData) {
        delete finalVehicleData.capacity
        console.warn('🔒 Capacity removido do payload antes de operação (coluna não existe)')
      }
      if ('company_id' in finalVehicleData) {
        delete finalVehicleData.company_id
        console.warn('🔒 Company_id removido do payload antes de operação (coluna não existe)')
      }
      if ('is_active' in finalVehicleData) {
        delete finalVehicleData.is_active
        console.warn('🔒 Is_active removido do payload antes de operação (coluna não existe)')
      }
      
      if (vehicleId) {
        // Atualizar
        const { error } = await supabase
          .from("vehicles")
          .update(finalVehicleData)
          .eq("id", vehicleId)

        if (error) throw error
        
        // Sincronização com Supabase (garantia adicional)
        await sync({
          resourceType: 'vehicle',
          resourceId: vehicleId,
          action: 'update',
          data: finalVehicleData,
        })
        
        toast.success("Veículo atualizado com sucesso!")
        
        // Log de auditoria
        await auditLogs.update('vehicle', vehicleId, { plate: finalVehicleData.plate, model: finalVehicleData.model })
      } else {
        // GARANTIR que capacity, company_id e is_active NUNCA estão presentes antes de criar
        if ('capacity' in finalVehicleData) {
          delete finalVehicleData.capacity
          console.warn('🔒 Capacity removido do payload antes de criar (coluna não existe)')
        }
        if ('company_id' in finalVehicleData) {
          delete finalVehicleData.company_id
          console.warn('🔒 Company_id removido do payload antes de criar (coluna não existe)')
        }
        if ('is_active' in finalVehicleData) {
          delete finalVehicleData.is_active
          console.warn('🔒 Is_active removido do payload antes de criar (coluna não existe)')
        }
        
        // Criar
        const { data, error } = await supabase
          .from("vehicles")
          .insert(finalVehicleData)
          .select()
          .single()

        if (error) throw error
        
        vehicleId = data.id

        // Upload da foto após criar
        if (photoFile && vehicleId) {
          photoUrl = await uploadPhoto(vehicleId)
          await supabase
            .from("vehicles")
            .update({ photo_url: photoUrl })
            .eq("id", vehicleId)
        }

        // Sincronização com Supabase (garantia adicional)
        await sync({
          resourceType: 'vehicle',
          resourceId: vehicleId || '',
          action: 'create',
          data: finalVehicleData,
        })
        
        toast.success("Veículo cadastrado com sucesso!")
        
        // Log de auditoria
        if (vehicleId) {
          await auditLogs.create('vehicle', vehicleId, { 
            plate: finalVehicleData.plate || '', 
            model: finalVehicleData.model || '' 
          })
        }
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao salvar veículo:", error)
      toast.error(error.message || "Erro ao salvar veículo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {vehicle ? "Editar Veículo" : "Cadastrar Veículo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto do Veículo */}
          <div className="space-y-2">
            <Label>Foto do Veículo</Label>
            <div className="flex items-center gap-4">
              {photoPreview && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview("")
                      setPhotoFile(null)
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {photoPreview ? "Trocar Foto" : "Upload Foto"}
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-[var(--ink-muted)] mt-1">
                  Máximo 5MB (JPG, PNG)
                </p>
              </div>
            </div>
          </div>

          {/* Grid de Campos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plate">Placa *</Label>
              <Input
                id="plate"
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                placeholder="ABC-1234"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefix">Prefixo</Label>
              <Input
                id="prefix"
                value={formData.prefix || ""}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                placeholder="001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Mercedes-Benz O500U"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="2023"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade *</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="40"
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.is_active ? "active" : "inactive"}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "active" })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : vehicle ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

