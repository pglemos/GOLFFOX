"use client"

// @ts-ignore
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
// @ts-ignore
import { Button } from "@/components/ui/button"
// @ts-ignore
import { Input } from "@/components/ui/input"
// @ts-ignore
import { Label } from "@/components/ui/label"
// @ts-ignore
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Users, Route, Clock } from "lucide-react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"
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
      toast.error("Preencha título e mensagem")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("gf_announcements")
        .insert({
          empresa_id: empresaId,
          title,
          message,
          target_group: target,
          created_by: empresaId
        })

      if (error) throw error

      toast.success("Broadcast enviado com sucesso!")
      onSave()
      onClose()
      setTitle("")
      setMessage("")
      setTarget("empresa")
    } catch (error: any) {
      console.error("Erro ao enviar broadcast:", error)
      toast.error(`Erro ao enviar broadcast: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Broadcast</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="target">Enviar Para</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger id="target">
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
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aviso de Alteração de Rota"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Mensagem</Label>
            <textarea
              id="message"
              className="min-h-[150px] rounded-md border border-[var(--border)] p-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Enviando..." : "Enviar Broadcast"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

