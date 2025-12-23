"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Briefcase, Loader2, FileText } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"
import { globalSyncManager } from "@/lib/global-sync"
import { AddressForm, AddressData } from "@/components/address-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"

// Lazy load seção de documentos
const CompanyDocumentsSection = dynamic(() => import("@/components/company/company-documents-section"), { ssr: false })

interface Company {
  id: string
  name: string
  cnpj?: string | null
  address?: string | null
  address_number?: string | null
  address_complement?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  phone?: string | null
  email?: string | null
  is_active?: boolean
}

interface EditCompanyModalProps {
  company: Company | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EditCompanyModal({
  company,
  isOpen,
  onClose,
  onSave,
}: EditCompanyModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    address: "",
    addressNumber: "",
    addressComplement: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    is_active: true,
    addressData: {
      cep: "",
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      city: "",
      state: ""
    } as AddressData
  })

  useEffect(() => {
    if (company && isOpen) {
      console.log('Carregando dados da empresa no modal:', company)
      setFormData({
        name: company.name || "",
        cnpj: company.cnpj || "",
        address: company.address || "",
        addressNumber: company.address_number || "",
        addressComplement: company.address_complement || "",
        city: company.city || "",
        state: company.state || "",
        zipCode: company.zip_code || "",
        phone: company.phone || "",
        email: company.email || "",
        is_active: company.is_active ?? true,
        addressData: {
          cep: company.zip_code || "",
          street: company.address || "",
          number: company.address_number || "",
          neighborhood: "",
          complement: company.address_complement || "",
          city: company.city || "",
          state: company.state || ""
        }
      })
    } else if (!isOpen) {
      // Resetar formulário quando modal fecha
      setFormData({
        name: "",
        cnpj: "",
        address: "",
        addressNumber: "",
        addressComplement: "",
        city: "",
        state: "",
        zipCode: "",
        phone: "",
        email: "",
        is_active: true,
        addressData: {
          cep: "",
          street: "",
          number: "",
          neighborhood: "",
          complement: "",
          city: "",
          state: ""
        }
      })
    }
  }, [company, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          cnpj: formData.cnpj.trim() || null,
          address: formData.address.trim() || null,
          address_number: formData.addressData.number.trim() || null,
          address_complement: formData.addressData.complement.trim() || null,
          city: formData.addressData.city.trim() || null,
          state: formData.addressData.state.trim() || null,
          zip_code: formData.addressData.cep.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          is_active: formData.is_active,
          address_zip_code: formData.addressData.cep.trim() || null,
          address_street: formData.addressData.street.trim() || null,
          address_neighborhood: formData.addressData.neighborhood.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(errorData.error || errorData.message || "Erro ao atualizar empresa")
      }

      const result = await response.json()
      notifySuccess("Empresa atualizada com sucesso!")

      // Notificar sincronização global
      if (result.company) {
        globalSyncManager.triggerSync("company.updated", result.company)
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao atualizar empresa:", error)
      notifyError(error, error.message || "Erro ao atualizar empresa")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-4xl max-h-[90vh] p-0 mx-auto !flex !flex-col overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <Briefcase className="h-5 w-5 flex-shrink-0" />
            Editar Empresa
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base break-words">
            Atualize os dados da empresa
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Tabs defaultValue="dados" className="w-full flex flex-col flex-1 min-h-0 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0 mb-4 px-4 sm:px-6">
              <TabsTrigger value="dados" className="text-xs sm:text-sm">
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Dados
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Documentos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="!mt-0 !rounded-none bg-transparent border-0 p-0 shadow-none flex-1 min-h-0 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10 pb-4 px-4 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3 sm:col-span-2">
                  <Label htmlFor="name" className="text-base font-medium">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome da empresa"
                    required
                    disabled={loading}
                    className="min-h-[48px] px-4 py-3"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="cnpj" className="text-base font-medium">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    disabled={loading}
                    className="min-h-[48px] px-4 py-3"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-base font-medium">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    disabled={loading}
                    className="min-h-[48px] px-4 py-3"
                  />
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <Label htmlFor="email" className="text-base font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@empresa.com"
                    disabled={loading}
                    className="min-h-[48px] px-4 py-3"
                  />
                </div>

                <AddressForm
                  value={formData.addressData}
                  onChange={(addressData) => {
                    setFormData(prev => ({
                      ...prev,
                      addressData,
                      // Construir endereço completo para compatibilidade
                      address: addressData.street || prev.address
                    }))
                  }}
                  required={false}
                  disabled={loading}
                  showTitle={true}
                />

                <div className="space-y-3 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      disabled={loading}
                      className="rounded w-5 h-5 cursor-pointer"
                    />
                    <Label htmlFor="is_active" className="cursor-pointer text-base font-medium">
                      Empresa ativa
                    </Label>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-4 pt-6 sm:pt-8 border-t border-white/20 mt-8 sm:mt-10 pb-2 px-4 sm:px-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full sm:w-auto order-2 sm:order-1 min-h-[52px] px-6 py-3 text-base font-medium touch-manipulation"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto order-1 sm:order-2 bg-brand hover:bg-brand-hover min-h-[52px] px-6 py-3 text-base font-medium touch-manipulation"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="documentos" className="!mt-0 !rounded-none bg-transparent border-0 p-0 shadow-none flex-1 min-h-0 overflow-y-auto">
            <div className="pb-4 px-4 sm:px-6">
              <CompanyDocumentsSection
                companyId={company?.id}
                isEditing={!!company?.id}
              />
            </div>
          </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

