"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Users, Route, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { error as logError } from "@/lib/logger"
import { useState } from "react"

interface BroadcastModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  empresaId: string
}

export function BroadcastModal({ isOpen, onClose, onSave, empresaId }: BroadcastModalProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [target, setTarget] = useState<string>("empresa")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message) {
      notifyError('', undefined, { i18n: { ns: 'operador', key: 'broadcast.validation.titleMessageRequired' } })
      return
    }

    setLoading(true)
    try {
      const { error } = await (supabase as any)
        .from("gf_announcements")
        .insert({
          empresa_id: empresaId,
          title,
          message,
          target_group: target,
          created_by: empresaId
        })

      if (error) throw error

      notifySuccess('', { i18n: { ns: 'operador', key: 'broadcast.success.sent' } })
      onSave()
      onClose()
      setTitle("")
      setMessage("")
      setTarget("empresa")
    } catch (error: any) {
      logError("Erro ao enviar broadcast", { error }, 'BroadcastModal')
      notifyError(error, `Erro ao enviar broadcast: ${error.message}`, { i18n: { ns: 'operador', key: 'broadcast.errors.send', params: { message: error.message } } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold break-words">Novo Broadcast</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:gap-6 py-2 sm:py-4">
          <div className="grid gap-2">
            <Label htmlFor="target" className="text-base font-medium">Enviar Para</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger id="target" className="min-h-[48px] text-base">
                <SelectValue placeholder="Selecione o grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empresa">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Toda a Empresa</span>
                  </div>
                </SelectItem>
                <SelectItem value="rota">Rota Específica</SelectItem>
                <SelectItem value="turno">Por Turno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title" className="text-base font-medium">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aviso de Alteração de Rota"
              required
              className="text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message" className="text-base font-medium">Mensagem</Label>
            <textarea
              id="message"
              className="min-h-[150px] rounded-md border border-border p-2 sm:p-3 text-base"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              required
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1 text-base font-medium"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-brand hover:bg-brand-hover w-full sm:w-auto order-1 sm:order-2 text-base font-medium"
            >
              <Send className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">{loading ? "Enviando..." : "Enviar Broadcast"}</span>
              <span className="sm:hidden">{loading ? "Enviando..." : "Enviar"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

