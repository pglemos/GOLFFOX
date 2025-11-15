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
import { Briefcase, Loader2 } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"
import { globalSyncManager } from "@/lib/global-sync"

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
          address_number: formData.addressNumber.trim() || null,
          address_complement: formData.addressComplement.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          zip_code: formData.zipCode.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          is_active: formData.is_active,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Editar Empresa
          </DialogTitle>
          <DialogDescription>
            Atualize os dados da empresa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da empresa"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                disabled={loading}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@empresa.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, Avenida, etc."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressNumber">Número</Label>
              <Input
                id="addressNumber"
                value={formData.addressNumber}
                onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                placeholder="123"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressComplement">Complemento</Label>
              <Input
                id="addressComplement"
                value={formData.addressComplement}
                onChange={(e) => setFormData({ ...formData, addressComplement: e.target.value })}
                placeholder="Sala, Andar, etc."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Cidade"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="UF"
                maxLength={2}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="00000-000"
                disabled={loading}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  disabled={loading}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Empresa ativa
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

