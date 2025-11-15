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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            Editar Ocorrência
          </DialogTitle>
          <DialogDescription>
            Atualize os dados da ocorrência
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="request_type">Tipo de Solicitação *</Label>
            <Select
              value={formData.request_type}
              onValueChange={(value) => setFormData({ ...formData, request_type: value })}
              disabled={loading}
            >
              <SelectTrigger>
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
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da ocorrência"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Endereço da ocorrência"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={loading}
            >
              <SelectTrigger>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

