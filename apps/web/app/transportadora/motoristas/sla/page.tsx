"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { Gauge, Clock, AlertTriangle, CheckCircle, TrendingUp, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface DriverSLA {
    id: string
    name: string
    on_time_rate: number
    incidents: number
    trips_completed: number
    avg_delay_minutes: number
    sla_status: 'green' | 'yellow' | 'red'
}

export default function SLAMotoristaPage() {
    const { user } = useAuth()
    const [drivers, setDrivers] = useState<DriverSLA[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mock data
        const mockDrivers: DriverSLA[] = [
            { id: '1', name: 'João Silva', on_time_rate: 98, incidents: 0, trips_completed: 45, avg_delay_minutes: 1.2, sla_status: 'green' },
            { id: '2', name: 'Maria Santos', on_time_rate: 95, incidents: 1, trips_completed: 42, avg_delay_minutes: 2.5, sla_status: 'green' },
            { id: '3', name: 'Pedro Costa', on_time_rate: 88, incidents: 2, trips_completed: 38, avg_delay_minutes: 5.3, sla_status: 'yellow' },
            { id: '4', name: 'Ana Oliveira', on_time_rate: 92, incidents: 1, trips_completed: 40, avg_delay_minutes: 3.1, sla_status: 'green' },
            { id: '5', name: 'Carlos Lima', on_time_rate: 78, incidents: 4, trips_completed: 35, avg_delay_minutes: 8.7, sla_status: 'red' },
        ]
        setDrivers(mockDrivers)
        setLoading(false)
    }, [])

    const avgOnTimeRate = drivers.length > 0
        ? drivers.reduce((sum, d) => sum + d.on_time_rate, 0) / drivers.length
        : 0

    const getStatusBadge = (status: 'green' | 'yellow' | 'red') => {
        switch (status) {
            case 'green': return <Badge className="bg-green-500">Dentro do SLA</Badge>
            case 'yellow': return <Badge className="bg-yellow-500">Atenção</Badge>
            case 'red': return <Badge variant="destructive">Crítico</Badge>
        }
    }

    return (
        <AppShell panel="transportadora" user={user ? { id: user.id, name: user.name || 'Operador', email: user.email || '', role: user.role || 'operador' } : { id: 'mock', name: 'Operador', email: 'operador@golffox.com', role: 'operador' }}>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Gauge className="h-7 w-7 text-primary" />
                        SLA de Motoristas
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Monitoramento de performance e cumprimento de SLA
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Taxa Média de Pontualidade</p>
                                    <p className="text-2xl font-bold">{avgOnTimeRate.toFixed(1)}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Motoristas em Alerta</p>
                                    <p className="text-2xl font-bold">{drivers.filter(d => d.sla_status !== 'green').length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Users className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Total de Motoristas</p>
                                    <p className="text-2xl font-bold">{drivers.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* motorista List */}
                <div className="space-y-3">
                    {drivers.map(driver => (
                        <Card key={driver.id}>
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{motorista.name}</p>
                                            <p className="text-sm text-muted-foreground">{motorista.trips_completed} viagens</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 max-w-xs">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm">Pontualidade</span>
                                            <span className="text-sm font-medium">{motorista.on_time_rate}%</span>
                                        </div>
                                        <Progress value={motorista.on_time_rate} className="h-2" />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Atraso Médio</p>
                                            <p className="font-medium">{motorista.avg_delay_minutes.toFixed(1)} min</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Incidentes</p>
                                            <p className="font-medium">{motorista.incidents}</p>
                                        </div>
                                        {getStatusBadge(driver.sla_status)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppShell>
    )
}
