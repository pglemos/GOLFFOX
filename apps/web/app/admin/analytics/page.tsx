"use client"

import { BarChart3, Construction } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/components/providers/auth-provider"
import { Card } from "@/components/ui/card"

export default function AnalyticsPage() {
    const { user, loading } = useAuth()

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-brand" />
                            Analytics
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Métricas e insights do sistema</p>
                    </div>
                </div>

                <Card variant="premium" className="p-8 sm:p-12 text-center">
                    <Construction className="h-16 w-16 mx-auto mb-4 text-brand opacity-50" />
                    <h2 className="text-xl font-semibold mb-2">Em Construção</h2>
                    <p className="text-ink-muted max-w-md mx-auto">
                        O painel de Analytics está sendo desenvolvido e estará disponível em breve.
                        Aqui você poderá visualizar métricas detalhadas de performance, tendências e insights do sistema.
                    </p>
                </Card>
            </div>
        </AppShell>
    )
}
