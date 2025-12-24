"use client"

import { useState, useEffect } from "react"

import { ColumnDef } from "@tanstack/react-table"
import { FileText, Calendar, AlertTriangle, Plus } from "lucide-react"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DataTablePremium } from "@/components/ui/data-table-premium"
import { SkeletonList } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/kpi-utils"
import { supabase } from "@/lib/supabase"
import { logError } from "@/lib/logger"
import type { Database } from "@/types/supabase"

type GfContractsRow = Database['public']['Tables']['gf_contracts']['Row']

interface Contract {
    id: string
    name: string
    start_date: string
    end_date: string | null
    value_amount: number | null
    status: 'active' | 'expired' | 'pending' | 'cancelled'
    terms_url: string | null
}

interface ContractsListProps {
    companyId: string
}

export function ContractsList({ companyId }: ContractsListProps) {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadContracts = async () => {
            try {
                const { data, error } = await supabase
                    .from('gf_contracts')
                    .select('id, name, start_date, end_date, value_amount, status, terms_url, empresa_id, created_at, updated_at')
                    .eq('empresa_id', companyId)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setContracts((data || []) as Contract[])
            } catch (error) {
                logError('Erro ao carregar contratos', { error }, 'ContractsList')
            } finally {
                setLoading(false)
            }
        }

        if (companyId) loadContracts()
    }, [companyId])

    if (loading) return <SkeletonList count={3} />

    const columns: ColumnDef<Contract>[] = [
        {
            accessorKey: "name",
            header: "Nome do Contrato",
        },
        {
            accessorKey: "start_date",
            header: "Início",
            cell: ({ row }) => new Date(row.getValue("start_date")).toLocaleDateString('pt-BR'),
        },
        {
            accessorKey: "end_date",
            header: "Fim",
            cell: ({ row }) => {
                const date = row.getValue("end_date") as string
                return date ? new Date(date).toLocaleDateString('pt-BR') : '-'
            }
        },
        {
            accessorKey: "value_amount",
            header: "Valor",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("value_amount"))
                return isNaN(amount) ? '-' : formatCurrency(amount)
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge variant={status === 'active' ? 'default' : status === 'expired' ? 'destructive' : 'secondary'}>
                        {status === 'active' ? 'Ativo' : status === 'expired' ? 'Expirado' : status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </Badge>
                )
            }
        },
    ]

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Contratos Vigentes</h3>
                <Button variant="outline" size="sm" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Contrato (Admin)
                </Button>
            </div>

            <DataTablePremium
                columns={columns}
                data={contracts}
                searchKey="name"
                placeholder="Filtrar contratos..."
            />
        </div>
    )
}
