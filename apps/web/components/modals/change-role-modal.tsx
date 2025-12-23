"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Shield, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { formatError } from "@/lib/error-utils"
import { auditLogs } from "@/lib/audit-log"
import { useSupabaseSync } from "@/hooks/use-supabase-sync"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ChangeRoleModalProps {
  user: any
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'gestor_empresa', label: 'Gestor da Empresa' },
  { value: 'gestor_transportadora', label: 'Gestor da Transportadora' },
  { value: 'motorista', label: 'Motorista' },
  { value: 'passageiro', label: 'Passageiro' },
]

export function ChangeRoleModal({
  user,
  isOpen,
  onClose,
  onSave,
}: ChangeRoleModalProps) {
  const [loading, setLoading] = useState(false)
  const [newRole, setNewRole] = useState<string>(user?.role || '')
  const { sync } = useSupabaseSync({ showToast: false })

  useEffect(() => {
    if (user) {
      setNewRole(user.role || '')
    }
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!newRole || newRole === user.role) {
        notifyError(new Error("Papel inválido"), "Selecione um papel diferente")
        setLoading(false)
        return
      }

      // ✅ BUG #5 FIX: Usar API route em vez de client-side Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        notifyError(new Error('Sessão expirada'), 'Sessão expirada. Por favor, faça login novamente.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/users/change-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          newRole: newRole,
          oldRole: user.role
        })
      })

      // Melhor tratamento de erros
      if (!response.ok) {
        let errorMessage = 'Erro ao alterar papel'

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage

          console.error('❌ Erro da API change-role:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          })
        } catch (parseError) {
          console.error('❌ Erro da API (sem JSON):', response.status)
        }

        // Mensagens específicas
        if (response.status === 401) {
          errorMessage = 'Sessão expirada. Por favor, faça login novamente.'
        } else if (response.status === 403) {
          errorMessage = 'Você não tem permissão para alterar papéis. Apenas administradores.'
        } else if (response.status === 404) {
          errorMessage = 'Usuário não encontrado.'
        } else if (response.status === 400) {
          errorMessage = errorMessage // Já vem da API
        }

        notifyError(new Error(errorMessage), errorMessage)
        setLoading(false)
        return
      }

      const result = await response.json()

      if (result.success) {
        notifySuccess(result.message || "Papel alterado com sucesso!")

        // Sincronização com Supabase (garantia adicional)
        await sync({
          resourceType: 'motorista',
          resourceId: user.id,
          action: 'update',
          data: {
            role: newRole,
            email: user.email,
            name: user.name,
          },
        })

        onSave()
        setTimeout(() => onClose(), 1500)
      } else {
        throw new Error(result.error || 'Erro ao alterar papel')
      }
    } catch (error: any) {
      console.error("❌ Exceção ao alterar papel:", error)
      notifyError(error, error.message || "Erro ao alterar papel")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <Shield className="h-5 w-5 flex-shrink-0" />
            Alterar Papel
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-medium">Usuário</Label>
            <p className="text-sm sm:text-base text-ink-muted break-words">{user?.name || user?.email}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-base font-medium">Novo Papel *</Label>
            <Select
              value={newRole}
              onValueChange={setNewRole}
              required
            >
              <SelectTrigger className="min-h-[48px] text-base">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {user?.role === 'admin' && newRole !== 'admin' && (
            <div className="flex items-start gap-2 p-3 bg-brand-light border border-brand-soft rounded-lg">
              <AlertTriangle className="h-4 w-4 text-brand mt-0.5" />
              <p className="text-sm text-brand">
                Atenção: Você está removendo o papel de administrador deste usuário.
                Esta ação requer privilégios de administrador.
              </p>
            </div>
          )}

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
              disabled={loading || newRole === user?.role}
              className="w-full sm:w-auto order-1 sm:order-2 bg-brand hover:bg-brand-hover text-base font-medium"
            >
              {loading ? "Alterando..." : "Alterar Papel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

