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
import { Loader2, UserPlus, Key } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"
import { globalSyncManager } from "@/lib/global-sync"

interface CreateOperatorLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  companyId: string
  companyName: string
}

export function CreateOperatorLoginModal({
  isOpen,
  onClose,
  onSave,
  companyId,
  companyName,
}: CreateOperatorLoginModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  })
  const [error, setError] = useState<string | null>(null)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validações
      if (!formData.email.trim() || !validateEmail(formData.email)) {
        setError("Email válido é obrigatório")
        setLoading(false)
        return
      }

      if (!formData.password.trim() || formData.password.length < 6) {
        setError("Senha deve ter no mínimo 6 caracteres")
        setLoading(false)
        return
      }

      if (!formData.name.trim()) {
        setError("Nome é obrigatório")
        setLoading(false)
        return
      }

      // Chamar API para criar login de operador
      const response = await fetch("/api/admin/create-operator-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_id: companyId,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || "Erro ao criar login de operador")
      }

      if (result.success) {
        notifySuccess(`Login de operador criado com sucesso para ${companyName}!`)
        
        // Trigger global sync
        globalSyncManager.triggerSync('user.created', { companyId })
        globalSyncManager.triggerSync('company.updated', { companyId })
        
        onSave()
        onClose()
        setFormData({ email: "", password: "", name: "", phone: "" })
        setError(null)
      } else {
        throw new Error(result.error || "Erro ao criar login de operador")
      }
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao criar login de operador"
      setError(errorMessage)
      notifyError(err, errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Login Operador</DialogTitle>
          <DialogDescription>
            Crie um novo login de operador para a empresa {companyName}. Este login dará acesso ao painel do operador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="company-name">Empresa</Label>
              <p className="text-sm text-gray-600 mt-1">{companyName}</p>
            </div>

            <div>
              <Label htmlFor="operator-name">Nome do Operador *</Label>
              <Input
                id="operator-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo do operador"
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="operator-email">Email *</Label>
              <Input
                id="operator-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="operador@empresa.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="operator-password">Senha *</Label>
              <Input
                id="operator-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="operator-phone">Telefone (opcional)</Label>
              <Input
                id="operator-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+55 11 99999-9999"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading} type="button">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Criar Login
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

