"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabaseServiceRole } from "@/lib/supabase-server"
import { notifySuccess, notifyError } from "@/lib/toast"
import { supabase } from "@/lib/supabase"

interface CreateCarrierModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function CreateCarrierModal({ isOpen, onClose, onSave }: CreateCarrierModalProps) {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [email, setEmail] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [stateRegistration, setStateRegistration] = useState("")
  const [municipalRegistration, setMunicipalRegistration] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/carriers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address: address || null,
          phone: phone || null,
          contact_person: contactPerson || null,
          email: email || null,
          cnpj: cnpj || null,
          state_registration: stateRegistration || null,
          municipal_registration: municipalRegistration || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar transportadora')
      }

      if (result.success) {
        notifySuccess('Transportadora criada com sucesso')
        setName("")
        setAddress("")
        setPhone("")
        setContactPerson("")
        setEmail("")
        setCnpj("")
        setStateRegistration("")
        setMunicipalRegistration("")
        onSave()
      } else {
        throw new Error(result.error || 'Erro ao criar transportadora')
      }
    } catch (error: any) {
      console.error('Erro ao criar transportadora:', error)
      notifyError(error, error.message || 'Erro ao criar transportadora')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Transportadora</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome da Transportadora *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: Transportes XYZ Ltda"
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>
            <div>
              <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
              <Input
                id="stateRegistration"
                value={stateRegistration}
                onChange={(e) => setStateRegistration(e.target.value)}
                placeholder="123456789"
              />
            </div>
            <div>
              <Label htmlFor="municipalRegistration">Inscrição Municipal</Label>
              <Input
                id="municipalRegistration"
                value={municipalRegistration}
                onChange={(e) => setMunicipalRegistration(e.target.value)}
                placeholder="987654321"
              />
            </div>
            <div>
              <Label htmlFor="contactPerson">Pessoa de Contato</Label>
              <Input
                id="contactPerson"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@transportadora.com"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="address">Endereço Completo</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade - UF, CEP"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name}>
              {loading ? 'Criando...' : 'Criar Transportadora'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

