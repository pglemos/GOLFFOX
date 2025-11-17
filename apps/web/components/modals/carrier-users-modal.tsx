"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { UserPlus, Trash2 } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"

interface CarrierUsersModalProps {
  carrier: { id: string; name: string }
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function CarrierUsersModal({ carrier, isOpen, onClose, onSave }: CarrierUsersModalProps) {
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
      const response = await fetch(`/api/admin/carriers/${carrier.id}/users`)
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
      const response = await fetch('/api/admin/create-carrier-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier_id: carrier.id,
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usuários - {carrier.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Novo Login de Acesso
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
                <div className="flex gap-2">
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
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
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
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
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

