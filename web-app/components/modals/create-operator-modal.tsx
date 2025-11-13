"use client"

import { useState } from "react"
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
import { Briefcase, UserPlus, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { globalSyncManager } from "@/lib/global-sync"

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
        notifyError(new Error('Nome da empresa é obrigatório'), 'Nome da empresa é obrigatório')
        setLoading(false)
        return
      }
      if (!formData.operatorEmail.trim() || !validateEmail(formData.operatorEmail)) {
        notifyError(new Error('Email válido é obrigatório'), 'Email válido é obrigatório')
        setLoading(false)
        return
      }

      // Usar API route para criar operador
      setProgress("Criando operador...")
      setStep(2)

      // Tentar obter token de autenticação de múltiplas fontes
      let authToken: string | null = null
      
      // 1. Tentar obter da sessão do Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          authToken = session.access_token
        }
      } catch (error) {
        console.warn('Erro ao obter sessão do Supabase:', error)
      }

      // 2. Se não houver sessão do Supabase, tentar ler do cookie golffox-session
      if (!authToken && typeof document !== 'undefined') {
        try {
          const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
          if (cookieMatch) {
            const decoded = atob(cookieMatch[1])
            const userData = JSON.parse(decoded)
            if (userData?.accessToken) {
              authToken = userData.accessToken
            }
          }
        } catch (error) {
          console.warn('Erro ao ler cookie golffox-session:', error)
        }
      }

      // 3. Em desenvolvimento, permitir continuar sem token (a API permite)
      // Em Next.js, NODE_ENV está disponível no cliente
      const isDevelopment = typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      } else if (!isDevelopment) {
        // Em produção, bloquear se não houver token
        notifyError(new Error('Usuário não autenticado'), 'Usuário não autenticado. Faça login novamente.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/create-operator', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          companyName: formData.companyName,
          operatorEmail: formData.operatorEmail,
          operatorPhone: formData.operatorPhone,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        const errorMessage = errorData.error || errorData.message || 'Erro ao criar operador'
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // Verificar se a resposta tem os campos esperados
      if (!result.companyId || (!result.userId && !result.operatorId)) {
        throw new Error('Resposta inválida da API')
      }
      
      // Normalizar campos da resposta
      const operatorId = result.userId || result.operatorId

      // NOTA: A API já cria o usuário e empresa usando service role (bypass RLS)
      // Não é necessário fazer sincronização adicional aqui, pois causaria erro de RLS
      // A sincronização é apenas para casos onde a API não foi usada

      // Sucesso
      setStep(7)
      const successMessage = result.tempPassword 
        ? `Operador criado com sucesso! Senha temporária: ${result.tempPassword}`
        : 'Operador criado com sucesso!'
      notifySuccess(successMessage)

      // Notificar sincronização global
      if (result.company) {
        globalSyncManager.triggerSync('company.created', result.company)
      }
      if (result.operator || result.userId) {
        globalSyncManager.triggerSync('user.created', {
          id: result.userId || result.operatorId,
          email: formData.operatorEmail,
          role: 'operator',
          company_id: result.companyId
        })
      }

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
          <DialogDescription>
            Crie uma nova empresa e operador. Uma senha temporária será gerada automaticamente.
          </DialogDescription>
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

