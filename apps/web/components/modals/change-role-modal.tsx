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
  { value: 'admin', label: 'Administrador' },
  { value: 'operator', label: 'Operador' },
  { value: 'transportadora', label: 'Transportadora' },
  { value: 'driver', label: 'Motorista' },
  { value: 'passenger', label: 'Passageiro' },
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
        notifyError("Selecione um papel diferente")
        return
      }

      // Validação: admin não pode perder papel admin (ou apenas outro admin pode)
      if (user.role === 'admin' && newRole !== 'admin') {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user
        // Verificar se o usuário atual é admin
        const { data: currentUserData } = await (supabase as any)
          .from('users')
          .select('role')
          .eq('id', currentUser?.id || '')
          .single()

        if (currentUserData?.role !== 'admin') {
          notifyError("Apenas administradores podem alterar o papel de outros administradores")
          return
        }
      }

      const { error } = await (supabase as any)
        .from("users")
        .update({ role: newRole })
        .eq("id", user.id)

      if (error) throw error

      // Sincronização com Supabase (garantia adicional)
      await sync({
        resourceType: 'driver', // ou 'operator' dependendo do papel
        resourceId: user.id,
        action: 'update',
        data: {
          role: newRole,
          email: user.email,
          name: user.name,
        },
      })

      // Log de auditoria
      await auditLogs.update('user', user.id, {
        old_role: user.role,
        new_role: newRole,
        user_email: user.email,
      })

      notifySuccess("Papel alterado com sucesso!")
      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao alterar papel:", error)
      notifyError(formatError(error, "Erro ao alterar papel"))
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
            <p className="text-sm sm:text-base text-[var(--ink-muted)] break-words">{user?.name || user?.email}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-base font-medium">Novo Papel *</Label>
            <Select
              value={newRole}
              onValueChange={setNewRole}
              required
            >
              <SelectTrigger className="h-11 sm:h-12 text-base">
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
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <p className="text-sm text-orange-800">
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
              className="w-full sm:w-auto order-2 sm:order-1 min-h-[44px] text-base font-medium"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || newRole === user?.role}
              className="w-full sm:w-auto order-1 sm:order-2 bg-orange-500 hover:bg-orange-600 min-h-[44px] text-base font-medium"
            >
              {loading ? "Alterando..." : "Alterar Papel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

