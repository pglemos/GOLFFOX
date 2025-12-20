"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { AlertTriangle, ArrowUp, Users, Clock, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface EscalatedAlert {
    id: string
    type: string
    title: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    source: 'transportadora' | 'empresa'
    source_name: string
    created_at: string
    status: 'pending' | 'in_progress' | 'resolved' | 'dismissed'
}

export default function EscalonamentoPage() {
    const { user } = useAuth()
    const [alerts, setAlerts] = useState<EscalatedAlert[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedAlert, setSelectedAlert] = useState<EscalatedAlert | null>(null)
    const [resolution, setResolution] = useState("")

    useEffect(() => {
        // Mock escalated alerts
        const mockAlerts: EscalatedAlert[] = [
            { id: '1', type: 'sla_violation', title: 'Violação de SLA - Rota Centro', message: 'Motorista com 3 atrasos consecutivos esta semana.', severity: 'high', source: 'transportadora', source_name: 'TransLog LTDA', created_at: '2024-12-12T08:00:00', status: 'pending' },
            { id: '2', type: 'document_expired', title: 'CNH Vencida - João Silva', message: 'CNH venceu há 5 dias sem atualização.', severity: 'critical', source: 'transportadora', source_name: 'RápidoTrans', created_at: '2024-12-11T14:30:00', status: 'pending' },
            { id: '3', type: 'maintenance_overdue', title: 'Manutenção Atrasada - Veículo ABC-1234', message: 'Manutenção preventiva atrasada em 15 dias.', severity: 'medium', source: 'transportadora', source_name: 'TransLog LTDA', created_at: '2024-12-10T10:00:00', status: 'in_progress' },
            { id: '4', type: 'complaint', title: 'Reclamação Grave - Empresa XYZ', message: 'Cliente reportou comportamento inadequado do motorista.', severity: 'high', source: 'empresa', source_name: 'Empresa XYZ', created_at: '2024-12-09T16:45:00', status: 'pending' },
        ]
        setAlerts(mockAlerts)
        setLoading(false)
    }, [])

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical': return <Badge variant="destructive">Crítico</Badge>
            case 'high': return <Badge className="bg-brand">Alto</Badge>
            case 'medium': return <Badge className="bg-warning-light0">Médio</Badge>
            default: return <Badge variant="secondary">Baixo</Badge>
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="outline">Pendente</Badge>
            case 'in_progress': return <Badge className="bg-info-light0">Em Andamento</Badge>
            case 'resolved': return <Badge className="bg-success-light0">Resolvido</Badge>
            default: return <Badge variant="secondary">Dispensado</Badge>
        }
    }

    const handleResolve = async () => {
        if (!selectedAlert) return

        // In production: update in Supabase
        setAlerts(prev => prev.map(a =>
            a.id === selectedAlert.id ? { ...a, status: 'resolved' as const } : a
        ))
        notifySuccess('Alerta resolvido com sucesso!')
        setSelectedAlert(null)
        setResolution("")
    }

    const pendingCount = alerts.filter(a => a.status === 'pending').length
    const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'pending').length

    return (
        <AppShell panel="admin" user={user ? { id: user.id, name: user.name || 'Admin', email: user.email || '', role: user.role || 'admin' } : { id: 'mock', name: 'Admin', email: 'admin@golffox.com', role: 'admin' }}>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                            <ArrowUp className="h-7 w-7 text-brand" />
                            Escalonamento para Admin
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Alertas escalados de transportadoras e empresas
                        </p>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className={criticalCount > 0 ? "border-error bg-error-light" : ""}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className={`h-8 w-8 ${criticalCount > 0 ? 'text-error' : 'text-muted-foreground'}`} />
                                <div>
                                    <p className="text-2xl font-bold">{criticalCount}</p>
                                    <p className="text-sm text-muted-foreground">Críticos Pendentes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Clock className="h-8 w-8 text-warning" />
                                <div>
                                    <p className="text-2xl font-bold">{pendingCount}</p>
                                    <p className="text-sm text-muted-foreground">Total Pendentes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-8 w-8 text-success" />
                                <div>
                                    <p className="text-2xl font-bold">{alerts.filter(a => a.status === 'resolved').length}</p>
                                    <p className="text-sm text-muted-foreground">Resolvidos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Alerts List */}
                <div className="space-y-3">
                    {alerts.map(alert => (
                        <Card key={alert.id} className={alert.severity === 'critical' && alert.status === 'pending' ? 'border-error' : ''}>
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getSeverityBadge(alert.severity)}
                                            {getStatusBadge(alert.status)}
                                            <Badge variant="outline">{alert.source_name}</Badge>
                                        </div>
                                        <p className="font-medium">{alert.title}</p>
                                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(alert.created_at).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                    {alert.status === 'pending' && (
                                        <Button onClick={() => setSelectedAlert(alert)}>
                                            Resolver
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Resolution Dialog */}
                <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Resolver Alerta</DialogTitle>
                            <DialogDescription>{selectedAlert?.title}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Descrição da Resolução</Label>
                                <Textarea
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    placeholder="Descreva as ações tomadas para resolver este alerta..."
                                    rows={4}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedAlert(null)}>Cancelar</Button>
                            <Button onClick={handleResolve}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marcar como Resolvido
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppShell>
    )
}
