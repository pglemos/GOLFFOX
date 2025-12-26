"use client"

import { useState, useEffect } from "react"

import dynamic from "next/dynamic"

import { motion } from "framer-motion"
import { Truck, Upload, X, Calendar, Wrench, ClipboardCheck, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSupabaseSync } from "@/hooks/use-supabase-sync"
import { auditLogs } from "@/lib/audit-log"
import { formatError } from "@/lib/error-utils"
import { debug, logError, warn } from "@/lib/logger"
import { t } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { warn, logError } from "@/lib/logger"
import type { Database } from "@/types/supabase"

type UserRow = Database['public']['Tables']['users']['Row']
type VeiculosInsert = Database['public']['Tables']['veiculos']['Insert']
type VeiculosUpdate = Database['public']['Tables']['veiculos']['Update']

// Lazy load seção de documentos
const VeiculoDocumentsSection = dynamic(() => import("@/components/veiculo/veiculo-documents-section"), { ssr: false })

interface veiculo {
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

interface VeiculoModalProps {
  veiculo: veiculo | null
  isOpen: boolean
  onClose: () => void

  onSave: () => void
  carriers?: { id: string, name: string }[]
}

export function VeiculoModal({ veiculo, isOpen, onClose, onSave, carriers }: VeiculoModalProps) {
  const [formData, setFormData] = useState<veiculo>({
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
  const [userInfo, setUserInfo] = useState<{ role?: string, company_id?: string, transportadora_id?: string }>({})
  const { sync } = useSupabaseSync({ showToast: false }) // Toast já é mostrado no modal

  // Carregar informações do usuário para determinar company_id/transportadora_id
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('role, empresa_id, transportadora_id')
            .eq('id', session.user.id)
            .maybeSingle()

          if (!error && userData) {
            const user = userData as UserRow
            setUserInfo({
              role: user.role,
              company_id: user.empresa_id || undefined,
              transportadora_id: user.transportadora_id || undefined
            })
          }
        }
      } catch (error) {
        logError('Erro ao carregar informações do usuário', { error }, 'VeiculoModal')
      }
    }

    if (isOpen) {
      loadUserInfo()
    }
  }, [isOpen])

  useEffect(() => {
    if (veiculo) {
      setFormData(veiculo)
      setPhotoPreview(veiculo.photo_url || "")
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
  }, [veiculo, isOpen])

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
      const form = new FormData()
      form.append('file', photoFile)
      form.append('bucket', 'fotos-veiculo')
      form.append('folder', 'veiculos')
      form.append('entityId', vehicleId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: form
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao fazer upload')
      }

      const result = await response.json()
      return result.url
    } catch (error: unknown) {
      const err = error as { message?: string }
      logError("Erro ao fazer upload", { error: err }, 'VeiculoModal')
      notifyError(formatError(err, "Erro ao fazer upload da foto"))
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let vehicleId = veiculo?.id

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
        } catch (uploadError: unknown) {
          warn('Erro no upload da foto (continuando sem foto)', { error: uploadError }, 'VeiculoModal')
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

      const vehicleDataRaw: Partial<VeiculosInsert> = {
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
      // Para operador: deve usar o company_id do usuário
      // Para transportadora: deve usar o transportadora_id do usuário
      if (userInfo.role === 'admin') {
        // Admin pode definir company_id manualmente se fornecido no formData
        if (formData.company_id) {
          vehicleDataRaw.company_id = formData.company_id
        }
        if (formData.transportadora_id) {
          vehicleDataRaw.transportadora_id = formData.transportadora_id
        }
      } else if (userInfo.role === 'gestor_transportadora' || userInfo.role === 'operador') {
        // operador deve usar seu próprio company_id
        if (userInfo.company_id) {
          vehicleDataRaw.company_id = userInfo.company_id
        } else if (formData.company_id) {
          vehicleDataRaw.company_id = formData.company_id
        }
      } else if (userInfo.role === 'gestor_transportadora' || userInfo.role === 'transportadora') {
        // Transportadora deve usar seu próprio transportadora_id
        if (userInfo.transportadora_id) {
          vehicleDataRaw.transportadora_id = userInfo.transportadora_id
        }
      }

      // Se for update, manter company_id/transportadora_id existente se não foi alterado
      if (vehicleId && veiculo) {
        if (!vehicleDataRaw.company_id && veiculo.company_id) {
          vehicleDataRaw.company_id = veiculo.company_id
        }
        if (!vehicleDataRaw.transportadora_id && veiculo.transportadora_id) {
          vehicleDataRaw.transportadora_id = veiculo.transportadora_id
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
      const finalVehicleData: Partial<VeiculosUpdate> = {}
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

      debug('Dados a serem salvos', { data: finalVehicleData, fieldCount: Object.keys(finalVehicleData).length }, 'VeiculoModal')

      if (vehicleId) {
        // ATUALIZAR via API service role (evita RLS)
        if (!vehicleId || vehicleId.trim() === '') {
          throw new Error('ID do veículo inválido')
        }

        debug('Atualizando veículo via API', { vehicleId, payload: finalVehicleData }, 'VeiculoModal')

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)
        let resp: Response
        try {
          resp = await fetch(`/api/admin/veiculos/${vehicleId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalVehicleData),
            signal: controller.signal,
          })
        } catch (err: unknown) {
          const error = err as { name?: string; message?: string }
          clearTimeout(timeout)
          const msg = error?.name === 'AbortError' ? 'Timeout na atualização (30s)' : (error?.message || 'Falha de rede')
          throw new Error(`Erro de conexão: ${msg}`)
        }
        clearTimeout(timeout)

        if (!resp.ok) {
          let errBody: { message?: string } | null = null
          try { errBody = await resp.json() } catch { }
          const message = errBody?.message || 'Erro ao atualizar veículo'
          throw new Error(message)
        }

        const data = await resp.json()
        debug('Veículo atualizado com sucesso', { data }, 'VeiculoModal')
        notifySuccess(t('common', 'success.vehicleUpdated'))

        // Log de auditoria (não bloquear em caso de erro)
        try {
          await Promise.race([
            auditLogs.update('veiculo', vehicleId, {
              plate: finalVehicleData.plate,
              model: finalVehicleData.model
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ])
        } catch (auditError) {
          warn('Erro ao registrar log de auditoria (não crítico)', { error: auditError }, 'VeiculoModal')
        }
      } else {
        // CRIAR via API service role (evita RLS)
        debug('Criando novo veículo via API', {}, 'VeiculoModal')
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)
        let resp: Response
        try {
          resp = await fetch('/api/admin/veiculos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalVehicleData),
            signal: controller.signal,
          })
        } catch (err: unknown) {
          const error = err as { name?: string; message?: string }
          clearTimeout(timeout)
          const msg = error?.name === 'AbortError' ? 'Timeout na criação (30s)' : (error?.message || 'Falha de rede')
          throw new Error(`Erro de conexão: ${msg}`)
        }
        clearTimeout(timeout)

        if (!resp.ok) {
          let errBody: { message?: string } | null = null
          try { errBody = await resp.json() } catch { }
          const message = errBody?.message || 'Erro ao cadastrar veículo'
          throw new Error(message)
        }

        const data = await resp.json()
        if (!data?.id) {
          throw new Error('Veículo criado mas ID não retornado')
        }
        vehicleId = data.id
        debug('Veículo criado com sucesso', { data }, 'VeiculoModal')

        // Upload da foto APÓS criar (se houver foto pendente)
        if (photoFile && vehicleId) {
          const uploadedUrl = await uploadPhoto(vehicleId)
          if (uploadedUrl) {
            try {
              const respPhoto = await fetch(`/api/admin/veiculos/${vehicleId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo_url: uploadedUrl }),
              })
              if (!respPhoto.ok) {
                warn('Erro ao atualizar foto após criar veículo (não crítico)', { status: respPhoto.status }, 'VeiculoModal')
              }
            } catch (e) {
              warn('Erro de rede ao atualizar foto (não crítico)', { error: e }, 'VeiculoModal')
            }
          }
        }

        notifySuccess(t('common', 'success.vehicleCreated'))

        // Log de auditoria (não bloquear em caso de erro)
        try {
          if (vehicleId) {
            await auditLogs.create('veiculo', vehicleId, {
              plate: finalVehicleData.plate || '',
              model: finalVehicleData.model || ''
            })
          }
        } catch (auditError) {
          warn('Erro ao registrar log de auditoria (não crítico)', { error: auditError }, 'VeiculoModal')
        }
      }

      // Aguardar um pouco antes de fechar para garantir que tudo foi salvo
      await new Promise(resolve => setTimeout(resolve, 100))

      onSave()
      onClose()
    } catch (error: unknown) {
      const err = error as { message?: string; toString?: () => string }
      logError("Erro ao salvar veículo", { error: err }, 'VeiculoModal')

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
      logError("Detalhes completos do erro", {
        error,
        message: errorMessage,
        stack: error?.stack,
        name: error?.name
      }, 'VeiculoModal')

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
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] p-0 mx-auto !flex !flex-col overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <Truck className="h-5 w-5 flex-shrink-0" />
            {veiculo ? "Editar Veículo" : "Cadastrar Veículo"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Tabs defaultValue="dados" className="w-full flex flex-col flex-1 min-h-0 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0 mb-4 px-4 sm:px-6">
              <TabsTrigger value="dados" className="text-xs sm:text-sm">
                <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Dados
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Documentos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="!mt-0 !rounded-none bg-transparent border-0 p-0 shadow-none flex-1 min-h-0 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10 pb-4 px-4 sm:px-6">
              {/* Foto do Veículo */}
              <div className="space-y-2">
                <Label>Foto do Veículo</Label>
                <div className="flex items-center gap-4">
                  {photoPreview && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
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
                        className="absolute top-1 right-1 bg-error-light0 text-white rounded-full p-1 hover:bg-error"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div>
                    <div>
                      <input
                        id="veiculo-photo-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] touch-manipulation"
                        onClick={() => document.getElementById('veiculo-photo-input')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {photoPreview ? "Trocar Foto" : "Upload Foto"}
                      </Button>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      Máximo 5MB (JPG, PNG)
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid de Campos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                {/* Campo Transportadora (apenas se lista de carriers for fornecida) */}
                {carriers && carriers.length > 0 && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="transportadora">Transportadora</Label>
                    <Select
                      value={formData.transportadora_id || ""}
                      onValueChange={(value) => setFormData({ ...formData, transportadora_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a transportadora" />
                      </SelectTrigger>
                      <SelectContent>
                        {carriers.map((transportadora) => (
                          <SelectItem key={transportadora.id} value={transportadora.id}>
                            {transportadora.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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

                <div className="space-y-3">
                  <Label htmlFor="status" className="text-base font-medium">Status</Label>
                  <Select
                    value={formData.is_active ? "active" : "inactive"}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-4 pt-6 sm:pt-8 border-t border-white/20 mt-8 sm:mt-10 pb-2 px-4 sm:px-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto order-2 sm:order-1 min-h-[52px] px-6 py-3 text-base font-medium touch-manipulation"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto order-1 sm:order-2 bg-brand hover:bg-brand-hover min-h-[52px] px-6 py-3 text-base font-medium touch-manipulation"
                >
                  {loading ? "Salvando..." : veiculo ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="documentos" className="!mt-0 !rounded-none bg-transparent border-0 p-0 shadow-none flex-1 min-h-0 overflow-y-auto">
            <div className="pb-4 px-4 sm:px-6">
              <VeiculoDocumentsSection
                veiculoId={veiculo?.id ?? formData.id}
                isEditing={!!veiculo?.id || !!formData.id}
              />
            </div>
          </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

