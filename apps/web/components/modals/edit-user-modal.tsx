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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Loader2, Search } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"
import { globalSyncManager } from "@/lib/global-sync"
import { useCep } from "@/hooks/use-cep"

interface UserData {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
  is_active?: boolean
  phone?: string | null
  cpf?: string | null
  address_zip_code?: string | null
  address_street?: string | null
  address_number?: string | null
  address_neighborhood?: string | null
  address_complement?: string | null
  address_city?: string | null
  address_state?: string | null
}

interface EditUserModalProps {
  user: UserData | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
}: EditUserModalProps) {
  const [loading, setLoading] = useState(false)
  const { fetchCep, loading: loadingCep } = useCep()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "operador",
    is_active: true,
    phone: "",
    cpf: "",
    address_zip_code: "",
    address_street: "",
    address_number: "",
    address_neighborhood: "",
    address_complement: "",
    address_city: "",
    address_state: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role || "operador",
        is_active: user.is_active ?? true,
        phone: user.phone || "",
        cpf: user.cpf || "",
        address_zip_code: user.address_zip_code || "",
        address_street: user.address_street || "",
        address_number: user.address_number || "",
        address_neighborhood: user.address_neighborhood || "",
        address_complement: user.address_complement || "",
        address_city: user.address_city || "",
        address_state: user.address_state || "",
      })
    }
  }, [user, isOpen])

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
    if (!user?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim() || null,
          email: formData.email.trim(),
          password: formData.password.trim() || undefined,
          role: formData.role,
          is_active: formData.is_active,
          phone: formData.phone.trim() || null,
          cpf: formData.cpf.replace(/\D/g, '') || null,
          address_zip_code: formData.address_zip_code || null,
          address_street: formData.address_street || null,
          address_number: formData.address_number || null,
          address_neighborhood: formData.address_neighborhood || null,
          address_complement: formData.address_complement || null,
          address_city: formData.address_city || null,
          address_state: formData.address_state || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(errorData.error || errorData.message || "Erro ao atualizar usuário")
      }

      const result = await response.json()
      notifySuccess("Usuário atualizado com sucesso!")

      // Notificar sincronização global
      if (result.user) {
        globalSyncManager.triggerSync("user.updated", result.user)
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error)
      notifyError(error, error.message || "Erro ao atualizar usuário")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <User className="h-5 w-5 flex-shrink-0" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base break-words">
            Atualize os dados do usuário
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                maxLength={14}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha (opcional)</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Deixe em branco para manter"
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Papel *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="operator">Operador</SelectItem>
                  <SelectItem value="transportadora">Transportadora</SelectItem>
                  <SelectItem value="driver">Motorista</SelectItem>
                  <SelectItem value="passenger">Passageiro</SelectItem>
                </SelectContent>
              </Select>
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
          </div>

          <div className="border-t pt-4 mt-2">
            <h3 className="font-semibold mb-3">Endereço</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    value={formData.address_zip_code}
                    onChange={(e) => setFormData({ ...formData, address_zip_code: e.target.value })}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    disabled={loading}
                  />
                  <Button type="button" variant="outline" onClick={handleCepBlur} disabled={loading || loadingCep}>
                    {loadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="street">Rua/Avenida</Label>
                <Input
                  id="street"
                  value={formData.address_street}
                  onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                  placeholder="Rua Exemplo"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.address_number}
                  onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                  placeholder="123"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.address_neighborhood}
                  onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                  placeholder="Centro"
                  disabled={loading}
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.address_complement}
                  onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                  placeholder="Apto 101"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.address_city}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.address_state}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
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
                Usuário ativo
              </Label>
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
