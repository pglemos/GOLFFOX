"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/kpi-utils"
import { FileText, Calendar, AlertTriangle, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { SkeletonList } from "@/components/ui/skeleton"

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
                    .select('*')
                    .eq('company_id', companyId)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setContracts(data as Contract[])
            } catch (error) {
                console.error('Erro ao carregar contratos:', error)
            } finally {
                setLoading(false)
            }
        }

        if (companyId) loadContracts()
    }, [companyId])

    if (loading) return <SkeletonList count={3} />

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Contratos Vigentes</h3>
                <Button variant="outline" size="sm" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Contrato (Admin)
                </Button>
            </div>

            {contracts.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-50" />
                        <p>Nenhum contrato encontrado</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {contracts.map(contract => (
                        <Card key={contract.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {contract.name}
                                </CardTitle>
                                <Badge
                                    variant={
                                        contract.status === 'active' ? 'default' :
                                            contract.status === 'expired' ? 'destructive' : 'secondary'
                                    }
                                >
                                    {contract.status === 'active' ? 'Ativo' :
                                        contract.status === 'expired' ? 'Expirado' :
                                            contract.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {contract.value_amount ? formatCurrency(contract.value_amount) : 'R$ -'}
                                </div>
                                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Início: {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                                    </div>
                                    {contract.end_date && (
                                        <div className="flex items-center gap-1 text-orange-600">
                                            <AlertTriangle className="h-3 w-3" />
                                            Fim: {new Date(contract.end_date).toLocaleDateString('pt-BR')}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
