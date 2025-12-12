"use client"

import { useOperatorTenant } from "@/components/providers/empresa-tenant-provider"
import { AppShell } from "@/components/app-shell"
import { CostCentersList } from "@/components/settings/cost-centers-list"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export default function CentrosCustoEmpresaPage() {
    const { user, isLoading } = useAuth()
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
                    <h1 className="text-3xl font-bold mb-2">Centros de Custo</h1>
                    <p className="text-muted-foreground">Gerencie os centros de custo para alocação de despesas</p>
                </div>

                {tenantCompanyId ? (
                    <CostCentersList companyId={tenantCompanyId} />
                ) : (
                    <p className="text-muted-foreground p-4">Carregando dados da empresa...</p>
                )}
            </div>
        </AppShell>
    )
}
