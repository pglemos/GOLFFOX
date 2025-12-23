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
import { CreateUserModal } from "./create-operador-login-modal"
import { EditUserModal } from "./edit-user-modal"

interface Company {
  id: string
  name: string
}

interface operador {
  id: string
  name: string | null
  email: string
  role: string
  is_active: boolean
  phone: string | null
  cpf?: string | null
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
  const [operators, setOperators] = useState<operador[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedOperatorForEdit, setSelectedOperatorForEdit] = useState<operador | null>(null)
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
              Logins - {company?.name}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base break-words">
              Gerencie todos os logins e usuários desta empresa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-sm sm:text-base text-ink-muted break-words">
                {operators.length} {operators.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                className="w-full sm:w-auto min-h-[44px] text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Criar Novo Login</span>
                <span className="sm:hidden">Criar</span>
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
                <span className="ml-3 text-ink-muted">Carregando logins...</span>
              </div>
            ) : operators.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-ink-light mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum login cadastrado</h3>
                <p className="text-sm text-ink-muted mb-4">
                  Clique em &quot;Criar Novo Login&quot; para adicionar um acesso
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {operators.map((operador) => (
                  <div
                    key={operador.id}
                    className="border border-border rounded-lg p-3 sm:p-4 hover:bg-bg-hover transition-colors bg-card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="font-bold text-base sm:text-lg text-ink break-words leading-tight mr-1">
                            {operador.name || 'Sem nome'}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium uppercase tracking-wide border ${operador.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-bg-soft text-ink-muted border-border-light'
                              }`}>
                              {operador.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-info-light text-info border border-info-light uppercase tracking-wide">
                              {operador.role || 'Sem papel'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-1 text-sm text-ink-muted">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-ink-light text-xs font-medium uppercase tracking-wider w-12 shrink-0">Email:</span>
                            <span className="font-mono text-xs sm:text-sm truncate" title={operador.email}>{operador.email}</span>
                          </div>
                          {operador.cpf && (
                            <div className="flex items-center gap-2">
                              <span className="text-ink-light text-xs font-medium uppercase tracking-wider w-12 shrink-0">CPF:</span>
                              <span className="font-mono text-xs sm:text-sm">{operador.cpf}</span>
                            </div>
                          )}
                          {operador.phone && (
                            <div className="flex items-center gap-2">
                              <span className="text-ink-light text-xs font-medium uppercase tracking-wider w-12 shrink-0">Tel:</span>
                              <span className="font-mono text-xs sm:text-sm">{operador.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 mt-1 sm:mt-0 border-dashed border-bg-soft">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOperatorForEdit(operador)
                            setIsEditModalOpen(true)
                          }}
                          className="flex-1 sm:flex-none text-xs"
                          size="sm"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteOperator(operador.id, operador.name || operador.email)}
                          className="flex-1 sm:flex-none h-8 sm:h-9 text-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
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
              className="w-full sm:w-auto text-base font-medium"
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
