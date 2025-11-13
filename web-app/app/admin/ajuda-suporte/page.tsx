"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageCircle, ExternalLink, CheckCircle } from "lucide-react"
import { useAuthFast } from "@/hooks/use-auth-fast"

export default function AjudaSuportePage() {
  const { user, loading } = useAuthFast()
  const [statusSistema] = useState({ status: 'online', timestamp: new Date() })

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  if (!user) {
    return null // useAuthFast já cuida do redirecionamento
  }

  return (
    <AppShell user={{ id: user.id || "", name: user.name || "Admin", email: user.email || "", role: user.role || "admin" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ajuda & Suporte</h1>
          <p className="text-[var(--muted)]">Central de ajuda e recursos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <HelpCircle className="h-8 w-8 text-[var(--brand)] mb-4" />
            <h3 className="font-bold text-lg mb-2">FAQ</h3>
            <p className="text-sm text-[var(--muted)] mb-4">Perguntas frequentes sobre o sistema</p>
            <Button variant="outline" size="sm">
              Ver FAQ
            </Button>
          </Card>

          <Card className="p-6">
            <MessageCircle className="h-8 w-8 text-[var(--brand)] mb-4" />
            <h3 className="font-bold text-lg mb-2">Contato WhatsApp</h3>
            <p className="text-sm text-[var(--muted)] mb-4">Fale com nosso suporte</p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://wa.me/5531999999999" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir WhatsApp
              </a>
            </Button>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className={`h-6 w-6 ${statusSistema.status === 'online' ? 'text-[var(--ok)]' : 'text-[var(--err)]'}`} />
            <h3 className="font-bold text-lg">Status do Sistema</h3>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Status: <span className="font-medium text-[var(--ok)]">Online</span>
          </p>
          <p className="text-xs text-[var(--muted)] mt-2">
            Última verificação: {statusSistema.timestamp.toLocaleString()}
          </p>
        </Card>
      </div>
    </AppShell>
  )
}

