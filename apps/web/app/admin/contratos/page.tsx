"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, FileText, Search } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface Contract {
    id: string
    name: string
    value_amount: number
    status: string
    start_date: string
    end_date: string
    company_name?: string
}

export default function AdminContratosPage() {
    const { user } = useAuth()
    const [contracts, setContracts] = useState<Contract[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        async function loadContracts() {
            setLoading(true)
            try {
                const { data, error } = await (supabase as any)
                    .from('gf_contracts')
                    .select('id, name, value_amount, status, start_date, end_date, company_id')
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Error loading contracts:', error)
                    // Use mock data if table doesn't exist
                    setContracts([
                        { id: '1', name: 'Contrato Empresa ABC', value_amount: 15000, status: 'active', start_date: '2024-01-01', end_date: '2024-12-31', company_name: 'Empresa ABC' },
                        { id: '2', name: 'Contrato XYZ Corp', value_amount: 25000, status: 'active', start_date: '2024-03-01', end_date: '2025-02-28', company_name: 'XYZ Corp' },
                        { id: '3', name: 'Contrato Tech Ltd', value_amount: 8500, status: 'pending', start_date: '2024-06-01', end_date: '2025-05-31', company_name: 'Tech Ltd' },
                    ])
                } else {
                    setContracts((data || []).map((c: any) => ({ ...c, company_name: 'Empresa' })))
                }
            } catch (err) {
                console.error('Error:', err)
                setContracts([])
            } finally {
                setLoading(false)
            }
        }
        loadContracts()
    }, [])

    const filteredContracts = contracts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    )

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-success-light0">Ativo</Badge>
            case 'pending': return <Badge className="bg-warning-light0">Pendente</Badge>
            case 'expired': return <Badge variant="destructive">Expirado</Badge>
            default: return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <AppShell panel="admin" user={user ? { id: user.id, name: user.name || "Admin", email: user.email || '', role: user.role || "admin" } : { id: 'mock', name: 'Admin', email: 'admin@golffox.com', role: 'admin' }}>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                            <FileText className="h-7 w-7 text-primary" />
                            Gestão de Contratos
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Visão geral de contratos ativos e históricos
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar contratos..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Contracts List */}
                {loading ? (
                    <p className="text-center text-muted-foreground py-8">Carregando...</p>
                ) : filteredContracts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum contrato encontrado.</p>
                ) : (
                    <div className="grid gap-4">
                        {filteredContracts.map(contract => (
                            <Card key={contract.id}>
                                <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <p className="font-medium">{contract.name}</p>
                                            <p className="text-sm text-muted-foreground">{contract.company_name}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                                                <p className="font-bold text-success">{formatCurrency(contract.value_amount)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground">Período</p>
                                                <p className="text-sm">
                                                    {new Date(contract.start_date).toLocaleDateString('pt-BR')} - {new Date(contract.end_date).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            {getStatusBadge(contract.status)}
                                            <Button variant="ghost" size="sm">
                                                <Eye className="h-4 w-4 mr-2" />
                                                Detalhes
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    )
}
