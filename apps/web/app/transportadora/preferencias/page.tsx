"use client"

import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useAuthFast } from "@/hooks/use-auth-fast"

export default function PreferenciasCarrierPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthFast()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--ink-muted)]">Carregando informações do usuário...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Transportadora", email: user.email, role: user.role || "transportadora" }} panel="transportadora">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Preferências</h1>
            <p className="text-sm sm:text-base text-[var(--ink-muted)]">Configurações da transportadora</p>
          </div>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" /> 
            Salvar
          </Button>
        </div>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Informações da Transportadora</h2>
          <p className="text-sm sm:text-base text-[var(--ink-muted)]">
            As configurações de preferências da transportadora estarão disponíveis em breve.
          </p>
        </Card>
      </div>
    </AppShell>
  )
}

