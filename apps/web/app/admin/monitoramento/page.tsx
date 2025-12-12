"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Activity, CheckCircle, XCircle, RefreshCw, Server, Database, Zap } from "lucide-react"

interface HealthStatus {
    status: 'ok' | 'error' | 'loading'
    timestamp?: string
    services?: {
        database: {
            status: string
            latency: string
            error?: string
        }
    }
    version?: string
}

export default function MonitoramentoPage() {
    const { user } = useAuth()
    const [health, setHealth] = useState<HealthStatus>({ status: 'loading' })
    const [isChecking, setIsChecking] = useState(false)

    const checkHealth = async () => {
        setIsChecking(true)
        try {
            const res = await fetch('/api/health')
            const data = await res.json()
            setHealth(data)
        } catch {
            setHealth({ status: 'error' })
        } finally {
            setIsChecking(false)
        }
    }

    useEffect(() => {
        checkHealth()
        const interval = setInterval(checkHealth, 60000) // Auto-refresh every minute
        return () => clearInterval(interval)
    }, [])

    const StatusIcon = health.status === 'ok' ? CheckCircle : health.status === 'error' ? XCircle : Activity
    const statusColor = health.status === 'ok' ? 'text-green-500' : health.status === 'error' ? 'text-red-500' : 'text-gray-400'

    return (
        <AppShell panel="admin" user={user ? { id: user.id, name: user.name || 'Admin', email: user.email || '', role: user.role || 'admin' } : { id: 'mock', name: 'Admin', email: 'admin@golffox.com', role: 'admin' }}>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                            <Activity className="h-7 w-7 text-primary" />
                            Monitoramento do Sistema
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Status de saúde e performance da plataforma
                        </p>
                    </div>
                    <Button onClick={checkHealth} disabled={isChecking} variant="outline">
                        <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                        Verificar Agora
                    </Button>
                </div>

                {/* Main Status Card */}
                <Card className="border-2" style={{ borderColor: health.status === 'ok' ? '#22C55E' : health.status === 'error' ? '#EF4444' : '#9CA3AF' }}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Status Geral</CardTitle>
                        {health.timestamp && (
                            <span className="text-xs text-muted-foreground">
                                Última verificação: {new Date(health.timestamp).toLocaleTimeString('pt-BR')}
                            </span>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <StatusIcon className={`h-16 w-16 ${statusColor}`} />
                            <div>
                                <p className="text-2xl font-bold">
                                    {health.status === 'ok' ? 'Sistema Operacional' : health.status === 'error' ? 'Alerta de Sistema' : 'Verificando...'}
                                </p>
                                {health.version && <p className="text-sm text-muted-foreground">Versão: {health.version}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Database */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Banco de Dados
                            </CardTitle>
                            <Badge variant={health.services?.database.status === 'healthy' ? 'default' : 'destructive'}>
                                {health.services?.database.status || 'Desconhecido'}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{health.services?.database.latency || '--'}</p>
                            <p className="text-xs text-muted-foreground">Latência de resposta</p>
                            {health.services?.database.error && (
                                <p className="text-xs text-destructive mt-2">{health.services.database.error}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* API Server */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                Servidor API
                            </CardTitle>
                            <Badge variant={health.status === 'ok' ? 'default' : 'destructive'}>
                                {health.status === 'ok' ? 'Online' : 'Offline'}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">Next.js 16</p>
                            <p className="text-xs text-muted-foreground">Vercel Edge</p>
                        </CardContent>
                    </Card>

                    {/* Realtime */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Tempo Real
                            </CardTitle>
                            <Badge variant="outline">Supabase</Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">Ativo</p>
                            <p className="text-xs text-muted-foreground">WebSocket / Realtime</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Endpoints Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Endpoints de Integração</CardTitle>
                        <CardDescription>URLs disponíveis para integrações externas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                            <div>
                                <p className="font-mono text-sm">GET /api/health</p>
                                <p className="text-xs text-muted-foreground">Health Check do sistema</p>
                            </div>
                            <Badge variant="outline">Público</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                            <div>
                                <p className="font-mono text-sm">POST /api/webhooks/incoming?source=...</p>
                                <p className="text-xs text-muted-foreground">Recebe notificações de sistemas externos</p>
                            </div>
                            <Badge variant="outline">Público</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    )
}
