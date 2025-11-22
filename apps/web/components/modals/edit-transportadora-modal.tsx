"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { notifySuccess, notifyError } from "@/lib/toast"
import { supabase } from "@/lib/supabase"

interface EditCarrierModalProps {
  carrier: any
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EditCarrierModal({ carrier, isOpen, onClose, onSave }: EditCarrierModalProps) {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [email, setEmail] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [stateRegistration, setStateRegistration] = useState("")
  const [municipalRegistration, setMunicipalRegistration] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (carrier) {
      setName(carrier.name || "")
      setAddress(carrier.address || "")
      setPhone(carrier.phone || "")
      setContactPerson(carrier.contact_person || "")
      setEmail(carrier.email || "")
      setCnpj(carrier.cnpj || "")
      setStateRegistration(carrier.state_registration || "")
      setMunicipalRegistration(carrier.municipal_registration || "")
    }
  }, [carrier, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // ✅ BUG #4 FIX: Adicionar autenticação via token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        notifyError(new Error('Sessão expirada'), 'Sessão expirada. Por favor, faça login novamente.')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/admin/transportadora/update?id=${carrier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
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

      // ✅ BUG #4 FIX: Melhorar feedback de erros
      if (!response.ok) {
        let errorMessage = 'Erro ao atualizar transportadora'
        let errorDetails = ''

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          errorDetails = errorData.details ? JSON.stringify(errorData.details) : ''

          console.error('❌ Erro da API update-transportadora:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          })
        } catch (parseError) {
          console.error('❌ Erro da API (sem JSON):', {
            status: response.status,
            statusText: response.statusText
          })
        }

        // Mensagens específicas por status code
        if (response.status === 401) {
          errorMessage = 'Sessão expirada. Por favor, faça login novamente.'
        } else if (response.status === 403) {
          errorMessage = 'Você não tem permissão para editar transportadoras. Contacte o administrador.'
        } else if (response.status === 404) {
          errorMessage = 'Transportadora não encontrada.'
        } else if (response.status === 400) {
          errorMessage = errorDetails ? `Dados inválidos: ${errorDetails}` : errorMessage
        } else if (response.status === 500) {
          errorMessage = errorDetails ? `Erro no servidor: ${errorMessage}\n\n${errorDetails}` : `Erro no servidor: ${errorMessage}`
        }

        notifyError(new Error(errorMessage), errorMessage)
        setLoading(false)
        // ❌ NÃO fechar modal - deixar usuário ver erro
        return
      }

      const result = await response.json()

      if (result.success) {
        notifySuccess('Transportadora atualizada com sucesso!')
        onSave()
        // Fechar modal apenas em sucesso
        setTimeout(() => onClose(), 1500)
      } else {
        throw new Error(result.error || 'Erro ao atualizar transportadora')
      }
    } catch (error: any) {
      console.error('❌ Exceção ao atualizar transportadora:', error)
      notifyError(error, error.message || 'Erro ao atualizar transportadora')
      //❌ NÃO fechar modal em erro
    } finally {
      setLoading(false)
    }
  }

  if (!carrier) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold">Editar Transportadora</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="col-span-1 sm:col-span-2">
              <Label htmlFor="name" className="text-base font-medium">Nome da Transportadora *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: Transportes XYZ Ltda"
                className="text-base h-11 sm:h-12 px-4 py-3"
              />
            </div>
            <div>
              <Label htmlFor="cnpj" className="text-base font-medium">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className="text-base h-11 sm:h-12 px-4 py-3"
              />
            </div>
            <div>
              <Label htmlFor="stateRegistration" className="text-base font-medium">Inscrição Estadual</Label>
              <Input
                id="stateRegistration"
                value={stateRegistration}
                onChange={(e) => setStateRegistration(e.target.value)}
                placeholder="123456789"
                className="text-base h-11 sm:h-12 px-4 py-3"
              />
            </div>
            <div>
              <Label htmlFor="municipalRegistration" className="text-base font-medium">Inscrição Municipal</Label>
              <Input
                id="municipalRegistration"
                value={municipalRegistration}
                onChange={(e) => setMunicipalRegistration(e.target.value)}
                placeholder="987654321"
                className="text-base h-11 sm:h-12 px-4 py-3"
              />
            </div>
            <div>
              <Label htmlFor="contactPerson" className="text-base font-medium">Pessoa de Contato</Label>
              <Input
                id="contactPerson"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Nome do responsável"
                className="text-base h-11 sm:h-12 px-4 py-3"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-base font-medium">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="text-base h-11 sm:h-12 px-4 py-3"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-base font-medium">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@transportadora.com"
                className="text-base h-11 sm:h-12 px-4 py-3"
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Label htmlFor="address" className="text-base font-medium">Endereço Completo</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade - UF, CEP"
                className="text-base h-11 sm:h-12 px-4 py-3"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 justify-end pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1 min-h-[44px] text-base font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !name}
              className="w-full sm:w-auto order-1 sm:order-2 bg-orange-500 hover:bg-orange-600 min-h-[44px] text-base font-medium"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Export com nome alternativo para compatibilidade
export const EditTransportadoraModal = EditCarrierModal

