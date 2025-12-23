"use client"

import { useState, useEffect } from "react"

import { FileText, ChevronRight, Download, Filter, Calendar, DollarSign, Route, Users, Truck } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"

interface ReportCategory {
    id: string
    name: string
    icon: React.ReactNode
    count: number
    subcategories: { name: string; value: number; trend?: number }[]
}

export default function DrilldownRelatoriosPage() {
    const { user } = useAuth()
    const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null)
    const [period, setPeriod] = useState("month")

    const categories: ReportCategory[] = [
        {
            id: 'financial',
            name: 'Financeiro',
            icon: <DollarSign className="h-5 w-5" />,
            count: 156,
            subcategories: [
                { name: 'Custos Operacionais', value: 45200, trend: -2.3 },
                { name: 'Receitas', value: 78500, trend: 5.1 },
                { name: 'Margem Bruta', value: 33300, trend: 8.2 },
                { name: 'Custos por KM', value: 2.45, trend: -1.5 },
            ]
        },
        {
            id: 'routes',
            name: 'Rotas',
            icon: <Route className="h-5 w-5" />,
            count: 89,
            subcategories: [
                { name: 'Rotas Ativas', value: 24 },
                { name: 'Viagens Realizadas', value: 1847, trend: 3.2 },
                { name: 'Taxa de Ocupação', value: 78, trend: 2.1 },
                { name: 'KM Total', value: 18450, trend: 4.5 },
            ]
        },
        {
            id: 'passengers',
            name: 'Passageiros',
            icon: <Users className="h-5 w-5" />,
            count: 234,
            subcategories: [
                { name: 'Total Ativos', value: 342 },
                { name: 'No-shows', value: 23, trend: -12 },
                { name: 'Cancelamentos', value: 45, trend: -5 },
                { name: 'NPS Score', value: 72, trend: 3 },
            ]
        },
        {
            id: 'fleet',
            name: 'Frota',
            icon: <Truck className="h-5 w-5" />,
            count: 45,
            subcategories: [
                { name: 'Veículos Ativos', value: 12 },
                { name: 'Manutenções Realizadas', value: 8 },
                { name: 'Custo Manutenção', value: 4500, trend: -8 },
                { name: 'Disponibilidade', value: 95, trend: 1.2 },
            ]
        },
    ]

    const formatValue = (value: number, name: string) => {
        if (name.includes('Custo') || name.includes('Receita') || name.includes('Margem')) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
        }
        if (name.includes('Taxa') || name.includes('Disponibilidade') || name.includes('NPS')) {
            return `${value}%`
        }
        return new Intl.NumberFormat('pt-BR').format(value)
    }

    return (
        <AppShell panel="admin" user={user ? { id: user.id, name: user.name || 'Admin', email: user.email || '', role: user.role || 'admin' } : { id: 'mock', name: 'Admin', email: 'admin@golffox.com', role: 'admin' }}>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                            <FileText className="h-7 w-7 text-primary" />
                            Relatórios Detalhados
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Drill-down em métricas e indicadores
                        </p>
                    </div>
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Esta Semana</SelectItem>
                            <SelectItem value="month">Este Mês</SelectItem>
                            <SelectItem value="quarter">Este Trimestre</SelectItem>
                            <SelectItem value="year">Este Ano</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Category Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categories.map(cat => (
                        <Card
                            key={cat.id}
                            className="cursor-pointer hover:shadow-md transition-all hover:border-primary"
                            onClick={() => setSelectedCategory(cat)}
                        >
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            {cat.icon}
                                        </div>
                                        <div>
                                            <p className="font-medium">{cat.name}</p>
                                            <p className="text-sm text-muted-foreground">{cat.count} registros</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Drill-down Dialog */}
                <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {selectedCategory?.icon}
                                {selectedCategory?.name} - Detalhamento
                            </DialogTitle>
                        </DialogHeader>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Métrica</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    <TableHead className="text-right">Tendência</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedCategory?.subcategories.map((sub, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{sub.name}</TableCell>
                                        <TableCell className="text-right">{formatValue(sub.value, sub.name)}</TableCell>
                                        <TableCell className="text-right">
                                            {sub.trend !== undefined && (
                                                <Badge variant={sub.trend >= 0 ? "default" : "destructive"}>
                                                    {sub.trend >= 0 ? '↑' : '↓'} {Math.abs(sub.trend)}%
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => setSelectedCategory(null)}>Fechar</Button>
                            <Button>
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppShell>
    )
}
