"use client"

import { useState, useEffect } from "react"

import dynamic from "next/dynamic"

import { Users, Upload, X, DollarSign, Building2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { t } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"


// Lazy load seções pesadas
const MotoristaCompensationSection = dynamic(() => import("@/components/motorista/motorista-compensation-section"), { ssr: false })
const MotoristaDocumentsSection = dynamic(() => import("@/components/motorista/motorista-documents-section"), { ssr: false })

interface motorista {
  id?: string
  name: string
  email: string
  phone?: string
  cpf?: string
  rg?: string
  cnh?: string
  cnh_category?: string
  role: string
  transportadora_id?: string
  // Endereço
  address_zip_code?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
}

interface MotoristaDocument {
  id?: string
  document_type: 'cnh' | 'certificado_transporte' | 'toxico' | 'residencia' | 'selfie' | 'outros'
  document_number?: string
  expiry_date?: string
  file_url?: string
  file_name?: string
  is_valid?: boolean
}

interface transportadora {
  id: string
  name: string
}

interface MotoristaModalProps {
  motorista: motorista | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  carriers?: transportadora[]
}

export function MotoristaModal({ motorista, isOpen, onClose, onSave, carriers = [] }: MotoristaModalProps) {
  const [formData, setFormData] = useState<motorista>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    role: "motorista"
  })
  const [documents, setDocuments] = useState<MotoristaDocument[]>([])
  const [loading, setLoading] = useState(false)
  const { sync } = useSupabaseSync({ showToast: false })

  useEffect(() => {
    if (motorista) {
      setFormData({
        ...motorista,
        address_zip_code: motorista.address_zip_code || '',
        address_street: motorista.address_street || '',
        address_number: motorista.address_number || '',
        address_complement: motorista.address_complement || '',
        address_neighborhood: motorista.address_neighborhood || '',
        address_city: motorista.address_city || '',
        address_state: motorista.address_state || '',
      })
      loadMotoristaData(motorista.id!)
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        rg: "",
        cnh: "",
        cnh_category: "",
        role: "motorista",
        address_zip_code: "",
        address_street: "",
        address_number: "",
        address_complement: "",
        address_neighborhood: "",
        address_city: "",
        address_state: "",
      })
      setDocuments([])
    }
  }, [motorista, isOpen])

  const loadMotoristaData = async (motoristaId: string) => {
    try {
      // Carregar documentos do motorista
      const { data: docs } = await supabase
        .from("gf_driver_documents")
        .select("*")
        .eq("driver_id", motoristaId)
        .order("created_at", { ascending: false })

      if (docs) setDocuments(docs as any)


    } catch (error) {
      console.error("Erro ao carregar dados do motorista:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const motoristaData = {
        ...formData,
        role: "motorista"
      }

      if (motorista?.id) {
        const response = await fetch(`/api/admin/motoristas/${motorista.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...motoristaData,
            address_zip_code: formData.address_zip_code,
            address_street: formData.address_street,
            address_number: formData.address_number,
            address_neighborhood: formData.address_neighborhood,
            address_complement: formData.address_complement,
            address_city: formData.address_city,
            address_state: formData.address_state,
          })
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || result.message || 'Erro ao atualizar motorista')
        }

        // Sincronização com Supabase (garantia adicional para real-time no frontend)
        await sync({
          resourceType: 'motorista',
          resourceId: motorista.id,
          action: 'update',
          data: motoristaData,
        })

        notifySuccess('', { i18n: { ns: 'common', key: 'success.driverUpdated' } })

        // Log de auditoria
        await auditLogs.update('motorista', motorista.id, { name: motoristaData.name, email: motoristaData.email })
      } else {
        // Criar motorista via API com Service Role (respeita RLS e políticas)
        const resp = await fetch('/api/admin/motoristas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: motoristaData.name,
            email: motoristaData.email,
            phone: motoristaData.phone,
            transportadora_id: formData.transportadora_id,
            cpf: formData.cpf,
            cnh: formData.cnh,
            cnh_category: formData.cnh_category,
            is_active: true,
            address_zip_code: formData.address_zip_code,
            address_street: formData.address_street,
            address_number: formData.address_number,
            address_complement: formData.address_complement,
            address_neighborhood: formData.address_neighborhood,
            address_city: formData.address_city,
            address_state: formData.address_state,
          })
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const msg = body?.error || body?.message || 'Erro ao criar motorista'
          throw new Error(msg)
        }

        const newMotoristaId = body.motorista?.id || body.userId
        if (!newMotoristaId) {
          throw new Error('Falha ao obter ID do motorista criado')
        }

        // Sincronização informativa
        await sync({
          resourceType: 'motorista',
          resourceId: newMotoristaId,
          action: 'create',
          data: motoristaData,
        })

        notifySuccess('', { i18n: { ns: 'common', key: 'success.driverCreated' } })
        await auditLogs.create('motorista', newMotoristaId, { name: motoristaData.name, email: motoristaData.email })
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao salvar motorista:", error)
      notifyError(error, t('common', 'errors.saveDriver'))
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUpload = async (type: MotoristaDocument['document_type'], file: File) => {
    if (!motorista?.id) {
      notifyError('', undefined, { i18n: { ns: 'common', key: 'validation.saveDriverFirst' } })
      return
    }

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('bucket', 'documentos-motorista')
      form.append('folder', 'documentos-motorista')
      form.append('entityId', motorista.id)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: form
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao fazer upload')
      }

      const result = await response.json()
      const publicUrl = result.url

      const { error: docError } = await (supabase as any)
        .from("gf_driver_documents")
        .insert({
          driver_id: motorista.id,
          document_type: type,
          file_url: publicUrl,
          file_name: file.name
        })

      if (docError) throw docError

      notifySuccess('', { i18n: { ns: 'common', key: 'success.documentUploaded' } })
      loadMotoristaData(motorista.id)
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error)
      notifyError(error, t('common', 'errors.documentUpload'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-4xl max-h-[90vh] p-0 mx-auto !flex !flex-col overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <Users className="h-5 w-5 flex-shrink-0" />
            {motorista ? "Editar Motorista" : "Cadastrar Motorista"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Tabs defaultValue="dados" className="w-full flex flex-col flex-1 min-h-0 overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 gap-2 flex-shrink-0 mb-4 px-4 sm:px-6">
              <TabsTrigger value="dados" className="text-xs sm:text-sm">Dados</TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs sm:text-sm">Documentos</TabsTrigger>
              <TabsTrigger value="salario" className="text-xs sm:text-sm">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Salário
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="!mt-0 !rounded-none bg-transparent border-0 p-0 shadow-none flex-1 min-h-0 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10 pb-4 px-4 sm:px-6">
                {/* Dados Pessoais */}
                <div className="space-y-6">
                  <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-base font-medium">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="min-h-[48px] px-4 py-3 touch-manipulation"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-base font-medium">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="min-h-[48px] px-4 py-3"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-base font-medium">Telefone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="min-h-[48px] px-4 py-3"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="rg" className="text-base font-medium">RG</Label>
                      <Input
                        id="rg"
                        value={formData.rg || ""}
                        onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                        placeholder="00.000.000-0"
                        className="min-h-[48px] px-4 py-3"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="cpf" className="text-base font-medium">CPF (Login) *</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf || ""}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                        required
                        className="min-h-[48px] px-4 py-3"
                      />
                      <p className="text-xs text-muted-foreground mt-2">Senha de acesso: últimos 6 dígitos do CPF</p>
                    </div>

                    {/* Campo Transportadora (apenas se lista de carriers for fornecida) */}
                    {carriers && carriers.length > 0 && (
                      <div className="space-y-3 sm:col-span-2">
                        <Label htmlFor="transportadora" className="flex items-center gap-2 text-base font-medium">
                          <Building2 className="h-4 w-4" />
                          Transportadora
                        </Label>
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
                  </div>
                </div>

                {/* CNH */}
                <div className="space-y-6">
                  <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-2">CNH</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="cnh" className="text-base font-medium">Número da CNH *</Label>
                      <Input
                        id="cnh"
                        value={formData.cnh || ""}
                        onChange={(e) => setFormData({ ...formData, cnh: e.target.value })}
                        placeholder="00000000000"
                        className="min-h-[48px] px-4 py-3"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="cnh_category" className="text-base font-medium">Categoria da CNH *</Label>
                      <select
                        id="cnh_category"
                        value={formData.cnh_category || ""}
                        onChange={(e) => setFormData({ ...formData, cnh_category: e.target.value })}
                        className="min-h-[48px] w-full rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Selecione...</option>
                        <option value="A">A - Moto</option>
                        <option value="B">B - Carro</option>
                        <option value="AB">AB - Moto e Carro</option>
                        <option value="C">C - Caminhão</option>
                        <option value="D">D - Ônibus</option>
                        <option value="E">E - Carreta</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-6">
                  <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-2">Endereço</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="address_zip_code" className="text-base font-medium">CEP</Label>
                      <Input
                        id="address_zip_code"
                        value={formData.address_zip_code || ""}
                        onChange={(e) => setFormData({ ...formData, address_zip_code: e.target.value })}
                        placeholder="00000-000"
                        className="min-h-[48px] px-4 py-3"
                      />
                    </div>

                    <div className="space-y-3 sm:col-span-2">
                      <Label htmlFor="address_street" className="text-base font-medium">Rua</Label>
                      <Input
                        id="address_street"
                        value={formData.address_street || ""}
                        onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                        placeholder="Nome da rua"
                        className="min-h-[48px] px-4 py-3"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="address_number" className="text-base font-medium">Número</Label>
                      <Input
                        id="address_number"
                        value={formData.address_number || ""}
                        onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                        placeholder="123"
                        className="min-h-[48px] px-4 py-3"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="address_complement" className="text-base font-medium">Complemento</Label>
                      <Input
                        id="address_complement"
                        value={formData.address_complement || ""}
                        onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                        placeholder="Apto, Bloco..."
                        className="min-h-[48px] px-4 py-3"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="address_neighborhood" className="text-base font-medium">Bairro</Label>
                      <Input
                        id="address_neighborhood"
                        value={formData.address_neighborhood || ""}
                        onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                        placeholder="Nome do bairro"
                        className="min-h-[48px] px-4 py-3"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="address_city" className="text-base font-medium">Cidade</Label>
                      <Input
                        id="address_city"
                        value={formData.address_city || ""}
                        onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                        placeholder="Cidade"
                        className="min-h-[48px] px-4 py-3"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="address_state" className="text-base font-medium">Estado</Label>
                      <select
                        id="address_state"
                        value={formData.address_state || ""}
                        onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
                        className="min-h-[48px] w-full rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">UF</option>
                        <option value="AC">AC</option>
                        <option value="AL">AL</option>
                        <option value="AP">AP</option>
                        <option value="AM">AM</option>
                        <option value="BA">BA</option>
                        <option value="CE">CE</option>
                        <option value="DF">DF</option>
                        <option value="ES">ES</option>
                        <option value="GO">GO</option>
                        <option value="MA">MA</option>
                        <option value="MT">MT</option>
                        <option value="MS">MS</option>
                        <option value="MG">MG</option>
                        <option value="PA">PA</option>
                        <option value="PB">PB</option>
                        <option value="PR">PR</option>
                        <option value="PE">PE</option>
                        <option value="PI">PI</option>
                        <option value="RJ">RJ</option>
                        <option value="RN">RN</option>
                        <option value="RS">RS</option>
                        <option value="RO">RO</option>
                        <option value="RR">RR</option>
                        <option value="SC">SC</option>
                        <option value="SP">SP</option>
                        <option value="SE">SE</option>
                        <option value="TO">TO</option>
                      </select>
                    </div>
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
                    {loading ? "Salvando..." : motorista ? "Atualizar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="documentos" className="!mt-0 !rounded-none bg-transparent border-0 p-0 shadow-none flex-1 min-h-0 overflow-y-auto">
              <div className="pb-4 px-4 sm:px-6">
                <MotoristaDocumentsSection
                  motoristaId={motorista?.id ?? formData.id}
                  isEditing={!!motorista?.id || !!formData.id}
                />
              </div>
            </TabsContent>

            <TabsContent value="salario" className="!mt-0 !rounded-none bg-transparent border-0 p-0 shadow-none flex-1 min-h-0 overflow-y-auto">
              <div className="pb-4 px-4 sm:px-6">
                <MotoristaCompensationSection
                  motoristaId={motorista?.id ?? formData.id}
                  isEditing={!!motorista?.id || !!formData.id}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

