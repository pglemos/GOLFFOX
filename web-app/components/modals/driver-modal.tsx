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
import { Users, Upload, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { t } from "@/lib/i18n"
import { formatError } from "@/lib/error-utils"
import { auditLogs } from "@/lib/audit-log"
import { useSupabaseSync } from "@/hooks/use-supabase-sync"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface Driver {
  id?: string
  name: string
  email: string
  phone?: string
  cpf?: string
  role: string
}

interface DriverDocument {
  id?: string
  document_type: 'cnh' | 'certificado_transporte' | 'toxico' | 'residencia' | 'selfie' | 'outros'
  document_number?: string
  expiry_date?: string
  file_url?: string
  file_name?: string
  is_valid?: boolean
}

interface DriverModalProps {
  driver: Driver | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function DriverModal({ driver, isOpen, onClose, onSave }: DriverModalProps) {
  const [formData, setFormData] = useState<Driver>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    role: "driver"
  })
  const [documents, setDocuments] = useState<DriverDocument[]>([])
  const [loading, setLoading] = useState(false)
  const { sync } = useSupabaseSync({ showToast: false })

  useEffect(() => {
    if (driver) {
      setFormData(driver)
      loadDriverData(driver.id!)
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        role: "driver"
      })
      setDocuments([])
    }
  }, [driver, isOpen])

  const loadDriverData = async (driverId: string) => {
    try {
      // Carregar documentos
      const { data: docs } = await supabase
        .from("gf_driver_documents")
        .select("*")
        .eq("driver_id", driverId)
        .order("created_at", { ascending: false })
      
      if (docs) setDocuments(docs)

      
    } catch (error) {
      console.error("Erro ao carregar dados do motorista:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const driverData = {
        ...formData,
        role: "driver"
      }

      if (driver?.id) {
        const { error } = await supabase
          .from("users")
          .update(driverData)
          .eq("id", driver.id)

        if (error) throw error
        
        // Sincronização com Supabase (garantia adicional)
        await sync({
          resourceType: 'driver',
          resourceId: driver.id,
          action: 'update',
          data: driverData,
        })
        
        notifySuccess('', { i18n: { ns: 'common', key: 'success.driverUpdated' } })
        
        // Log de auditoria
        await auditLogs.update('driver', driver.id, { name: driverData.name, email: driverData.email })
      } else {
        // Criar motorista via API com Service Role (respeita RLS e políticas)
        const resp = await fetch('/api/operator/create-employee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: driverData.email,
            name: driverData.name,
            phone: driverData.phone,
            role: 'driver',
          })
        })

        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          const msg = body?.error || body?.message || 'Erro ao criar motorista'
          throw new Error(msg)
        }

        const newDriverId = body.userId
        if (!newDriverId) {
          throw new Error('Falha ao obter ID do motorista criado')
        }

        // Sincronização informativa
        await sync({
          resourceType: 'driver',
          resourceId: newDriverId,
          action: 'create',
          data: driverData,
        })

        notifySuccess('', { i18n: { ns: 'common', key: 'success.driverCreated' } })
        await auditLogs.create('driver', newDriverId, { name: driverData.name, email: driverData.email })
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

  const handleDocumentUpload = async (type: DriverDocument['document_type'], file: File) => {
    if (!driver?.id) {
      notifyError('', undefined, { i18n: { ns: 'common', key: 'validation.saveDriverFirst' } })
      return
    }

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${driver.id}-${type}-${Date.now()}.${fileExt}`
      const filePath = `driver-documents/${fileName}`

      const { error: uploadError } = await (supabase as any).storage
        .from('driver-documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = (supabase as any).storage
        .from('driver-documents')
        .getPublicUrl(filePath)

      const { error: docError } = await (supabase as any)
        .from("gf_driver_documents")
        .insert({
          driver_id: driver.id,
          document_type: type,
          file_url: data.publicUrl,
          file_name: file.name
        })

      if (docError) throw docError

      notifySuccess('', { i18n: { ns: 'common', key: 'success.documentUploaded' } })
      loadDriverData(driver.id)
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error)
      notifyError(error, t('common', 'errors.documentUpload'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {driver ? "Editar Motorista" : "Cadastrar Motorista"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf || ""}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : driver ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="documentos">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: 'cnh' as const, label: 'CNH', required: true },
                  { type: 'certificado_transporte' as const, label: 'Certificado de Transporte', required: true },
                  { type: 'toxico' as const, label: 'Toxicológico', required: true },
                  { type: 'residencia' as const, label: 'Comprovante de Residência', required: false },
                  { type: 'selfie' as const, label: 'Selfie', required: false },
                ].map(({ type, label, required }) => {
                  const existingDoc = documents.find(d => d.document_type === type)
                  return (
                    <div key={type} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>
                          {label} {required && <span className="text-red-500">*</span>}
                        </Label>
                        {existingDoc && (
                          <Badge variant={existingDoc.is_valid ? "default" : "destructive"}>
                            {existingDoc.is_valid ? "Válido" : "Inválido"}
                          </Badge>
                        )}
                      </div>
                      {existingDoc ? (
                        <div className="space-y-2">
                          <p className="text-sm text-[var(--ink-muted)]">
                            {existingDoc.file_name || "Documento anexado"}
                          </p>
                          {existingDoc.expiry_date && (
                            <p className="text-xs text-[var(--ink-muted)]">
                              Vencimento: {new Date(existingDoc.expiry_date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {existingDoc.file_url && (
                            <a 
                              href={existingDoc.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-[var(--brand)] hover:underline"
                            >
                              Ver documento
                            </a>
                          )}
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file && driver?.id) {
                                handleDocumentUpload(type, file)
                              }
                            }}
                            className="hidden"
                            disabled={!driver?.id}
                          />
                          <Button type="button" variant="outline" size="sm" className="w-full" disabled={!driver?.id}>
                            <Upload className="h-4 w-4 mr-2" />
                            {driver?.id ? "Enviar" : "Salve o motorista primeiro"}
                          </Button>
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

