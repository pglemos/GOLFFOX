"use client"

import { useState, useEffect } from "react"

import { Activity, CheckCircle, XCircle, RefreshCw, Server, Database, Zap } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"

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
    const statusColor = health.status === 'ok' ? 'text-success' : health.status === 'error' ? 'text-error' : 'text-ink-light'

    return (
        <AppShell panel="admin" user={user ? { id: user.id, name: user.name || 'Admin', email: user.email || '', role: user.role || 'admin' } : { id: 'mock', name: 'Admin', email: 'admin@golffox.com', role: 'admin' }}>
            <div
                className="w-full max-w-full overflow-x-hidden min-w-0 box-border"
                style={{
                    backgroundImage: 'none',
                    background: 'var(--bg)'
                } as React.CSSProperties}
            >
                <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden pb-12 sm:pb-16">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-bold break-words">Monitoramento do Sistema</h1>
                            </div>
                            <p className="text-sm sm:text-base text-muted-foreground break-words">
                                Status de saúde e performance da plataforma
                            </p>
                        </div>
                        <Button 
                            onClick={checkHealth} 
                            disabled={isChecking} 
                            variant="outline" 
                            className="w-full sm:w-auto flex-shrink-0 min-h-[44px] touch-manipulation"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 flex-shrink-0 ${isChecking ? 'animate-spin' : ''}`} />
                            Verificar Agora
                        </Button>
                    </div>

                    {/* Main Status Card */}
                    <Card 
                        variant="premium" 
                        className={health.status === 'ok' ? 'border border-success' : health.status === 'error' ? 'border border-error' : ''}
                    >
                        <CardContent className="p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <StatusIcon className={`h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 ${statusColor}`} />
                                    <div className="min-w-0">
                                        <p className="text-xl sm:text-2xl font-bold break-words">
                                            {health.status === 'ok' ? 'Sistema Operacional' : health.status === 'error' ? 'Alerta de Sistema' : 'Verificando...'}
                                        </p>
                                        {health.version && (
                                            <p className="text-sm text-muted-foreground break-words">Versão: {health.version}</p>
                                        )}
                                        {health.timestamp && (
                                            <p className="text-xs text-muted-foreground break-words mt-1">
                                                Última verificação: {new Date(health.timestamp).toLocaleTimeString('pt-BR')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Services Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        {/* Database */}
                        <Card variant="premium">
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-5 w-5 flex-shrink-0 text-brand" />
                                        <h3 className="text-sm sm:text-base font-semibold break-words">Banco de Dados</h3>
                                    </div>
                                    <Badge variant={health.services?.database.status === 'healthy' ? 'success' : 'destructive'}>
                                        {health.services?.database.status || 'Desconhecido'}
                                    </Badge>
                                </div>
                                <p className="text-2xl font-bold break-words">{health.services?.database.latency || '--'}</p>
                                <p className="text-xs text-muted-foreground break-words">Latência de resposta</p>
                                {health.services?.database.error && (
                                    <p className="text-xs text-destructive mt-2 break-words">{health.services.database.error}</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* API Server */}
                        <Card variant="premium">
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Server className="h-5 w-5 flex-shrink-0 text-brand" />
                                        <h3 className="text-sm sm:text-base font-semibold break-words">Servidor API</h3>
                                    </div>
                                    <Badge variant={health.status === 'ok' ? 'success' : 'destructive'}>
                                        {health.status === 'ok' ? 'Online' : 'Offline'}
                                    </Badge>
                                </div>
                                <p className="text-2xl font-bold break-words">Next.js 16</p>
                                <p className="text-xs text-muted-foreground break-words">Vercel Edge</p>
                            </CardContent>
                        </Card>

                        {/* Realtime */}
                        <Card variant="premium">
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 flex-shrink-0 text-brand" />
                                        <h3 className="text-sm sm:text-base font-semibold break-words">Tempo Real</h3>
                                    </div>
                                    <Badge variant="outline">Supabase</Badge>
                                </div>
                                <p className="text-2xl font-bold break-words">Ativo</p>
                                <p className="text-xs text-muted-foreground break-words">WebSocket / Realtime</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Endpoints Info */}
                    <Card variant="premium">
                        <CardContent className="p-3">
                            <div className="mb-3">
                                <h3 className="text-lg font-semibold break-words mb-1">Endpoints de Integração</h3>
                                <p className="text-sm text-muted-foreground break-words">URLs disponíveis para integrações externas</p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-mono text-sm break-words">GET /api/health</p>
                                        <p className="text-xs text-muted-foreground break-words">Health Check do sistema</p>
                                    </div>
                                    <Badge variant="outline" className="flex-shrink-0">Público</Badge>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-mono text-sm break-words">POST /api/webhooks/incoming?source=...</p>
                                        <p className="text-xs text-muted-foreground break-words">Recebe notificações de sistemas externos</p>
                                    </div>
                                    <Badge variant="outline" className="flex-shrink-0">Público</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppShell>
    )
}
