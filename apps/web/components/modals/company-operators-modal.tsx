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
import { CreateUserModal } from "./create-operator-login-modal"
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

interface CompanyUsersModalProps {
  company: Company | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function CompanyUsersModal({
  company,
  isOpen,
  onClose,
  onSave,
}: CompanyUsersModalProps) {
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
      // Fetch all users for the company (no role filter)
      const response = await fetch(`/api/admin/users-list?company_id=${company.id}`)
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
      console.error('Erro ao carregar usuários:', error)
      notifyError(error, error.message || 'Erro ao carregar usuários')
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
        <DialogContent className="w-[95vw] sm:w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
          <DialogHeader className="pb-4 sm:pb-6">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
              <Users className="h-5 w-5 flex-shrink-0" />
              Funcionários - {company?.name}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base break-words">
              Gerencie todos os funcionários e usuários desta empresa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-sm sm:text-base text-[var(--ink-muted)] break-words">
                {operators.length} {operators.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                className="w-full sm:w-auto min-h-[44px] text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Criar Novo Usuário</span>
                <span className="sm:hidden">Criar Usuário</span>
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
                <span className="ml-3 text-[var(--ink-muted)]">Carregando usuários...</span>
              </div>
            ) : operators.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum usuário cadastrado</h3>
                <p className="text-sm text-[var(--ink-muted)] mb-4">
                  Clique em "Criar Novo Usuário" para adicionar um funcionário
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
                          <span className={`px-2 py-1 rounded text-xs ${operator.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {operator.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 capitalize">
                            {operator.role || 'Sem papel'}
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
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 ml-0 sm:ml-4 mt-3 sm:mt-0 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOperatorForEdit(operator)
                            setIsEditModalOpen(true)
                          }}
                          className="w-full sm:w-auto min-h-[44px] text-xs sm:text-sm"
                        >
                          <Edit className="h-4 w-4 mr-2 flex-shrink-0" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteOperator(operator.id, operator.name || operator.email)}
                          className="w-full sm:w-auto min-h-[44px] text-xs sm:text-sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] text-base font-medium"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Criar Novo Usuário */}
      {company && (
        <CreateUserModal
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

