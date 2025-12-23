"use client"

import { useEffect, useState } from "react"

import { Loader2 } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { FinancialDashboardExpanded } from "@/components/costs/financial-dashboard-expanded"
import { useAuth } from "@/hooks/use-auth"

export default function CustosTransportadoraPage() {
  const { user, loading: isLoading } = useAuth()

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
        name: user?.name || "Gestor da Transportadora",
        email: user?.email || "",
        role: user?.role || "gestor_transportadora",
        avatar_url: user?.avatar_url
      }}
    >
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        <FinancialDashboardExpanded
          profileType="gestor_transportadora"
        />
      </div>
    </AppShell>
  )
}
