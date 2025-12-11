"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { error as logError } from "@/lib/logger"
import { useState, useEffect } from "react"
import { AddressForm, AddressData } from "@/components/address-form"

interface FuncionarioModalProps {
  funcionario: any | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  empresaId: string
}

export function FuncionarioModal({ funcionario, isOpen, onClose, onSave, empresaId }: FuncionarioModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    cost_center_id: null as string | null,
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
    if (funcionario && isOpen) {
      // Se funcionario tem dados diretos (não nested)
      setFormData({
        name: funcionario.name || funcionario.employee?.name || "",
        email: funcionario.email || funcionario.employee?.email || "",
        phone: funcionario.phone || funcionario.employee?.phone || "",
        cpf: funcionario.cpf || "",
        address: funcionario.address || "",
        latitude: funcionario.latitude || null,
        longitude: funcionario.longitude || null,
        cost_center_id: funcionario.cost_center_id || null,
        is_active: funcionario.is_active ?? true,
        addressData: {
          cep: funcionario.address_zip_code || "",
          street: funcionario.address_street || "",
          number: funcionario.address_number || "",
          neighborhood: funcionario.address_neighborhood || "",
          complement: funcionario.address_complement || "",
          city: funcionario.address_city || "",
          state: funcionario.address_state || ""
        }
      })
    } else if (!funcionario && isOpen) {
      // Reset para novo funcionário
      setFormData({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        address: "",
        latitude: null,
        longitude: null,
        cost_center_id: null,
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
  }, [funcionario, isOpen])

  const geocodeAddress = async (address: string) => {
    if (!address || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return null
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      )
      const data = await response.json()
      if (data.results && data.results[0]) {
        const loc = data.results[0].geometry.location
        return { lat: loc.lat, lng: loc.lng }
      }
    } catch (error) {
      logError("Erro ao geocodificar", { error }, 'FuncionarioModal')
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Geocodificar endereço se necessário
      let lat = formData.latitude
      let lng = formData.longitude
      if (formData.address && (!lat || !lng)) {
        const geocode = await geocodeAddress(formData.address)
        if (geocode) {
          lat = geocode.lat
          lng = geocode.lng
        }
      }

      if (funcionario?.id) {
        // Update
        const { error } = await (supabase as any)
          .from("gf_employee_company")
          .update({
            cpf: formData.cpf,
            address: formData.address,
            latitude: lat,
            longitude: lng,
            cost_center_id: formData.cost_center_id,
            is_active: formData.is_active,
            address_zip_code: formData.addressData.cep || null,
            address_street: formData.addressData.street || null,
            address_number: formData.addressData.number || null,
            address_neighborhood: formData.addressData.neighborhood || null,
            address_complement: formData.addressData.complement || null,
            address_city: formData.addressData.city || null,
            address_state: formData.addressData.state || null
          })
          .eq("id", funcionario.id)

        if (error) throw error

        // Update user if exists
        if (funcionario.employee_id) {
          await (supabase as any)
            .from("users")
            .update({
              name: formData.name,
              email: formData.email,
              phone: formData.phone
            })
            .eq("id", funcionario.employee_id)
        }

        notifySuccess("Funcionário atualizado com sucesso!", {
          i18n: { ns: 'operator', key: 'employees.updated' }
        })
      } else {
        // Create new employee user via API route (includes gf_employee_company insertion)
        const res = await fetch('/api/operador/create-employee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            phone: formData.phone,
            role: 'passenger',
            // Dados para gf_employee_company (inserção feita server-side para evitar RLS)
            company_id: empresaId,
            cpf: formData.cpf,
            address: formData.address,
            latitude: lat,
            longitude: lng,
            is_active: formData.is_active,
            address_zip_code: formData.addressData.cep || null,
            address_street: formData.addressData.street || null,
            address_number: formData.addressData.number || null,
            address_neighborhood: formData.addressData.neighborhood || null,
            address_complement: formData.addressData.complement || null,
            address_city: formData.addressData.city || null,
            address_state: formData.addressData.state || null
          })
        })

        const responseData = await res.json()

        if (!res.ok) {
          throw new Error(responseData.error || responseData.message || 'Erro ao criar funcionário')
        }

        if (!responseData.userId) {
          throw new Error('API não retornou userId')
        }

        notifySuccess("Funcionário cadastrado com sucesso!", {
          i18n: { ns: 'operator', key: 'employees.created' }
        })
      }

      onSave()
      onClose()
    } catch (error: any) {
      logError("Erro ao salvar funcionário", { error }, 'FuncionarioModal')
      notifyError(`Erro ao salvar funcionário: ${error?.message || 'Erro desconhecido'}`, undefined, {
        i18n: { ns: 'operator', key: 'employees.saveError' }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-5 sm:p-8">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold">{funcionario ? "Editar Funcionário" : "Adicionar Funcionário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 sm:gap-6 py-4">
          <div className="grid gap-2.5">
            <Label htmlFor="name" className="text-base font-medium">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Digite o nome completo"
              className="text-base h-11 sm:h-12 px-4 py-3"
            />
          </div>

          <div className="grid gap-2.5">
            <Label htmlFor="email" className="text-base font-medium">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              placeholder="exemplo@email.com"
              className="text-base h-11 sm:h-12 px-4 py-3"
            />
          </div>

          <div className="grid gap-2.5">
            <Label htmlFor="phone" className="text-base font-medium">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
              className="text-base h-11 sm:h-12 px-4 py-3"
            />
          </div>

          <div className="grid gap-2.5">
            <Label htmlFor="cpf" className="text-base font-medium">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
              placeholder="000.000.000-00"
              className="text-base h-11 sm:h-12 px-4 py-3"
            />
          </div>

          <AddressForm
            value={formData.addressData}
            onChange={(addressData) => {
              setFormData(prev => ({
                ...prev,
                addressData,
                // Construir endereço completo para compatibilidade
                address: [
                  addressData.street,
                  addressData.number ? `Nº ${addressData.number}` : '',
                  addressData.neighborhood,
                  addressData.city,
                  addressData.state,
                  addressData.cep
                ].filter(Boolean).join(', ')
              }))
            }}
            required={false}
            disabled={loading}
            showTitle={true}
          />

          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-5 h-5 cursor-pointer"
            />
            <Label htmlFor="is_active" className="text-base font-medium cursor-pointer">Ativo</Label>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1 h-11 sm:h-12 text-base font-medium"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto order-1 sm:order-2 h-11 sm:h-12 text-base font-medium"
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

