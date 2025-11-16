"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Calendar, FileText, Stethoscope, Truck, Clock, ExternalLink, Bell, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function CarrierAlertasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    warning: 0,
    expired: 0
  })
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadAlerts()
    }
    getUser()
  }, [router])

  const loadAlerts = async () => {
    try {
      const res = await fetch('/api/carrier/alerts?alert_level=critical,warning,expired')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
        setStats(data.stats || { total: 0, critical: 0, warning: 0, expired: 0 })
      }
    } catch (error) {
      console.error("Erro ao carregar alertas:", error)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const getAlertIcon = (itemType: string) => {
    switch (itemType) {
      case 'driver_document':
      case 'driver_exam':
        return <FileText className="h-5 w-5" />
      case 'vehicle_document':
        return <Truck className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  const getAlertTypeLabel = (itemType: string) => {
    switch (itemType) {
      case 'driver_document':
        return 'Documento do Motorista'
      case 'driver_exam':
        return 'Exame Médico'
      case 'vehicle_document':
        return 'Documento do Veículo'
      default:
        return 'Alerta'
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === 'all') return true
    if (activeTab === 'critical') return alert.alert_level === 'critical'
    if (activeTab === 'expired') return alert.alert_level === 'expired'
    if (activeTab === 'warning') return alert.alert_level === 'warning'
    return true
  })

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Transportadora", email: user?.email || "", role: "carrier" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Alertas de Vencimento</h1>
            <p className="text-[var(--ink-muted)]">Monitore documentos e exames próximos do vencimento</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Total de Alertas</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Bell className="h-8 w-8 text-[var(--brand)]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Críticos</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Vencidos</p>
                  <p className="text-2xl font-bold text-red-800">{stats.expired}</p>
                </div>
                <Clock className="h-8 w-8 text-red-800" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Atenção</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              Todos ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="critical">
              Críticos ({stats.critical})
            </TabsTrigger>
            <TabsTrigger value="expired">
              Vencidos ({stats.expired})
            </TabsTrigger>
            <TabsTrigger value="warning">
              Atenção ({stats.warning})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
                <p className="text-sm text-[var(--ink-muted)]">
                  Todos os documentos e exames estão em dia
                </p>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <Alert 
                  key={alert.id} 
                  variant={alert.alert_level === 'critical' || alert.alert_level === 'expired' ? 'destructive' : 'warning'}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5">
                      {getAlertIcon(alert.item_type)}
                    </div>
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        {getAlertTypeLabel(alert.item_type)}: {alert.entity_name}
                        <Badge variant={alert.alert_level === 'expired' ? 'destructive' : alert.alert_level === 'critical' ? 'destructive' : 'warning'}>
                          {alert.alert_level === 'expired' ? 'Vencido' : 
                           alert.alert_level === 'critical' ? 'Crítico' : 
                           'Atenção'}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium capitalize">{alert.document_type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Vencimento: {formatDate(alert.expiry_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {alert.alert_level === 'expired' 
                              ? `Vencido há ${Math.abs(alert.days_to_expiry || 0)} dias`
                              : alert.alert_level === 'critical'
                              ? `Vence em ${alert.days_to_expiry || 0} dias - Ação urgente necessária!`
                              : `Vence em ${alert.days_to_expiry || 0} dias - Renovação recomendada`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-current/20">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              if (alert.item_type === 'driver_document' || alert.item_type === 'driver_exam') {
                                router.push(`/carrier/motoristas?driverId=${alert.entity_id}`)
                              } else if (alert.item_type === 'vehicle_document') {
                                router.push(`/carrier/veiculos?vehicleId=${alert.entity_id}`)
                              }
                            }}
                          >
                            Ver Detalhes
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              // Enviar email de alerta (implementar API de notificações)
                              try {
                                const res = await fetch('/api/notifications/email', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    to: user?.email,
                                    subject: `Alerta: ${alert.document_type} vencendo`,
                                    body: `O documento ${alert.document_type} de ${alert.entity_name} vence em ${alert.days_to_expiry} dias.`
                                  })
                                })
                                if (res.ok) {
                                  alert('Email de alerta enviado com sucesso!')
                                }
                              } catch (error) {
                                console.error('Erro ao enviar email:', error)
                              }
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                          </Button>
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
