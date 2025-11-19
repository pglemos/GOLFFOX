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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LifeBuoy, Loader2 } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"
import { globalSyncManager } from "@/lib/global-sync"

interface AssistanceRequest {
  id: string
  description?: string | null
  status?: string | null
  request_type?: string | null
  address?: string | null
}

interface EditAssistanceModalProps {
  request: AssistanceRequest | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EditAssistanceModal({
  request,
  isOpen,
  onClose,
  onSave,
}: EditAssistanceModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    status: "open",
    request_type: "emergency",
    address: "",
  })

  useEffect(() => {
    if (request) {
      setFormData({
        description: request.description || "",
        status: request.status || "open",
        request_type: request.request_type || "emergency",
        address: request.address || "",
      })
    }
  }, [request, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!request?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/assistance-requests/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formData.description.trim() || null,
          status: formData.status,
          request_type: formData.request_type,
          address: formData.address.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(errorData.error || errorData.message || "Erro ao atualizar ocorrência")
      }

      const result = await response.json()
      notifySuccess("Ocorrência atualizada com sucesso!")

      // Notificar sincronização global
      if (result.request) {
        globalSyncManager.triggerSync("assistance_request.updated", result.request)
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao atualizar ocorrência:", error)
      notifyError(error, error.message || "Erro ao atualizar ocorrência")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <LifeBuoy className="h-5 w-5 flex-shrink-0" />
            Editar Ocorrência
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base break-words">
            Atualize os dados da ocorrência
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="request_type" className="text-base font-medium">Tipo de Solicitação *</Label>
            <Select
              value={formData.request_type}
              onValueChange={(value) => setFormData({ ...formData, request_type: value })}
              disabled={loading}
            >
              <SelectTrigger className="h-11 sm:h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency">Emergência</SelectItem>
                <SelectItem value="breakdown">Avaria</SelectItem>
                <SelectItem value="accident">Acidente</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da ocorrência"
              required
              disabled={loading}
              className="h-11 sm:h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-base font-medium">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Endereço da ocorrência"
              disabled={loading}
              className="h-11 sm:h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-base font-medium">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={loading}
            >
              <SelectTrigger className="h-11 sm:h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Aberta</SelectItem>
                <SelectItem value="dispatched">Despachada</SelectItem>
                <SelectItem value="resolved">Resolvida</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              disabled={loading}
              className="w-full sm:w-auto order-1 sm:order-2 bg-orange-500 hover:bg-orange-600 min-h-[44px] text-base font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

