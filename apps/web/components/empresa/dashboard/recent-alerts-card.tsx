"use client"

import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AlertTriangle, Clock, MapPin, CheckCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "@/lib/next-navigation"
import { supabase } from "@/lib/supabase"

interface RecentAlertsCardProps {
    companyId: string
}

export function RecentAlertsCard({ companyId }: RecentAlertsCardProps) {
    const router = useRouter()

    const { data: alerts = [], isLoading } = useQuery({
        queryKey: ['empresa-recent-alerts', companyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('gf_alerts')
                .select('id, message, title, alert_type, type, severity, is_resolved, empresa_id, company_id, metadata, created_at')
                .eq('company_id', companyId)
                .eq('is_resolved', false) // Apenas não resolvidos
                .order('created_at', { ascending: false })
                .limit(5)

            if (error) throw error
            return data
        },
        enabled: !!companyId,
        refetchInterval: 30000
    })

    return (
        <Card className="h-full bg-white/50 backdrop-blur-sm border-brand-light/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-ink-strong flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-brand" />
                    Alertas Recentes
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push('/empresa/alertas')} className="text-xs">
                    Ver todos
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />)}
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mb-2 text-success opacity-50" />
                        <p className="text-sm">Tudo operando normalmente</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((alert: GfAlertsRow) => (
                            <div key={alert.id} className="p-3 bg-white rounded-lg border border-bg-soft shadow-sm flex items-start gap-3">
                                <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${alert.severity === 'critical' ? 'bg-error-light text-error' :
                                        alert.severity === 'warning' ? 'bg-brand-light text-brand' : 'bg-info-light text-info'
                                    }`}>
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-ink-strong truncate pr-2" title={alert.message}>
                                        {alert.message}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                        {alert.metadata?.route_name && (
                                            <span className="flex items-center gap-1 truncate max-w-[120px]">
                                                <MapPin className="h-3 w-3" />
                                                {alert.metadata.route_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
