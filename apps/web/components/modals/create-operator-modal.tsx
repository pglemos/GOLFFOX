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
    address: "",
    addressNumber: "",
    addressComplement: "",
    city: "",
    state: "",
    zipCode: "",
    companyPhone: "",
    companyEmail: "",
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
      // Validações - apenas nome da empresa é obrigatório
      if (!formData.companyName.trim()) {
        notifyError(new Error('Nome da empresa é obrigatório'), 'Nome da empresa é obrigatório')
        setLoading(false)
        return
      }
      
      // Validar email apenas se fornecido (opcional)
      if (formData.responsibleEmail.trim() && !validateEmail(formData.responsibleEmail)) {
        notifyError(new Error('Email inválido'), 'Email do responsável inválido')
        setLoading(false)
        return
      }

      // Usar API route para criar empresa
      setProgress("Criando empresa...")
      setStep(2)

      // Tentar obter token de autenticação de múltiplas fontes
      let authToken: string | null = null
      
      // 1. Tentar obter da sessão do Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          authToken = session.access_token
        }
      } catch (error) {
        console.warn('Erro ao obter sessão do Supabase:', error)
      }

      // 2. Não usar cookie para token — manter apenas sessão Supabase

      // 3. Em desenvolvimento, permitir continuar sem token (a API permite)
      // Em Next.js, NODE_ENV está disponível no cliente
      const isDevelopment = typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      } else if (!isDevelopment) {
        // Em produção, bloquear se não houver token
        notifyError(new Error('Usuário não autenticado'), 'Usuário não autenticado. Faça login novamente.')
        setLoading(false)
        return
      }

      // Montar endereço completo
      const fullAddress = [
        formData.address,
        formData.addressNumber ? `Nº ${formData.addressNumber}` : '',
        formData.addressComplement || '',
        formData.city ? `${formData.city}` : '',
        formData.state ? `- ${formData.state}` : '',
        formData.zipCode ? `CEP: ${formData.zipCode}` : ''
      ].filter(Boolean).join(', ')

      // Preparar dados do responsável (opcionais - apenas se fornecidos)
      const requestBody: any = {
        // Dados da Empresa
        companyName: formData.companyName,
        cnpj: formData.cnpj || null,
        address: fullAddress || formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zipCode: formData.zipCode || null,
        companyPhone: formData.companyPhone || null,
        companyEmail: formData.companyEmail || null,
      }
      
      // Adicionar dados do responsável apenas se fornecidos (opcional)
      if (formData.responsibleEmail.trim()) {
        requestBody.operatorEmail = formData.responsibleEmail
      }
      if (formData.responsiblePhone?.trim()) {
        requestBody.operatorPhone = formData.responsiblePhone
      }
      if (formData.responsibleName.trim()) {
        requestBody.operatorName = formData.responsibleName
      }

      const response = await fetch('/api/admin/create-operator', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        const errorMessage = errorData.error || errorData.message || 'Erro ao criar empresa'
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // Verificar se a resposta tem companyId (obrigatório)
      if (!result.companyId) {
        throw new Error('Resposta inválida da API: companyId não encontrado')
      }
      
      // Normalizar campos da resposta (userId/operatorId são opcionais se não houver senha)
      const operatorId = result.userId || result.operatorId

      // NOTA: A API já cria o usuário e empresa usando service role (bypass RLS)
      // Não é necessário fazer sincronização adicional aqui, pois causaria erro de RLS
      // A sincronização é apenas para casos onde a API não foi usada

      // Sucesso
      setStep(7)
      notifySuccess('Empresa criada com sucesso!')

      // Notificar sincronização global
      if (result.company) {
        globalSyncManager.triggerSync('company.created', result.company)
      }
      // Sincronizar usuário apenas se foi criado (quando há senha)
      if (result.operator || result.userId) {
        globalSyncManager.triggerSync('user.created', {
          id: result.userId || result.operatorId,
          email: result.email || formData.responsibleEmail || '',
          role: 'operator',
          company_id: result.companyId
        })
      }

      // Reset form
      setFormData({
        companyName: "",
        cnpj: "",
        address: "",
        addressNumber: "",
        addressComplement: "",
        city: "",
        state: "",
        zipCode: "",
        companyPhone: "",
        companyEmail: "",
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Criar Empresa
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da empresa. Os operadores podem ser criados posteriormente através do botão "Usuário Operador" na lista de empresas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Progress Steps */}
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

          {/* Campos do Formulário */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Seção: Dados da Empresa */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Dados da Empresa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
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
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                    placeholder="(00) 0000-0000"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
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
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="00000-000"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Seção: Dados do Responsável (Opcional) */}
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
                    onChange={(e) => setFormData({ ...formData, responsiblePhone: e.target.value })}
                    placeholder="(00) 00000-0000 (opcional)"
                    disabled={loading}
                  />
                </div>
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

