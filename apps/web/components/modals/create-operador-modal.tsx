"use client"

import { useState } from "react"

import { Briefcase, UserPlus, Loader2 } from "lucide-react"

import { AddressForm, AddressData } from "@/components/address-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchWithErrorHandling } from "@/lib/api/fetch-with-error-handling"
import { formatPhone, formatCEP, formatCPF, formatCNPJ } from "@/lib/format-utils"
import { globalSyncManager } from "@/lib/global-sync"
import { logError } from "@/lib/logger"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"

interface CreateOperadorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function CreateOperatorModal({
  isOpen,
  onClose,
  onSave,
}: CreateOperadorModalProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Dados da Empresa
    companyName: "",
    cnpj: "",
    stateRegistration: "",
    municipalRegistration: "",
    address: "",
    addressNumber: "",
    addressComplement: "",
    city: "",
    state: "",
    zipCode: "",
    companyPhone: "",
    companyEmail: "",
    companyWebsite: "",
    // Dados do Responsável (que será o operador)
    responsibleName: "",
    responsibleEmail: "",
    responsiblePhone: "",
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
  const [progress, setProgress] = useState("")

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validações
      if (!formData.companyName.trim()) {
        notifyError(new Error('Nome da empresa é obrigatório'), 'Nome da empresa é obrigatório')
        setLoading(false)
        return
      }

      if (formData.responsibleEmail.trim() && !validateEmail(formData.responsibleEmail)) {
        notifyError(new Error('Email inválido'), 'Email do responsável inválido')
        setLoading(false)
        return
      }

      setProgress("Criando empresa...")
      setStep(2)

      const fullAddress = [
        formData.addressData.street,
        formData.addressData.number ? `Nº ${formData.addressData.number}` : '',
        formData.addressData.complement || '',
        formData.addressData.city ? `${formData.addressData.city}` : '',
        formData.addressData.state ? `- ${formData.addressData.state}` : '',
        formData.addressData.cep ? `CEP: ${formData.addressData.cep}` : ''
      ].filter(Boolean).join(', ')

      const requestBody: any = {
        companyName: formData.companyName,
        cnpj: formData.cnpj || null,
        stateRegistration: formData.stateRegistration || null,
        municipalRegistration: formData.municipalRegistration || null,
        address: fullAddress || formData.address || null,
        city: formData.addressData.city || null,
        state: formData.addressData.state || null,
        zipCode: formData.addressData.cep || null,
        companyPhone: formData.companyPhone || null,
        companyEmail: formData.companyEmail || null,
        companyWebsite: formData.companyWebsite || null,
        address_zip_code: formData.addressData.cep || null,
        address_street: formData.addressData.street || null,
        address_number: formData.addressData.number || null,
        address_neighborhood: formData.addressData.neighborhood || null,
        address_complement: formData.addressData.complement || null,
        address_city: formData.addressData.city || null,
        address_state: formData.addressData.state || null
      }

      if (formData.responsibleEmail.trim()) {
        requestBody.operatorEmail = formData.responsibleEmail
      }
      if (formData.responsiblePhone?.trim()) {
        requestBody.operatorPhone = formData.responsiblePhone
      }
      if (formData.responsibleName.trim()) {
        requestBody.operatorName = formData.responsibleName
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        notifyError(new Error('Usuário não autenticado'), 'Usuário não autenticado. Faça login novamente.')
        setLoading(false)
        return
      }

      const result = await fetchWithErrorHandling<{
        companyId?: string
        company_id?: string
        company?: any
        operador?: any
        userId?: string
        operatorId?: string
        email?: string
      }>(
        '/api/admin/criar-operador',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestBody),
          credentials: 'include',
        },
        {
          errorMessages: {
            401: 'Sessão expirada. Por favor, faça login novamente.',
            403: 'Você não tem permissão para criar empresas. Contacte o administrador.',
            404: 'API não encontrada. Por favor, contacte o suporte técnico.',
            500: 'Erro no servidor. Por favor, tente novamente ou entre em contato com o suporte.',
          },
          showErrorToast: true,
          showSuccessToast: false,
        }
      )

      if (!result.success) {
        setLoading(false)
        setProgress('')
        setStep(1)
        return
      }

      const data = result.data

      if (!data?.companyId && !data?.company_id) {
        const errorMsg = 'Resposta inválida da API: companyId não encontrado'
        notifyError(new Error(errorMsg), errorMsg)
        setLoading(false)
        setProgress('')
        setStep(1)
        return
      }

      setStep(7)
      notifySuccess('Empresa criada com sucesso!')

      if (data?.company) {
        globalSyncManager.triggerSync('company.created', data.company)
      }
      if (data?.operador || data?.userId) {
        globalSyncManager.triggerSync('user.created', {
          id: data.userId || data.operatorId,
          email: data.email || formData.responsibleEmail || '',
          role: 'gestor_transportadora',
          company_id: data.companyId || data.company_id
        })
      }

      setFormData({
        companyName: "",
        cnpj: "",
        stateRegistration: "",
        municipalRegistration: "",
        address: "",
        addressNumber: "",
        addressComplement: "",
        city: "",
        state: "",
        zipCode: "",
        addressData: {
          cep: "",
          street: "",
          number: "",
          neighborhood: "",
          complement: "",
          city: "",
          state: ""
        },
        companyPhone: "",
        companyEmail: "",
        companyWebsite: "",
        responsibleName: "",
        responsibleEmail: "",
        responsiblePhone: "",
      })

      onSave()
      setTimeout(() => {
        onClose()
        setStep(1)
        setProgress("")
      }, 2000)
    } catch (error: any) {
      logError("Erro ao criar empresa", { error }, 'CreateOperadorModal')
      notifyError(error, "Erro ao criar empresa")
      setStep(1)
    } finally {
      setLoading(false)
      setProgress("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <UserPlus className="h-5 w-5 flex-shrink-0" />
            Criar Empresa
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base break-words">
            Preencha os dados da empresa. Os operadores podem ser criados posteriormente através do botão &quot;Usu?rio Operador&quot; na lista de empresas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{progress}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-brand h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 7) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Dados da Empresa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="companyName" className="text-base font-medium">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefone da Empresa</Label>
                  <Input
                    id="companyPhone"
                    type="tel"
                    value={formData.companyPhone}
                    onChange={(e) => setFormData({ ...formData, companyPhone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
                  <Input
                    id="stateRegistration"
                    value={formData.stateRegistration}
                    onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })}
                    placeholder="123456789"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="municipalRegistration">Inscrição Municipal</Label>
                  <Input
                    id="municipalRegistration"
                    value={formData.municipalRegistration}
                    onChange={(e) => setFormData({ ...formData, municipalRegistration: e.target.value })}
                    placeholder="987654321"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email da Empresa</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    placeholder="contato@empresa.com"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Website</Label>
                  <Input
                    id="companyWebsite"
                    type="url"
                    value={formData.companyWebsite}
                    onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                    placeholder="https://www.empresa.com"
                    disabled={loading}
                  />
                </div>

                <AddressForm
                  value={formData.addressData}
                  onChange={(addressData) => {
                    setFormData(prev => ({
                      ...prev,
                      addressData,
                      address: addressData.street || prev.address
                    }))
                  }}
                  required={false}
                  disabled={loading}
                  showTitle={true}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Dados do Responsável (Opcional)
              </h3>
              <p className="text-sm text-ink-muted mb-4">
                Você pode preencher os dados do responsável agora ou criar os operadores depois através do botão &quot;Usu?rio Operador&quot; na lista de empresas.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="responsibleName">Nome do Responsável</Label>
                  <Input
                    id="responsibleName"
                    value={formData.responsibleName}
                    onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                    placeholder="Nome completo do responsável (opcional)"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="responsibleEmail">Email do Responsável</Label>
                  <Input
                    id="responsibleEmail"
                    type="email"
                    value={formData.responsibleEmail}
                    onChange={(e) => setFormData({ ...formData, responsibleEmail: e.target.value })}
                    placeholder="responsavel@empresa.com (opcional)"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsiblePhone">Telefone do Responsável</Label>
                  <Input
                    id="responsiblePhone"
                    type="tel"
                    value={formData.responsiblePhone}
                    onChange={(e) => setFormData({ ...formData, responsiblePhone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000 (opcional)"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1 text-base font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto order-1 sm:order-2 bg-brand hover:bg-brand-hover text-base font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                  Criando...
                </>
              ) : (
                "Criar Empresa"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
