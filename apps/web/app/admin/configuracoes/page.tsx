"use client"

import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/components/providers/auth-provider"
import { SettingsForm } from "@/components/shared/settings-form"

export default function AdminSettingsPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <AppShell user={user}>
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground text-lg">
            Gerencie seu perfil e preferências do sistema GOLFFOX.
          </p>
        </div>
        <SettingsForm panel="admin" />
      </div>
    </AppShell>
  )
}
