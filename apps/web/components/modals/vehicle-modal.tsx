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
import { notifySuccess, notifyError } from "@/lib/toast"
import { t } from "@/lib/i18n"
import { formatError } from "@/lib/error-utils"
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
  transportadora_id?: string
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
  const [userInfo, setUserInfo] = useState<{role?: string, company_id?: string, transportadora_id?: string}>({})
  const { sync } = useSupabaseSync({ showToast: false }) // Toast já é mostrado no modal

  // Carregar informações do usuário para determinar company_id/transportadora_id
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: userData, error } = await (supabase as any)
            .from('users')
            .select('role, company_id, transportadora_id')
            .eq('id', session.user.id)
            .single()
          
          if (!error && userData) {
            setUserInfo({
              role: (userData as any).role,
              company_id: (userData as any).company_id,
              transportadora_id: (userData as any).transportadora_id
            })
          }
        }
      } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error)
      }
    }
    
    if (isOpen) {
      loadUserInfo()
    }
  }, [isOpen])

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notifyError("Arquivo muito grande. Máximo 5MB", undefined, { i18n: { ns: 'common', key: 'validation.fileTooLarge' } })
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

      const { error: uploadError } = await (supabase as any).storage
        .from('vehicle-photos')
        .upload(filePath, photoFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data } = (supabase as any).storage
        .from('vehicle-photos')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error)
      notifyError(formatError(error, "Erro ao fazer upload da foto"))
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let vehicleId = vehicle?.id

      // Preparar dados do veículo com validação rigorosa
      let photoUrl: string | null = formData.photo_url ?? null
      
      // Upload da foto ANTES se for update (já temos o ID)
      // Com timeout para evitar travamento
      if (photoFile && vehicleId) {
        try {
          const uploadPromise = uploadPhoto(vehicleId)
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout no upload da foto (30s)')), 30000)
          )
          
          const uploadedUrl = await Promise.race([uploadPromise, timeoutPromise]) as string | null
          if (uploadedUrl) {
            photoUrl = uploadedUrl
          }
        } catch (uploadError: any) {
          console.warn('⚠️ Erro no upload da foto (continuando sem foto):', uploadError)
          // Continuar sem foto se houver erro no upload
        }
      }

      // Converter year e capacity para números, tratando strings vazias
      let yearValue: number | null = null
      if (formData.year) {
        const yearNum = typeof formData.year === 'string' ? parseInt(formData.year) : formData.year
        if (!isNaN(yearNum)) {
          yearValue = yearNum
        }
      }

      let capacityValue: number | null = null
      if (formData.capacity) {
        const capacityNum = typeof formData.capacity === 'string' ? parseInt(formData.capacity) : formData.capacity
        if (!isNaN(capacityNum)) {
          capacityValue = capacityNum
        }
      }

      const vehicleDataRaw: any = {
        plate: formData.plate?.trim().toUpperCase() || null,
        model: formData.model?.trim() || null,
        year: yearValue,
        prefix: formData.prefix?.trim() || null,
        capacity: capacityValue,
        is_active: formData.is_active !== undefined ? Boolean(formData.is_active) : true,
      }

      // Incluir photo_url apenas se houver valor
      if (photoUrl) {
        vehicleDataRaw.photo_url = photoUrl
      }

      // Incluir company_id ou transportadora_id baseado no papel do usuário
      // Para admin: pode definir qualquer company_id
      // Para operator: deve usar o company_id do usuário
      // Para transportadora: deve usar o transportadora_id do usuário
      if (userInfo.role === 'admin') {
        // Admin pode definir company_id manualmente se fornecido no formData
        if (formData.company_id) {
          vehicleDataRaw.company_id = formData.company_id
        }
      } else if (userInfo.role === 'operador') {
        // Operator deve usar seu próprio company_id
        if (userInfo.company_id) {
          vehicleDataRaw.company_id = userInfo.company_id
        } else if (formData.company_id) {
          vehicleDataRaw.company_id = formData.company_id
        }
      } else if (userInfo.role === 'transportadora') {
        // Transportadora deve usar seu próprio transportadora_id
        if (userInfo.transportadora_id) {
          vehicleDataRaw.transportadora_id = userInfo.transportadora_id
        }
      }
      
      // Se for update, manter company_id/transportadora_id existente se não foi alterado
      if (vehicleId && vehicle) {
        if (!vehicleDataRaw.company_id && vehicle.company_id) {
          vehicleDataRaw.company_id = vehicle.company_id
        }
        if (!vehicleDataRaw.transportadora_id && (vehicle as any).transportadora_id) {
          vehicleDataRaw.transportadora_id = (vehicle as any).transportadora_id
        }
      }

      // Validar campos obrigatórios
      if (!vehicleDataRaw.plate) {
        throw new Error('Placa é obrigatória')
      }
      if (!vehicleDataRaw.model) {
        throw new Error('Modelo é obrigatório')
      }

      // Validar tipos numéricos
      if (vehicleDataRaw.year !== null && vehicleDataRaw.year !== undefined && (isNaN(vehicleDataRaw.year) || vehicleDataRaw.year < 1900 || vehicleDataRaw.year > new Date().getFullYear() + 1)) {
        throw new Error('Ano inválido')
      }
      // Capacity é opcional, mas se fornecido, deve ser válido
      if (vehicleDataRaw.capacity !== null && vehicleDataRaw.capacity !== undefined && vehicleDataRaw.capacity !== '' && (isNaN(vehicleDataRaw.capacity) || vehicleDataRaw.capacity < 1)) {
        throw new Error('Capacidade deve ser um número maior que zero')
      }

      // Preparar dados finais: incluir todos os campos válidos
      // Para update, incluir apenas campos que foram alterados
      // Para create, incluir todos os campos necessários
      const finalVehicleData: any = {}
      Object.keys(vehicleDataRaw).forEach(key => {
        const value = vehicleDataRaw[key]
        // Incluir:
        // - Valores não-null e não-undefined
        // - Strings não-vazias (exceto prefix que pode ser vazio)
        // - Números (incluindo 0)
        // - Booleans (incluindo false)
        if (value !== null && value !== undefined) {
          if (typeof value === 'string') {
            // Para strings, incluir apenas se não for vazia (exceto prefix)
            if (value.trim() !== '' || key === 'prefix') {
              finalVehicleData[key] = value.trim()
            }
          } else {
            // Para números e booleans, sempre incluir
            finalVehicleData[key] = value
          }
        }
      })
      
      // Validar que há dados para salvar
      if (Object.keys(finalVehicleData).length === 0) {
        throw new Error('Nenhum dado para salvar. Verifique os campos preenchidos.')
      }
      
      console.log('📤 Dados a serem salvos:', finalVehicleData)
      console.log('📊 Total de campos:', Object.keys(finalVehicleData).length)
      
      if (vehicleId) {
        // ATUALIZAR via API service role (evita RLS)
        if (!vehicleId || vehicleId.trim() === '') {
          throw new Error('ID do veículo inválido')
        }

        console.log('🔄 Atualizando veículo via API:', vehicleId)
        console.log('📦 Payload:', JSON.stringify(finalVehicleData, null, 2))

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)
        let resp: Response
        try {
          resp = await fetch(`/api/admin/vehicles/${vehicleId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalVehicleData),
            signal: controller.signal,
          })
        } catch (err: any) {
          clearTimeout(timeout)
          const msg = err?.name === 'AbortError' ? 'Timeout na atualização (30s)' : (err?.message || 'Falha de rede')
          throw new Error(`Erro de conexão: ${msg}`)
        }
        clearTimeout(timeout)

        if (!resp.ok) {
          let errBody: any = null
          try { errBody = await resp.json() } catch {}
          const message = errBody?.message || 'Erro ao atualizar veículo'
          throw new Error(message)
        }

        const data = await resp.json()
        console.log('✅ Veículo atualizado com sucesso:', data)
        notifySuccess(t('common', 'success.vehicleUpdated'))
        
        // Log de auditoria (não bloquear em caso de erro)
        try {
          await Promise.race([
            auditLogs.update('vehicle', vehicleId, { 
              plate: finalVehicleData.plate, 
              model: finalVehicleData.model 
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ])
        } catch (auditError) {
          console.warn('⚠️ Erro ao registrar log de auditoria (não crítico):', auditError)
        }
      } else {
        // CRIAR via API service role (evita RLS)
        console.log('🆕 Criando novo veículo via API')
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)
        let resp: Response
        try {
          resp = await fetch('/api/admin/vehicles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalVehicleData),
            signal: controller.signal,
          })
        } catch (err: any) {
          clearTimeout(timeout)
          const msg = err?.name === 'AbortError' ? 'Timeout na criação (30s)' : (err?.message || 'Falha de rede')
          throw new Error(`Erro de conexão: ${msg}`)
        }
        clearTimeout(timeout)

        if (!resp.ok) {
          let errBody: any = null
          try { errBody = await resp.json() } catch {}
          const message = errBody?.message || 'Erro ao cadastrar veículo'
          throw new Error(message)
        }

        const data = await resp.json()
        if (!data?.id) {
          throw new Error('Veículo criado mas ID não retornado')
        }
        vehicleId = data.id
        console.log('✅ Veículo criado com sucesso:', data)

        // Upload da foto APÓS criar (se houver foto pendente)
        if (photoFile && vehicleId) {
          const uploadedUrl = await uploadPhoto(vehicleId)
          if (uploadedUrl) {
            try {
              const respPhoto = await fetch(`/api/admin/vehicles/${vehicleId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo_url: uploadedUrl }),
              })
              if (!respPhoto.ok) {
                console.warn('⚠️ Erro ao atualizar foto após criar veículo (não crítico): status', respPhoto.status)
              }
            } catch (e) {
              console.warn('⚠️ Erro de rede ao atualizar foto (não crítico):', e)
            }
          }
        }

        notifySuccess(t('common', 'success.vehicleCreated'))
        
        // Log de auditoria (não bloquear em caso de erro)
        try {
          if (vehicleId) {
            await auditLogs.create('vehicle', vehicleId, { 
              plate: finalVehicleData.plate || '', 
              model: finalVehicleData.model || '' 
            })
          }
        } catch (auditError) {
          console.warn('⚠️ Erro ao registrar log de auditoria (não crítico):', auditError)
        }
      }

      // Aguardar um pouco antes de fechar para garantir que tudo foi salvo
      await new Promise(resolve => setTimeout(resolve, 100))
      
      onSave()
      onClose()
    } catch (error: any) {
      console.error("❌ Erro ao salvar veículo:", error)
      
      // Extrair mensagem de erro de forma mais robusta
      let errorMessage = "Erro ao salvar veículo"
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.toString) {
        errorMessage = error.toString()
      }
      
      // Log completo do erro para debug
      console.error("Detalhes completos do erro:", {
        error,
        message: errorMessage,
        stack: error?.stack,
        name: error?.name
      })
      
      notifyError(formatError(error, errorMessage), undefined, {
        duration: 5000,
        style: {
          background: '#ef4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        }
      })
    } finally {
      // SEMPRE resetar loading, mesmo se houver erro não capturado
      setLoading(false)
      
      // Garantir que o loading seja resetado após um tempo máximo
      setTimeout(() => {
        setLoading(false)
      }, 100)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <Truck className="h-5 w-5 flex-shrink-0" />
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
                  <Button type="button" variant="outline" size="sm" asChild className="min-h-[44px] touch-manipulation">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
              <Label htmlFor="capacity">Capacidade</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity || ""}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value || "" })}
                placeholder="40"
                min="1"
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
              {loading ? "Salvando..." : vehicle ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

