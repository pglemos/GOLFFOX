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
import toast from "react-hot-toast"
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
  { value: 'driver', label: 'Motorista' },
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
        toast.error("Selecione um papel diferente")
        return
      }

      // Validação: admin não pode perder papel admin (ou apenas outro admin pode)
      if (user.role === 'admin' && newRole !== 'admin') {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user
        // Verificar se o usuário atual é admin
        const { data: currentUserData } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser?.id)
          .single()

        if (currentUserData?.role !== 'admin') {
          toast.error("Apenas administradores podem alterar o papel de outros administradores")
          return
        }
      }

      const { error } = await supabase
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

      toast.success("Papel alterado com sucesso!")
      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao alterar papel:", error)
      toast.error(error.message || "Erro ao alterar papel")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Alterar Papel
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Usuário</Label>
            <p className="text-sm text-[var(--ink-muted)]">{user?.name || user?.email}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Novo Papel *</Label>
            <Select
              value={newRole}
              onValueChange={setNewRole}
              required
            >
              <SelectTrigger>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || newRole === user?.role}>
              {loading ? "Alterando..." : "Alterar Papel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

