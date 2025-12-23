"use client"

import { useEffect, useState } from "react"

import { Loader2 } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { ContractsList } from "@/components/contracts/contracts-list"
import { useOperatorTenant } from "@/components/providers/empresa-tenant-provider"
import { useAuth } from "@/hooks/use-auth"

export default function ContratosEmpresaPage() {
    const { user, loading: isLoading } = useAuth()
    const { tenantCompanyId } = useOperatorTenant()

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
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Contratos</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Gerencie seus contratos e assinaturas</p>
                    </div>
                </div>

                {tenantCompanyId ? (
                    <ContractsList companyId={tenantCompanyId} />
                ) : (
                    <p className="text-muted-foreground p-4">Carregando dados da empresa...</p>
                )}
            </div>
        </AppShell>
    )
}
