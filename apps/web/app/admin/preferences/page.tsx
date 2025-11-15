"use client"

import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function AdminPreferencesPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (!user) {
    return null // useAuth já redireciona
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin" }}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-[var(--brand)]" />
          <h1 className="text-3xl font-bold">Preferências</h1>
        </div>
        <p className="text-[var(--ink-muted)]">Configurações pessoais e preferências do painel admin.</p>

        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Tema</h2>
            <p className="text-sm text-[var(--ink-muted)]">Ajuste o tema e aparência da interface.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Claro</Button>
            <Button variant="outline">Escuro</Button>
            <Button variant="default">Automático</Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Notificações</h2>
            <p className="text-sm text-[var(--ink-muted)]">Habilite alertas críticos e emails de sistema.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Silenciar</Button>
            <Button variant="default">Habilitar</Button>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

