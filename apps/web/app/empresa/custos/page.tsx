"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { FinancialDashboardExpanded } from "@/components/costs/financial-dashboard-expanded"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function CustosEmpresaPage() {
  const { user, isLoading } = useAuth()
  // No contexto da Empresa, o companyId é obtido via token no backend/API
  // Mas podemos passar se tivermos disponível no perfil
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    // Busca perfil para garantir que temos os dados
    // A lógica real de autenticação e tenant está no AppShell e API
  }, [])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <AppShell
      user={{
        id: user?.id || "",
        name: user?.name || "Empresa",
        email: user?.email || "",
        role: "empresa",
        avatar_url: user?.avatar_url
      }}
    >
      <div className="container mx-auto py-6 space-y-6">
        <FinancialDashboardExpanded
          profileType="empresa"
        />
      </div>
    </AppShell>
  )
}
