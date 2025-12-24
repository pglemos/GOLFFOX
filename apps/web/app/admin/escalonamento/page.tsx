"use client"

import { useState, useEffect } from "react"

import { motion } from "framer-motion"
import { AlertTriangle, ArrowUp, Clock, CheckCircle } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { notifySuccess, notifyError } from "@/lib/toast"
import { getSupabaseClient } from "@/lib/supabase-client"

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

    const loadAlerts = async () => {
        try {
            setLoading(true)
            
            // Primeiro, tenta carregar do localStorage
            const storedAlerts = localStorage.getItem('escalated_alerts')
            if (storedAlerts) {
                const parsedAlerts = JSON.parse(storedAlerts)
                setAlerts(parsedAlerts)
                setLoading(false)
                return
            }

            // Se não houver dados salvos, inicializa com os dados mockados
            const mockAlerts: EscalatedAlert[] = [
                { id: '1', type: 'sla_violation', title: 'Violação de SLA - Rota Centro', message: 'Motorista com 3 atrasos consecutivos esta semana.', severity: 'high', source: 'transportadora', source_name: 'TransLog LTDA', created_at: '2024-12-12T08:00:00', status: 'pending' },
                { id: '2', type: 'document_expired', title: 'CNH Vencida - João Silva', message: 'CNH venceu há 5 dias sem atualização.', severity: 'critical', source: 'transportadora', source_name: 'RápidoTrans', created_at: '2024-12-11T14:30:00', status: 'pending' },
                { id: '3', type: 'maintenance_overdue', title: 'Manutenção Atrasada - Veículo ABC-1234', message: 'Manutenção preventiva atrasada em 15 dias.', severity: 'medium', source: 'transportadora', source_name: 'TransLog LTDA', created_at: '2024-12-10T10:00:00', status: 'in_progress' },
                { id: '4', type: 'complaint', title: 'Reclamação Grave - Empresa XYZ', message: 'Cliente reportou comportamento inadequado do motorista.', severity: 'high', source: 'empresa', source_name: 'Empresa XYZ', created_at: '2024-12-09T16:45:00', status: 'pending' },
            ]
            setAlerts(mockAlerts)
            // Salva os dados iniciais no localStorage
            localStorage.setItem('escalated_alerts', JSON.stringify(mockAlerts))
        } catch (error) {
            console.error('Erro ao carregar alertas:', error)
            notifyError('Erro ao carregar alertas')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAlerts()
    }, [])

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical': return <Badge variant="destructive">Crítico</Badge>
            case 'high': return <Badge variant="gradient">Alto</Badge>
            case 'medium': return <Badge variant="warning">Médio</Badge>
            default: return <Badge variant="secondary">Baixo</Badge>
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="outline">Pendente</Badge>
            case 'in_progress': return <Badge variant="info">Em Andamento</Badge>
            case 'resolved': return <Badge variant="success">Resolvido</Badge>
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

    // Considera pendentes: 'pending' e 'in_progress'
    const pendingCount = alerts.filter(a => a.status === 'pending' || a.status === 'in_progress').length
    const criticalCount = alerts.filter(a => a.severity === 'critical' && (a.status === 'pending' || a.status === 'in_progress')).length

    return (
        <AppShell panel="admin" user={user ? { id: user.id, name: user.name || 'Admin', email: user.email || '', role: user.role || 'admin' } : { id: 'mock', name: 'Admin', email: 'admin@golffox.com', role: 'admin' }}>
            <div
                className="w-full max-w-full overflow-x-hidden min-w-0 box-border"
                style={{
                    backgroundImage: 'none',
                    background: 'var(--bg)'
                } as React.CSSProperties}
            >
                <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-bold break-words">Escalonamento para Admin</h1>
                                {!loading && alerts.length > 0 && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-semibold bg-text-brand/10 text-brand whitespace-nowrap">
                                        {alerts.length}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm sm:text-base text-muted-foreground break-words">
                                Alertas escalados de transportadoras e empresas
                            </p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        <Card variant="premium" className={criticalCount > 0 ? "border-error" : ""}>
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className={`h-8 w-8 flex-shrink-0 ${criticalCount > 0 ? 'text-error' : 'text-muted-foreground'}`} />
                                    <div className="min-w-0">
                                        <p className="text-2xl font-bold break-words">{criticalCount}</p>
                                        <p className="text-sm text-muted-foreground break-words">Críticos Pendentes</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card variant="premium">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-8 w-8 flex-shrink-0 text-warning" />
                                    <div className="min-w-0">
                                        <p className="text-2xl font-bold break-words">{pendingCount}</p>
                                        <p className="text-sm text-muted-foreground break-words">Total Pendentes</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card variant="premium">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-8 w-8 flex-shrink-0 text-success" />
                                    <div className="min-w-0">
                                        <p className="text-2xl font-bold break-words">{alerts.filter(a => a.status === 'resolved').length}</p>
                                        <p className="text-sm text-muted-foreground break-words">Resolvidos</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 gap-3 w-full">
                            <div className="w-8 h-8 border-4 border-text-brand border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                            <span className="text-xs sm:text-sm md:text-base text-ink-muted text-center break-words">Carregando alertas...</span>
                        </div>
                    )}

                    {/* Alerts List */}
                    {!loading && alerts.length > 0 && (
                        <div className="grid gap-3 sm:gap-4 w-full">
                            {alerts.map((alert, index) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <Card 
                                        variant="premium"
                                        className={`p-3 sm:p-4 group ${alert.severity === 'critical' && (alert.status === 'pending' || alert.status === 'in_progress') ? 'border-error' : ''}`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    {getSeverityBadge(alert.severity)}
                                                    {getStatusBadge(alert.status)}
                                                    <Badge variant="outline" className="break-words">{alert.source_name}</Badge>
                                                </div>
                                                <h3 className="font-bold text-base sm:text-lg group-hover:text-brand transition-colors mb-1 break-words">
                                                    {alert.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-1 break-words">
                                                    {alert.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground break-words">
                                                    {new Date(alert.created_at).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                            {(alert.status === 'pending' || alert.status === 'in_progress') && (
                                                <Button 
                                                    onClick={() => setSelectedAlert(alert)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="min-h-[44px] touch-manipulation whitespace-nowrap flex-shrink-0"
                                                >
                                                    Resolver
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && alerts.length === 0 && (
                        <Card variant="premium" className="p-4 sm:p-6 md:p-8 text-center w-full max-w-full overflow-hidden">
                            <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-ink-muted mx-auto mb-3 sm:mb-4 flex-shrink-0" />
                            <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 break-words px-2">
                                Nenhum alerta escalado
                            </h3>
                            <p className="text-xs sm:text-sm md:text-base text-ink-muted mb-4 break-words px-2">
                                Não há alertas escalados no momento.
                            </p>
                        </Card>
                    )}
                </div>

                {/* Resolution Dialog */}
                <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
                    <DialogContent className="max-w-full sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="break-words">Resolver Alerta</DialogTitle>
                            <DialogDescription className="break-words">{selectedAlert?.title}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label className="break-words">Descrição da Resolução</Label>
                                <Textarea
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    placeholder="Descreva as ações tomadas para resolver este alerta..."
                                    rows={4}
                                    className="resize-none break-words"
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setSelectedAlert(null)}
                                className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleResolve}
                                className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                            >
                                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="break-words">Marcar como Resolvido</span>
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppShell>
    )
}
