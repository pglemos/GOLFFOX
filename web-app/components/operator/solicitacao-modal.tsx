"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"
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
      toast.error("Selecione o tipo de solicitação")
      return
    }

    setLoading(true)
    try {
      // Chamar RPC para criar solicitação
      const { data, error } = await supabase.rpc('rpc_request_service', {
        p_empresa: empresaId,
        p_tipo: tipo,
        p_payload: payload
      })

      if (error) throw error

      toast.success("Solicitação criada com sucesso!")
      onSave()
      onClose()
      // Reset form
      setTipo("")
      setPayload({})
    } catch (error: any) {
      logError("Erro ao criar solicitação", { error }, 'SolicitacaoModal')
      toast.error(`Erro ao criar solicitação: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePayloadChange = (key: string, value: any) => {
    setPayload((prev: any) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Solicitação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo de Solicitação</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo">
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
                className="min-h-[100px] rounded-md border border-[var(--border)] p-2"
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
                  className="min-h-[100px] rounded-md border border-[var(--border)] p-2"
                  placeholder="Descreva as alterações..."
                  value={payload.changes?.description || ""}
                  onChange={(e) => handlePayloadChange("changes", { description: e.target.value })}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
              {loading ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

