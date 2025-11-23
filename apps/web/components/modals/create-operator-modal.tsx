"use client"

import { useState } from "react"
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
import { Briefcase, UserPlus, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { globalSyncManager } from "@/lib/global-sync"
import { formatPhone, formatCEP, formatCPF } from "@/lib/format-utils"

interface CreateOperatorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function CreateOperatorModal({
  isOpen,
  onClose,
  onSave,
}: CreateOperatorModalProps) {
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
        formData.address,
        formData.addressNumber ? `Nº ${formData.addressNumber}` : '',
        formData.addressComplement || '',
        formData.city ? `${formData.city}` : '',
        formData.state ? `- ${formData.state}` : '',
        formData.zipCode ? `CEP: ${formData.zipCode}` : ''
      ].filter(Boolean).join(', ')

      const requestBody: any = {
        companyName: formData.companyName,
        cnpj: formData.cnpj || null,
        stateRegistration: formData.stateRegistration || null,
        municipalRegistration: formData.municipalRegistration || null,
        address: fullAddress || formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zipCode: formData.zipCode || null,
        companyPhone: formData.companyPhone || null,
        companyEmail: formData.companyEmail || null,
        companyWebsite: formData.companyWebsite || null,
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

      const response = await fetch('/api/admin/create-operator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      })

      if (!response.ok) {
        let errorMessage = 'Erro ao criar empresa'
        let errorDetails = ''

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          errorDetails = errorData.details || ''
          console.error('❌ Erro da API create-operator:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          })
        } catch (parseError) {
          console.error('❌ Erro da API create-operator (sem JSON):', {
            status: response.status,
            statusText: response.statusText
          })
        }

        if (response.status === 401) {
          errorMessage = 'Sessão expirada. Por favor, faça login novamente.'
        } else if (response.status === 403) {
          errorMessage = 'Você não tem permissão para criar empresas. Contacte o administrador.'
        } else if (response.status === 404) {
          errorMessage = 'API não encontrada. Por favor, contacte o suporte técnico.'
        } else if (response.status === 500) {
          errorMessage = errorDetails ? `Erro no servidor: ${errorMessage}\n\nDetalhes: ${errorDetails}` : `Erro no servidor: ${errorMessage}`
        } else if (response.status >= 400) {
          errorMessage = errorDetails ? `${errorMessage}\n\nDetalhes: ${errorDetails}` : errorMessage
        }

        notifyError(new Error(errorMessage), errorMessage)
        setLoading(false)
        setProgress('')
        setStep(1)
        return
      }

      const result = await response.json()

      if (!result.companyId && !result.company_id) {
        const errorMsg = 'Resposta inválida da API: companyId não encontrado'
        console.error('❌ Resposta da API create-operator:', result)
        notifyError(new Error(errorMsg), errorMsg)
        setLoading(false)
        setProgress('')
        setStep(1)
        return
      }

      setStep(7)
      notifySuccess('Empresa criada com sucesso!')

      if (result.company) {
        globalSyncManager.triggerSync('company.created', result.company)
      }
      if (result.operator || result.userId) {
        globalSyncManager.triggerSync('user.created', {
          id: result.userId || result.operatorId,
          email: result.email || formData.responsibleEmail || '',
          role: 'operador',
          company_id: result.companyId
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
      console.error("Erro ao criar empresa:", error)
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
            Preencha os dados da empresa. Os operadores podem ser criados posteriormente através do botão "Usuário Operador" na lista de empresas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{progress}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[var(--brand)] h-2 rounded-full transition-all duration-300"
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
                    onChange={(e) => setFormData({ ...formData, cnpj: formatCPF(e.target.value) })}
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
                    placeholder="São Paulo"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: formatCEP(e.target.value) })}
                    placeholder="00000-000"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Dados do Responsável (Opcional)
              </h3>
              <p className="text-sm text-[var(--ink-muted)] mb-4">
                Você pode preencher os dados do responsável agora ou criar os operadores depois através do botão "Usuário Operador" na lista de empresas.
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
              className="w-full sm:w-auto order-2 sm:order-1 min-h-[44px] text-base font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto order-1 sm:order-2 bg-orange-500 hover:bg-orange-600 min-h-[44px] text-base font-medium"
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
