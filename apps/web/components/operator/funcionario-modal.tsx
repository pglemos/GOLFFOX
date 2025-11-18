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
import { AddressAutocomplete } from "@/components/address-autocomplete"

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
    is_active: true
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
        is_active: funcionario.is_active ?? true
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
        is_active: true
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
            is_active: formData.is_active
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
        // Create new employee user via API route
        const res = await fetch('/api/operator/create-employee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            phone: formData.phone,
            role: 'passenger'
          })
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Erro ao criar funcionário')
        }

        const { userId } = await res.json()

        // Create employee_company entry
        const { error } = await (supabase as any)
          .from("gf_employee_company")
          .insert({
            employee_id: userId,
            company_id: empresaId,
            cpf: formData.cpf,
            address: formData.address,
            latitude: lat,
            longitude: lng,
            cost_center_id: formData.cost_center_id,
            is_active: formData.is_active
          })

        if (error) throw error

        notifySuccess("Funcionário cadastrado com sucesso!", {
          i18n: { ns: 'operator', key: 'employees.created' }
        })
      }

      onSave()
      onClose()
    } catch (error: any) {
      logError("Erro ao salvar funcionário", { error }, 'FuncionarioModal')
      notifyError(`Erro ao salvar funcionário: ${error.message}`, undefined, {
        i18n: { ns: 'operator', key: 'employees.saveError' }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">{funcionario ? "Editar Funcionário" : "Adicionar Funcionário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:gap-4 py-2 sm:py-4">
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="name" className="text-sm sm:text-base">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="phone" className="text-sm sm:text-base">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="cpf" className="text-sm sm:text-base">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <AddressAutocomplete
              value={formData.address}
              onChange={(address, lat, lng) => {
                setFormData(prev => ({
                  ...prev,
                  address,
                  latitude: lat,
                  longitude: lng
                }))
              }}
              label="Endereço"
              placeholder="Digite o endereço completo..."
              onGeocodeError={(error) => {
                logError("Erro no autocomplete", { error }, 'FuncionarioModal')
                notifyError(error)
              }}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 sm:w-5 sm:h-5"
            />
            <Label htmlFor="is_active" className="text-sm sm:text-base cursor-pointer">Ativo</Label>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto order-1 sm:order-2"
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

