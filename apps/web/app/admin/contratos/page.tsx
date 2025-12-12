"use client"

import { AppShell } from "@/components/app-shell"
import { DataTablePremium } from "@/components/ui/data-table-premium"
import { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, FileText } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { useAuthFast } from "@/hooks/use-auth-fast"

const columns: ColumnDef<any>[] = [
    {
        accessorKey: "companies.name",
        header: "Empresa",
        cell: ({ row }) => row.original.companies?.name || '-',
    },
    {
        accessorKey: "name",
        header: "Contrato",
    },
    {
        accessorKey: "value_amount",
        header: "Valor Mensal",
        cell: ({ row }) => formatCurrency(row.getValue("value_amount") || 0),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                    {status === 'active' ? 'Ativo' : status}
                </Badge>
            )
        }
    },
    {
        accessorKey: "start_date",
        header: "Início",
        cell: ({ row }) => new Date(row.getValue("start_date")).toLocaleDateString('pt-BR'),
    },
    {
        accessorKey: "end_date",
        header: "Fim",
        cell: ({ row }) => new Date(row.getValue("end_date")).toLocaleDateString('pt-BR'),
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Detalhes
            </Button>
        )
    }
]

export default function AdminContratosPage() {
    const { user, loading } = useAuthFast()

    const { data: contracts = [], isLoading } = useQuery({
        queryKey: ['admin-contracts'],
        queryFn: async (): Promise<any[]> => {
            const { data, error } = await supabase
                .from('gf_contracts')
                .select(`
          *,
          companies (name)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        },
        enabled: !!user
    })

    return (
        <AppShell user={user ? { id: user.id, name: user.name || "Admin", email: user.email, role: "admin", avatar_url: user.avatar_url } : undefined}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Gestão de Contratos</h1>
                        <p className="text-[var(--ink-muted)]">Visão geral de contratos ativos e históricos</p>
                    </div>
                </div>

                <DataTablePremium
                    columns={columns}
                    data={contracts}
                    isLoading={isLoading || loading}
                    filterColumn="name"
                    searchPlaceholder="Buscar contratos..."
                />
            </div>
        </AppShell>
    )
}
