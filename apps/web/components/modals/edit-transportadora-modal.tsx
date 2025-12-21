"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { notifySuccess, notifyError } from "@/lib/toast"
import { supabase } from "@/lib/supabase"
import { AddressForm, AddressData } from "@/components/address-form"
import type { transportadora } from "@/types/carrier"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, FileText, CreditCard, User } from "lucide-react"
import dynamic from "next/dynamic"

// Lazy load seções pesadas
const TransportadoraDocumentsSection = dynamic(() => import("@/components/transportadora/transportadora-documents-section"), { ssr: false })
const TransportadoraBankingSection = dynamic(() => import("@/components/transportadora/transportadora-banking-section"), { ssr: false })
const TransportadoraLegalRepSection = dynamic(() => import("@/components/transportadora/transportadora-legal-rep-section"), { ssr: false })

interface EditTransportadoraModalProps {
  transportadora: transportadora
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EditCarrierModal({ transportadora, isOpen, onClose, onSave }: EditTransportadoraModalProps) {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [email, setEmail] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [stateRegistration, setStateRegistration] = useState("")
  const [municipalRegistration, setMunicipalRegistration] = useState("")
  const [loading, setLoading] = useState(false)
  const [addressData, setAddressData] = useState<AddressData>({
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    complement: "",
    city: "",
    state: ""
  })

  useEffect(() => {
    if (transportadora) {
      setName(transportadora.name || "")
      setAddress(transportadora.address || "")
      setPhone(transportadora.phone || "")
      setContactPerson(transportadora.contact_person || "")
      setEmail(transportadora.email || "")
      setCnpj(transportadora.cnpj || "")
      setStateRegistration(transportadora.state_registration || "")
      setMunicipalRegistration(transportadora.municipal_registration || "")
      setAddressData({
        cep: transportadora.address_zip_code || "",
        street: transportadora.address_street || "",
        number: transportadora.address_number || "",
        neighborhood: transportadora.address_neighborhood || "",
        complement: transportadora.address_complement || "",
        city: transportadora.address_city || "",
        state: transportadora.address_state || ""
      })
    }
  }, [transportadora, isOpen])

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

      const response = await fetch(`/api/admin/transportadora/update?id=${transportadora.id}`, {
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
          municipal_registration: municipalRegistration || null,
          address_zip_code: addressData.cep || null,
          address_street: addressData.street || null,
          address_number: addressData.number || null,
          address_neighborhood: addressData.neighborhood || null,
          address_complement: addressData.complement || null,
          address_city: addressData.city || null,
          address_state: addressData.state || null
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao atualizar transportadora'
      console.error('❌ Exceção ao atualizar transportadora:', error)
      notifyError(error instanceof Error ? error : new Error(errorMessage), errorMessage)
      //❌ NÃO fechar modal em erro
    } finally {
      setLoading(false)
    }
  }

  if (!transportadora) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Editar Transportadora
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Atualize os dados da transportadora, documentos, informações bancárias e representante legal.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-1 mb-4">
            <TabsTrigger value="dados" className="text-xs sm:text-sm min-h-[44px]">
              <Building2 className="h-3 w-3 mr-1 hidden sm:inline" />Dados
            </TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs sm:text-sm min-h-[44px]">
              <FileText className="h-3 w-3 mr-1 hidden sm:inline" />Docs
            </TabsTrigger>
            <TabsTrigger value="bancario" className="text-xs sm:text-sm min-h-[44px]">
              <CreditCard className="h-3 w-3 mr-1 hidden sm:inline" />Bancário
            </TabsTrigger>
            <TabsTrigger value="representante" className="text-xs sm:text-sm min-h-[44px]">
              <User className="h-3 w-3 mr-1 hidden sm:inline" />Rep.Legal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
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
                    placeholder="Ex: 123456789"
                    className="text-base h-11 sm:h-12 px-4 py-3"
                  />
                </div>
                <div>
                  <Label htmlFor="municipalRegistration" className="text-base font-medium">Inscrição Municipal</Label>
                  <Input
                    id="municipalRegistration"
                    value={municipalRegistration}
                    onChange={(e) => setMunicipalRegistration(e.target.value)}
                    placeholder="Ex: 987654321"
                    className="text-base h-11 sm:h-12 px-4 py-3"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="text-base h-11 sm:h-12 px-4 py-3"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-base font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@empresa.com"
                    className="text-base h-11 sm:h-12 px-4 py-3"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson" className="text-base font-medium">Pessoa de Contato</Label>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="text-base h-11 sm:h-12 px-4 py-3"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <AddressForm
                    value={addressData}
                    onChange={(data) => {
                      setAddressData(data)
                      setAddress([
                        data.street,
                        data.number ? `Nº ${data.number}` : '',
                        data.neighborhood,
                        data.city,
                        data.state,
                        data.cep
                      ].filter(Boolean).join(', '))
                    }}
                    required={false}
                    disabled={loading}
                    showTitle={true}
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
                  className="w-full sm:w-auto order-1 sm:order-2 bg-brand hover:bg-brand-hover min-h-[44px] text-base font-medium"
                >
                  {loading ? 'Salvando...' : 'Salvar Dados'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="documentos">
            <TransportadoraDocumentsSection
              transportadoraId={transportadora.id}
              isEditing={true}
            />
          </TabsContent>

          <TabsContent value="bancario">
            <TransportadoraBankingSection
              transportadoraId={transportadora.id}
              isEditing={true}
            />
          </TabsContent>

          <TabsContent value="representante">
            <TransportadoraLegalRepSection
              transportadoraId={transportadora.id}
              isEditing={true}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Export com nome alternativo para compatibilidade
export const EditTransportadoraModal = EditCarrierModal
