"use client"

import { useState } from "react"
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
import { Briefcase, UserPlus, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { useSupabaseSync } from "@/hooks/use-supabase-sync"

interface CreateOperatorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function CreateOperatorModal({
  isOpen,
  onClose,
  onSave,
}: CreateOperatorModalProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    companyName: "",
    operatorEmail: "",
    operatorPhone: "",
  })
  const [progress, setProgress] = useState("")
  const { sync } = useSupabaseSync({ showToast: false })

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validações
      if (!formData.companyName.trim()) {
        notifyError('', undefined, { i18n: { ns: 'common', key: 'validation.companyNameRequired' } })
        return
      }
      if (!formData.operatorEmail.trim() || !validateEmail(formData.operatorEmail)) {
        notifyError('', undefined, { i18n: { ns: 'common', key: 'validation.validOperatorEmailRequired' } })
        return
      }

      // Usar API route para criar operador
      setProgress("Criando operador...")
      setStep(2)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        notifyError('', undefined, { i18n: { ns: 'common', key: 'errors.authRequired' } })
        return
      }

      const response = await fetch('/api/admin/create-operator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          operatorEmail: formData.operatorEmail,
          operatorPhone: formData.operatorPhone,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar operador')
      }

      const result = await response.json()

      // Sincronização com Supabase (garantia adicional)
      if (result.operatorId && result.companyId) {
        try {
          await sync({
            resourceType: 'operator',
            resourceId: result.operatorId,
            action: 'create',
            data: {
              email: formData.operatorEmail,
              name: formData.companyName,
              phone: formData.operatorPhone,
              role: 'operator',
              company_id: result.companyId,
            },
          })
        } catch (syncError) {
          console.error('Erro na sincronização (não crítico):', syncError)
          // Não bloquear o fluxo se sincronização falhar
        }
      }

      // Sincronizar empresa também
      if (result.companyId) {
        try {
          await sync({
            resourceType: 'company',
            resourceId: result.companyId,
            action: 'create',
            data: {
              name: formData.companyName,
              is_active: true,
            },
          })
        } catch (syncError) {
          console.error('Erro na sincronização da empresa (não crítico):', syncError)
        }
      }

      // Sucesso
      setStep(7)
      notifySuccess('', { i18n: { ns: 'operator', key: 'admin.operators.createSuccess', params: { tempPassword: result.tempPassword } }, duration: 10000 })

      // Reset form
      setFormData({
        companyName: "",
        operatorEmail: "",
        operatorPhone: "",
      })
      
      onSave()
      setTimeout(() => {
        onClose()
        setStep(1)
        setProgress("")
      }, 2000)
    } catch (error: any) {
      console.error("Erro ao criar operador:", error)
      notifyError(error, "Erro ao criar operador")
      setStep(1)
    } finally {
      setLoading(false)
      setProgress("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Criar Operador
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Progress Steps */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{progress}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[var(--brand)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 7) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Campos do Formulário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Nome da Empresa *
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Nome da empresa"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operatorEmail" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Email do Operador *
              </Label>
              <Input
                id="operatorEmail"
                type="email"
                value={formData.operatorEmail}
                onChange={(e) => setFormData({ ...formData, operatorEmail: e.target.value })}
                placeholder="operador@exemplo.com"
                required
                disabled={loading}
              />
              <p className="text-xs text-[var(--ink-muted)]">
                Uma senha temporária será gerada automaticamente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operatorPhone">Telefone do Operador (opcional)</Label>
              <Input
                id="operatorPhone"
                type="tel"
                value={formData.operatorPhone}
                onChange={(e) => setFormData({ ...formData, operatorPhone: e.target.value })}
                placeholder="(00) 00000-0000"
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Operador"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

