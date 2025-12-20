"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { formatError } from "@/lib/error-utils"
import { error as logError } from "@/lib/logger"
import { useState } from "react"

interface SolicitacaoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  empresaId: string
}

export function SolicitacaoModal({ isOpen, onClose, onSave, empresaId }: SolicitacaoModalProps) {
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<string>("")
  const [payload, setPayload] = useState<any>({})

  const tipos = [
    { value: "nova_rota", label: "Nova Rota" },
    { value: "alteracao", label: "Alteração de Rota" },
    { value: "reforco", label: "Reforço de Frota" },
    { value: "cancelamento", label: "Cancelamento Pontual" },
    { value: "socorro", label: "Socorro" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tipo) {
      notifyError("Selecione o tipo de solicitação")
      return
    }

    setLoading(true)
    try {
      // Chamar RPC para criar solicitação
      const { data, error } = await (supabase as any).rpc('rpc_request_service', {
        p_empresa: empresaId,
        p_tipo: tipo,
        p_payload: payload
      })

      if (error) throw error

      notifySuccess("Solicitação criada com sucesso!")
      onSave()
      onClose()
      // Reset form
      setTipo("")
      setPayload({})
    } catch (error: any) {
      logError("Erro ao criar solicitação", { error }, 'SolicitacaoModal')
      notifyError(formatError(error, "Erro ao criar solicitação"))
    } finally {
      setLoading(false)
    }
  }

  const handlePayloadChange = (key: string, value: any) => {
    setPayload((prev: any) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold">Criar Nova Solicitação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:gap-6 py-2 sm:py-4">
          <div className="grid gap-2">
            <Label htmlFor="tipo" className="text-base font-medium">Tipo de Solicitação</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo" className="h-11 sm:h-12 text-base">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipos.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tipo === "nova_rota" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="turno">Turno</Label>
                <Select value={payload.turno || ""} onValueChange={(v) => handlePayloadChange("turno", v)}>
                  <SelectTrigger id="turno">
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="janela">Janela de Horário</Label>
                <Input
                  id="janela"
                  placeholder="Ex: 06:00-08:00"
                  value={payload.janela || ""}
                  onChange={(e) => handlePayloadChange("janela", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="volume">Volume Estimado</Label>
                <Input
                  id="volume"
                  type="number"
                  placeholder="Ex: 42"
                  value={payload.volume_previsto || ""}
                  onChange={(e) => handlePayloadChange("volume_previsto", parseInt(e.target.value))}
                />
              </div>
            </>
          )}

          {tipo === "socorro" && (
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição do Problema</Label>
              <textarea
                id="descricao"
                className="min-h-[100px] rounded-md border border-border p-2"
                placeholder="Descreva a situação de socorro..."
                value={payload.descricao || ""}
                onChange={(e) => handlePayloadChange("descricao", e.target.value)}
              />
            </div>
          )}

          {tipo === "alteracao" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="route_id">ID da Rota</Label>
                <Input
                  id="route_id"
                  placeholder="UUID da rota"
                  value={payload.route_id || ""}
                  onChange={(e) => handlePayloadChange("route_id", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mudancas">Mudanças Solicitadas</Label>
                <textarea
                  id="mudancas"
                  className="min-h-[100px] rounded-md border border-border p-2"
                  placeholder="Descreva as alterações..."
                  value={payload.changes?.description || ""}
                  onChange={(e) => handlePayloadChange("changes", { description: e.target.value })}
                />
              </div>
            </>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1 min-h-[44px] text-base font-medium"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-brand hover:bg-orange-600 w-full sm:w-auto order-1 sm:order-2 min-h-[44px] text-base font-medium"
            >
              {loading ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

