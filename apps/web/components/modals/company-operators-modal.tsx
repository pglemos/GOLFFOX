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
import { Users, Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"
import { globalSyncManager } from "@/lib/global-sync"
import { CreateOperatorLoginModal } from "./create-operator-login-modal"
import { EditUserModal } from "./edit-user-modal"

interface Company {
  id: string
  name: string
}

interface Operator {
  id: string
  name: string | null
  email: string
  role: string
  is_active: boolean
  phone: string | null
}

interface CompanyOperatorsModalProps {
  company: Company | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function CompanyOperatorsModal({
  company,
  isOpen,
  onClose,
  onSave,
}: CompanyOperatorsModalProps) {
  const [loading, setLoading] = useState(false)
  const [operators, setOperators] = useState<Operator[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedOperatorForEdit, setSelectedOperatorForEdit] = useState<Operator | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  useEffect(() => {
    if (company && isOpen) {
      loadOperators()
    } else {
      setOperators([])
    }
  }, [company, isOpen])

  const loadOperators = async () => {
    if (!company?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users-list?company_id=${company.id}&role=operator`)
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários')
      }
      const result = await response.json()
      if (result.success) {
        setOperators(result.users || [])
      } else {
        throw new Error(result.error || 'Erro ao carregar usuários')
      }
    } catch (error: any) {
      console.error('Erro ao carregar operadores:', error)
      notifyError(error, error.message || 'Erro ao carregar operadores')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOperator = async (operatorId: string, operatorName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${operatorName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/delete?id=${operatorId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Erro ao excluir usuário')
      }

      notifySuccess('Usuário excluído com sucesso')
      await loadOperators()
      globalSyncManager.triggerSync('user.deleted', { id: operatorId })
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error)
      notifyError(error, error.message || 'Erro ao excluir usuário')
    }
  }


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários Operadores - {company?.name}
            </DialogTitle>
            <DialogDescription>
              Gerencie os logins e senhas dos operadores desta empresa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-[var(--ink-muted)]">
                {operators.length} {operators.length === 1 ? 'operador cadastrado' : 'operadores cadastrados'}
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Login
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
                <span className="ml-3 text-[var(--ink-muted)]">Carregando operadores...</span>
              </div>
            ) : operators.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum operador cadastrado</h3>
                <p className="text-sm text-[var(--ink-muted)] mb-4">
                  Clique em "Criar Novo Login" para adicionar um operador
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {operators.map((operator) => (
                  <div
                    key={operator.id}
                    className="border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{operator.name || 'Sem nome'}</h3>
                          <span className={`px-2 py-1 rounded text-xs ${
                            operator.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {operator.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--ink-muted)] w-20">Email:</span>
                            <span className="font-mono">{operator.email}</span>
                          </div>
                          {operator.phone && (
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--ink-muted)] w-20">Telefone:</span>
                              <span>{operator.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--ink-muted)] w-20">Senha:</span>
                            <span className="text-xs text-[var(--ink-muted)] italic">
                              (Senha não pode ser exibida por segurança)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOperatorForEdit(operator)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteOperator(operator.id, operator.name || operator.email)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Criar Novo Login */}
      {company && (
        <CreateOperatorLoginModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false)
          }}
          onSave={async () => {
            setIsCreateModalOpen(false)
            await loadOperators()
            onSave()
          }}
          companyId={company.id}
          companyName={company.name}
        />
      )}

      {/* Modal Editar Usuário */}
      <EditUserModal
        user={selectedOperatorForEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedOperatorForEdit(null)
        }}
        onSave={async () => {
          setIsEditModalOpen(false)
          setSelectedOperatorForEdit(null)
          await loadOperators()
          onSave()
        }}
      />
    </>
  )
}

