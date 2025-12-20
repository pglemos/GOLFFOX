"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { DollarSign, Plus, ArrowUpRight, Search, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Revenue {
    id: string
    description: string
    amount: number
    type: 'repasse' | 'contrato' | 'extra'
    reference_month: string
    created_at: string
}

export default function ReceitasPage() {
    const { user } = useAuth()
    const [revenues, setRevenues] = useState<Revenue[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'repasse' as 'repasse' | 'contrato' | 'extra',
        reference_month: new Date().toISOString().slice(0, 7)
    })

    // Mock transportadora ID for now - in production, get from user profile
    const carrierId = user?.id || 'mock-transportadora'

    useEffect(() => {
        loadRevenues()
    }, [carrierId])

    const loadRevenues = async () => {
        if (!carrierId) return
        setLoading(true)
        try {
            const { data, error } = await (supabase as any)
                .from('gf_manual_revenues')
                .select('*')
                .eq('carrier_id', carrierId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setRevenues(data || [])
        } catch (err) {
            console.error('Erro ao carregar receitas:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!carrierId) return
        try {
            const { error } = await (supabase as any).from('gf_manual_revenues').insert({
                carrier_id: carrierId,
                description: formData.description,
                amount: parseFloat(formData.amount),
                type: formData.type,
                reference_month: formData.reference_month
            })

            if (error) throw error
            notifySuccess('Receita cadastrada com sucesso!')
            setDialogOpen(false)
            setFormData({ description: '', amount: '', type: 'repasse', reference_month: new Date().toISOString().slice(0, 7) })
            loadRevenues()
        } catch (err) {
            notifyError('Erro ao cadastrar receita')
            console.error(err)
        }
    }

    const filteredRevenues = revenues.filter(r =>
        r.description.toLowerCase().includes(search.toLowerCase())
    )

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0)

    const typeLabels = {
        repasse: 'Repasse',
        contrato: 'Contrato',
        extra: 'Extra'
    }

    return (
        <AppShell panel="transportadora" user={user ? { id: user.id, name: user.name || 'Operador', email: user.email || '', role: user.role || 'operador' } : { id: 'mock', name: 'Operador', email: 'operador@golffox.com', role: 'operador' }}>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                            <DollarSign className="h-7 w-7 text-green-600" />
                            Receitas e Repasses
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gerencie as receitas da transportadora
                        </p>
                    </div>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Receita
                    </Button>
                </div>

                {/* KPI */}
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <ArrowUpRight className="h-10 w-10 text-green-600" />
                            <div>
                                <p className="text-sm text-green-700">Total de Receitas</p>
                                <p className="text-3xl font-bold text-green-800">{formatCurrency(totalRevenue)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar receitas..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* List */}
                <div className="space-y-3">
                    {loading ? (
                        <p className="text-center text-muted-foreground py-8">Carregando...</p>
                    ) : filteredRevenues.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Nenhuma receita cadastrada.</p>
                    ) : (
                        filteredRevenues.map(r => (
                            <Card key={r.id}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="font-medium">{r.description}</p>
                                        <p className="text-sm text-muted-foreground">{r.reference_month}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline">{typeLabels[r.type]}</Badge>
                                        <p className="text-lg font-bold text-green-600">{formatCurrency(r.amount)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nova Receita</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Descrição</Label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ex: Repasse Contrato ABC"
                                />
                            </div>
                            <div>
                                <Label>Valor (R$)</Label>
                                <Input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <Label>Tipo</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as 'repasse' | 'contrato' | 'extra' })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="repasse">Repasse</SelectItem>
                                        <SelectItem value="contrato">Contrato</SelectItem>
                                        <SelectItem value="extra">Extra</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Mês de Referência</Label>
                                <Input
                                    type="month"
                                    value={formData.reference_month}
                                    onChange={(e) => setFormData({ ...formData, reference_month: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSubmit}>Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppShell>
    )
}
