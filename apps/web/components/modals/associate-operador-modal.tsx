"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, UserPlus } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface AssociateOperadorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  companyId: string
  companyName: string
}

export function AssociateOperatorModal({
  isOpen,
  onClose,
  onSave,
  companyId,
  companyName,
}: AssociateOperadorModalProps) {
  const [loading, setLoading] = useState(false)
  const [operatorEmail, setOperatorEmail] = useState("")
  const [operators, setOperators] = useState<any[]>([])
  const [loadingOperators, setLoadingOperators] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOperators = useCallback(async () => {
    setLoadingOperators(true)
    setError(null)
    try {
      // Remover filtro is_active se a coluna não existir
      // A query funcionará mesmo se a coluna não existir
      const { data, error: queryError } = await supabase
        .from("users")
        .select("id, email, name, role")
        .eq("role", "operador")
        .order("email")

      if (queryError) {
        // Se erro for relacionado a coluna is_active, tentar sem filtro
        if (queryError.message?.includes('is_active') || queryError.message?.includes('column')) {
          console.warn('Coluna is_active não encontrada, continuando sem filtro')
          // Já temos a query sem is_active, então o erro não deveria ocorrer
          // Mas se ocorrer, vamos apenas logar e continuar
        } else {
          throw queryError
        }
      }
      
      setOperators(data || [])
    } catch (err: any) {
      console.error("Erro ao carregar operadores:", err)
      setError("Erro ao carregar operadores. Verifique se há operadores cadastrados.")
      setOperators([]) // Definir array vazio em caso de erro
    } finally {
      setLoadingOperators(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadOperators()
    }
  }, [isOpen, loadOperators])

  const handleAssociate = async () => {
    if (!operatorEmail.trim()) {
      setError("Selecione um operador")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/operador/associate-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: operatorEmail, companyId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao associar operador")
      }

      alert(`Operador associado à empresa ${companyName} com sucesso!`)
      onSave()
      onClose()
      setOperatorEmail("")
    } catch (err: any) {
      setError(err.message || "Erro ao associar operador")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold break-words">Associar Operador à Empresa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          <div>
            <Label className="text-base font-medium">Empresa</Label>
            <p className="text-sm sm:text-base text-ink-muted mt-1 break-words">{companyName}</p>
          </div>

          <div>
            <Label htmlFor="operador-email" className="text-base font-medium">Operador</Label>
            {loadingOperators ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm">Carregando operadores...</span>
              </div>
            ) : (
              <select
                id="operador-email"
                value={operatorEmail}
                onChange={(e) => setOperatorEmail(e.target.value)}
                className="min-h-[48px] w-full mt-1 px-4 py-3 text-base border border-input bg-background rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Selecione um operador</option>
                {operators.map((op) => (
                  <option key={op.id} value={op.email}>
                    {op.email} {op.name ? `(${op.name})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <div className="p-3 bg-error-light border border-error-light rounded-md text-sm text-error">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="w-full sm:w-auto order-2 sm:order-1 min-h-[44px] text-base font-medium"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAssociate} 
            disabled={loading || !operatorEmail}
            className="w-full sm:w-auto order-1 sm:order-2 bg-brand hover:bg-brand-hover min-h-[44px] text-base font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                Associando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2 flex-shrink-0" />
                Associar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

