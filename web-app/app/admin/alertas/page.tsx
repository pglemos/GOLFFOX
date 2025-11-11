"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle, 
  User, 
  Download,
  XCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { notifySuccess, notifyError } from "@/lib/toast"
import { motion } from "framer-motion"

const ALERT_TYPES = {
  route_delayed: { label: 'Rota Atrasada', severity: 'warning' },
  bus_stopped: { label: 'Ônibus Parado', severity: 'critical' },
  route_deviation: { label: 'Desvio de Rota', severity: 'warning' },
  incident: { label: 'Incidente', severity: 'critical' },
  checklist_fail: { label: 'Checklist Falhou', severity: 'warning' }
}

export default function AlertasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadAlertas()
    }
    getUser()
  }, [router])

  useEffect(() => {
    if (user) {
      loadAlertas()
    }
  }, [filterType, filterSeverity, filterStatus, user])

  const loadAlertas = async () => {
    try {
      let query = supabase
        .from("gf_incidents")
        .select(`
          *,
          companies(name),
          routes(name),
          vehicles(plate),
          drivers:users!gf_incidents_driver_id_fkey(name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100)

      if (filterSeverity !== "all") {
        query = query.eq("severity", filterSeverity)
      }
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setAlertas(data || [])
    } catch (error) {
      console.error("Erro ao carregar alertas:", error)
      notifyError(error, 'Erro inesperado')
    }
  }

  const handleResolve = async (alertaId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { error } = await supabase
        .from("gf_incidents")
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: session.user.id
        })
        .eq("id", alertaId)

      if (error) throw error

      // Log de auditoria
      await supabase.from('gf_audit_log').insert({
        actor_id: session.user.id,
        action_type: 'resolve',
        resource_type: 'incident',
        resource_id: alertaId,
        details: { severity: 'resolved' }
      })

      notifySuccess('', { i18n: { ns: 'common', key: 'success.alertResolved' } })
      loadAlertas()
    } catch (error: any) {
      notifyError(error, 'Erro inesperado')
    }
  }

  const handleAssign = async (alertaId: string, userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { error } = await supabase
        .from("gf_incidents")
        .update({ assigned_to: userId })
        .eq("id", alertaId)

      if (error) throw error

      notifySuccess('', { i18n: { ns: 'common', key: 'success.alertAssigned' } })
      loadAlertas()
    } catch (error: any) {
      notifyError(error, 'Erro inesperado')
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/reports/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportKey: 'incidents',
          format: 'csv',
          filters: {}
        })
      })

      if (!response.ok) throw new Error('Erro ao exportar')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `alertas_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      notifySuccess('', { i18n: { ns: 'common', key: 'success.exportCsv' } })
    } catch (error: any) {
      notifyError('Erro ao exportar', undefined, { i18n: { ns: 'common', key: 'errors.export' } })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  const filteredAlertas = alertas.filter(alerta => {
    if (searchQuery && !alerta.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Alertas</h1>
            <p className="text-[var(--ink-muted)]">Monitoramento e gestão de alertas do sistema</p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
              <Input 
                placeholder="Buscar alertas..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="all">Todas Severidades</option>
              <option value="critical">Crítico</option>
              <option value="warning">Aviso</option>
              <option value="info">Info</option>
            </select>
            <select 
              className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos Status</option>
              <option value="open">Aberto</option>
              <option value="assigned">Atribuído</option>
              <option value="resolved">Resolvido</option>
            </select>
          </div>
        </Card>

        {/* Lista de Alertas */}
        <div className="grid gap-4">
          {filteredAlertas.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
              <p className="text-sm text-[var(--ink-muted)]">
                {searchQuery ? "Tente ajustar sua busca" : "Não há alertas no momento"}
              </p>
            </Card>
          ) : (
            filteredAlertas.map((alerta) => (
              <motion.div
                key={alerta.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <AlertTriangle 
                        className={`h-5 w-5 mt-1 ${
                          alerta.severity === 'critical' ? 'text-red-500' : 
                          alerta.severity === 'warning' ? 'text-orange-500' : 
                          'text-blue-500'
                        }`} 
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant={
                              alerta.severity === 'critical' ? 'destructive' : 
                              alerta.severity === 'warning' ? 'default' : 
                              'secondary'
                            }
                          >
                            {alerta.severity}
                          </Badge>
                          <Badge variant={alerta.status === 'resolved' ? 'secondary' : 'outline'}>
                            {alerta.status === 'open' ? 'Aberto' : 
                             alerta.status === 'assigned' ? 'Atribuído' : 
                             'Resolvido'}
                          </Badge>
                          <span className="text-sm text-[var(--ink-muted)]">
                            {new Date(alerta.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="font-medium mb-2">{alerta.description}</p>
                        <div className="space-y-1 text-xs text-[var(--ink-muted)]">
                          {alerta.companies && (
                            <p>🏢 Empresa: {alerta.companies.name}</p>
                          )}
                          {alerta.routes && (
                            <p>🚌 Rota: {alerta.routes.name}</p>
                          )}
                          {alerta.vehicles && (
                            <p>🚛 Veículo: {alerta.vehicles.plate}</p>
                          )}
                          {alerta.drivers && (
                            <p>👤 Motorista: {alerta.drivers.name || alerta.drivers.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {alerta.status !== 'resolved' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResolve(alerta.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolver
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              const { data: { session } } = await supabase.auth.getSession()
                              if (session) {
                                await handleAssign(alerta.id, session.user.id)
                              }
                            }}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Atribuir
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
