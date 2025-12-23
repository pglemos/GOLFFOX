import { useState, useEffect } from "react"

import { Loader2, UserPlus, Key, Search } from "lucide-react"

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
import { useCep } from "@/hooks/use-cep"
import { formatCPF, formatPhone, formatCEP } from "@/lib/format-utils"
import { globalSyncManager } from "@/lib/global-sync"
import { CompanyService, type Company } from "@/lib/services/company-service"
import { notifySuccess, notifyError } from "@/lib/toast"

interface CreateOperadorLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  companyId?: string
  companyName?: string
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSave,
  companyId: initialCompanyId,
  companyName: initialCompanyName,
}: CreateOperadorLoginModalProps) {
  const [loading, setLoading] = useState(false)
  const { fetchCep, loading: loadingCep } = useCep()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    cpf: "",
    role: "operador",
    company_id: initialCompanyId || "",
    address_zip_code: "",
    address_street: "",
    address_number: "",
    address_neighborhood: "",
    address_complement: "",
    address_city: "",
    address_state: "",
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && !initialCompanyId) {
      loadCompanies()
    }
  }, [isOpen, initialCompanyId])

  useEffect(() => {
    if (initialCompanyId) {
      setFormData(prev => ({ ...prev, company_id: initialCompanyId }))
    }
  }, [initialCompanyId])

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true)
      const data = await CompanyService.listCompanies()
      setCompanies(data)
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleCepBlur = async () => {
    if (formData.address_zip_code.length >= 8) {
      const address = await fetchCep(formData.address_zip_code)
      if (address) {
        setFormData(prev => ({
          ...prev,
          address_street: address.logradouro,
          address_neighborhood: address.bairro,
          address_city: address.localidade,
          address_state: address.uf,
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validações
      if (!formData.email.trim() || !validateEmail(formData.email)) {
        throw new Error("Email válido é obrigatório")
      }

      if (!formData.password.trim() || formData.password.length < 6) {
        throw new Error("Senha deve ter no mínimo 6 caracteres")
      }

      if (!formData.name.trim()) {
        throw new Error("Nome é obrigatório")
      }

      if (!formData.cpf.trim()) {
        throw new Error("CPF é obrigatório")
      }

      if (!formData.address_street.trim() || !formData.address_number.trim() || !formData.address_neighborhood.trim() || !formData.address_zip_code.trim()) {
        throw new Error("Endereço completo é obrigatório (CEP, Rua, Número, Bairro)")
      }

      // Validar empresa se não for admin
      if (formData.role !== 'admin' && !formData.company_id) {
        throw new Error("Selecione uma empresa para este usuário")
      }

      // Chamar API para criar usuário
      const response = await fetch("/api/admin/criar-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          company_id: formData.role === 'admin' ? null : formData.company_id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || "Erro ao criar usuário")
      }

      if (result.success) {
        notifySuccess(`Usuário criado com sucesso!`)

        // Trigger global sync (Pilar 4: snake_case)
        if (formData.company_id) {
          globalSyncManager.triggerSync('user.created', { company_id: formData.company_id })
          globalSyncManager.triggerSync('company.updated', { company_id: formData.company_id })
        } else {
          globalSyncManager.triggerSync('user.created', {})
        }

        onSave()
        onClose()
        setFormData({
          email: "",
          password: "",
          name: "",
          phone: "",
          cpf: "",
          role: "operador",
          company_id: initialCompanyId || "",
          address_zip_code: "",
          address_street: "",
          address_number: "",
          address_neighborhood: "",
          address_complement: "",
          address_city: "",
          address_state: "",
        })
        setError(null)
      } else {
        throw new Error(result.error || "Erro ao criar usuário")
      }
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao criar usuário"
      setError(errorMessage)
      notifyError(err, errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold break-words">Criar Novo Usuário</DialogTitle>
          <DialogDescription className="text-sm sm:text-base break-words">
            {initialCompanyName
              ? `Crie um novo funcionário para a empresa ${initialCompanyName}.`
              : "Crie um novo usuário no sistema."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="user-role" className="text-base font-medium">Perfil de Permissão *</Label>
                <select
                  id="user-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="min-h-[48px] w-full rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="gestor_empresa">Gestor da Empresa</option>
                  <option value="gestor_transportadora">Gestor da Transportadora</option>
                  <option value="motorista">Motorista</option>
                  <option value="passageiro">Passageiro</option>
                </select>
              </div>

              {!initialCompanyId && formData.role !== 'admin' && (
                <div className="col-span-1 sm:col-span-2">
                  <Label htmlFor="company-select" className="text-base font-medium">Empresa *</Label>
                  <select
                    id="company-select"
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className="min-h-[48px] w-full rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading || loadingCompanies}
                    required={formData.role !== 'admin'}
                  >
                    <option value="">Selecione uma empresa</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="operador-name" className="text-base font-medium">Nome Completo *</Label>
                <Input
                  id="operador-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="operador-cpf" className="text-base font-medium">CPF *</Label>
                <Input
                  id="operador-cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  disabled={loading}
                  required
                  maxLength={14}
                />
              </div>

              <div>
                <Label htmlFor="operador-phone" className="text-base font-medium">Telefone</Label>
                <Input
                  id="operador-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  placeholder="(11) 99999-9999"
                  disabled={loading}
                  maxLength={15}
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="operador-email" className="text-base font-medium">Email (Login) *</Label>
                <Input
                  id="operador-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@empresa.com"
                  disabled={loading}
                  required
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="operador-password" className="text-base font-medium">Senha *</Label>
                <Input
                  id="operador-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>

              {/* Endereço */}
              <div className="col-span-1 sm:col-span-2 border-t pt-4 mt-2">
                <h3 className="font-semibold mb-3">Endereço</h3>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="cep" className="text-base font-medium">CEP *</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    value={formData.address_zip_code}
                    onChange={(e) => setFormData({ ...formData, address_zip_code: formatCEP(e.target.value) })}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    disabled={loading}
                    required
                    maxLength={9}
                  />
                  <Button type="button" variant="outline" onClick={handleCepBlur} disabled={loading || loadingCep} className="px-4">
                    {loadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="street" className="text-base font-medium">Rua/Avenida *</Label>
                <Input
                  id="street"
                  value={formData.address_street}
                  onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                  placeholder="Rua Exemplo"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="number" className="text-base font-medium">Número *</Label>
                <Input
                  id="number"
                  value={formData.address_number}
                  onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                  placeholder="123"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="neighborhood" className="text-base font-medium">Bairro *</Label>
                <Input
                  id="neighborhood"
                  value={formData.address_neighborhood}
                  onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                  placeholder="Centro"
                  disabled={loading}
                  required
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="complement" className="text-base font-medium">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.address_complement}
                  onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                  placeholder="Apto 101"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="city" className="text-base font-medium">Cidade</Label>
                <Input
                  id="city"
                  value={formData.address_city}
                  readOnly
                  className="bg-bg-soft"
                />
              </div>

              <div>
                <Label htmlFor="state" className="text-base font-medium">Estado</Label>
                <Input
                  id="state"
                  value={formData.address_state}
                  readOnly
                  className="bg-bg-soft"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-error-light border border-error-light rounded-md text-sm text-error mt-4">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              type="button"
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
                <>
                  <Key className="h-4 w-4 mr-2 flex-shrink-0" />
                  Criar Usuário
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
