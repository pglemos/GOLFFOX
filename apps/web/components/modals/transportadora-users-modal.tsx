"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { UserPlus, Trash2 } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"

interface TransportadoraUsersModalProps {
  carrier: { id: string; name: string }
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function TransportadoraUsersModal({ carrier, isOpen, onClose, onSave }: TransportadoraUsersModalProps) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")

  useEffect(() => {
    if (isOpen && carrier) {
      loadUsers()
    }
  }, [isOpen, carrier])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/transportadora/${carrier.id}/users`)
      if (response.ok) {
        const result = await response.json()
        setUsers(result.users || [])
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/create-transportadora-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transportadora_id: carrier.id,
          email: newUserEmail,
          name: newUserName,
          password: newUserPassword,
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuário')
      }

      notifySuccess('Usuário criado com sucesso')
      setNewUserEmail("")
      setNewUserName("")
      setNewUserPassword("")
      setShowCreateForm(false)
      loadUsers()
      onSave()
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      notifyError(error, error.message || 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userEmail}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/delete?id=${userId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir usuário')
      }

      notifySuccess('Usuário excluído com sucesso')
      loadUsers()
      onSave()
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error)
      notifyError(error, error.message || 'Erro ao excluir usuário')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold break-words">Usuários - {carrier.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {!showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)} className="w-full min-h-[44px] text-sm sm:text-base">
              <UserPlus className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Criar Novo Login de Acesso</span>
              <span className="sm:hidden">Criar Login</span>
            </Button>
          )}

          {showCreateForm && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Novo Login de Acesso</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                    placeholder="Nome do usuário"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                    placeholder="usuario@transportadora.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-4 border-t mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewUserEmail("")
                      setNewUserName("")
                      setNewUserPassword("")
                    }}
                    disabled={loading}
                    className="w-full sm:w-auto order-2 sm:order-1 min-h-[44px] text-base font-medium"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading} className="w-full sm:w-auto order-1 sm:order-2 bg-orange-500 hover:bg-orange-600 min-h-[44px] text-base font-medium">
                    {loading ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Usuários Cadastrados ({users.length})</h3>
            {loading && users.length === 0 && (
              <div className="text-center py-4 text-[var(--muted)]">Carregando...</div>
            )}
            {!loading && users.length === 0 && (
              <Card className="p-4 text-center text-[var(--muted)]">
                Nenhum usuário cadastrado
              </Card>
            )}
            {users.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-[var(--muted)]">{user.email}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    className="min-h-[44px] text-xs sm:text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    Excluir
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

