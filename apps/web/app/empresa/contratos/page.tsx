"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ContractsList } from "@/components/contracts/contracts-list"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import { useOperatorTenant } from "@/components/providers/empresa-tenant-provider"

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
            <div className="container mx-auto py-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Contratos</h1>
                    <p className="text-muted-foreground">Gerencie seus contratos e assinaturas</p>
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
