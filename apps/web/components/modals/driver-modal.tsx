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
import { Users, Upload, X, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { t } from "@/lib/i18n"
import { formatError } from "@/lib/error-utils"
import { auditLogs } from "@/lib/audit-log"
import { useSupabaseSync } from "@/hooks/use-supabase-sync"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"

// Lazy load seções pesadas
const DriverCompensationSection = dynamic(() => import("@/components/driver/driver-compensation-section"), { ssr: false })
const DriverDocumentsSection = dynamic(() => import("@/components/driver/driver-documents-section"), { ssr: false })

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

      if (docs) setDocuments(docs as any)


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
        const { error } = await (supabase as any)
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
        const resp = await fetch('/api/operador/create-employee', {
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
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <Users className="h-5 w-5 flex-shrink-0" />
            {driver ? "Editar Motorista" : "Cadastrar Motorista"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-2">
            <TabsTrigger value="dados" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">Dados</TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">Documentos</TabsTrigger>
            <TabsTrigger value="salario" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">
              <DollarSign className="h-3 w-3 mr-1" />Salário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="min-h-[44px] touch-manipulation"
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

              <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto order-2 sm:order-1 min-h-[44px] text-base font-medium touch-manipulation"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto order-1 sm:order-2 bg-orange-500 hover:bg-orange-600 min-h-[44px] text-base font-medium touch-manipulation"
                >
                  {loading ? "Salvando..." : driver ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="documentos">
            <DriverDocumentsSection
              driverId={driver?.id ?? formData.id}
              isEditing={!!driver?.id || !!formData.id}
            />
          </TabsContent>

          <TabsContent value="salario">
            <DriverCompensationSection
              driverId={driver?.id ?? formData.id}
              isEditing={!!driver?.id || !!formData.id}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

