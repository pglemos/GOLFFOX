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

interface AssociateOperatorModalProps {
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
}: AssociateOperatorModalProps) {
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
        .in("role", ["operator", "operador"])
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
      const response = await fetch("/api/operator/associate-company", {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Associar Operador à Empresa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Empresa</Label>
            <p className="text-sm text-gray-600 mt-1">{companyName}</p>
          </div>

          <div>
            <Label htmlFor="operator-email">Operador</Label>
            {loadingOperators ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm">Carregando operadores...</span>
              </div>
            ) : (
              <select
                id="operator-email"
                value={operatorEmail}
                onChange={(e) => setOperatorEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleAssociate} disabled={loading || !operatorEmail}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Associando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Associar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

