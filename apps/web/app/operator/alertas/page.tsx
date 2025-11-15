"use client"

import { useEffect, useState, Suspense, useCallback } from "react"
// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Button } from "@/components/ui/button"
// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Input } from "@/components/ui/input"
// @ts-ignore
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Search, Bell, Clock } from "lucide-react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { notifyError } from "@/lib/toast"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"

function AlertasOperatorPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tenantCompanyId, loading: tenantLoading, error: tenantError } = useOperatorTenant()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Erro ao verificar sessão:', sessionError)
          setError('Erro ao verificar autenticação')
          return
        }
        if (!session) {
          router.push("/")
          return
        }
        setUser({ ...session.user })
      } catch (err: any) {
        console.error('Erro ao obter usuário:', err)
        setError('Erro ao carregar dados do usuário')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  const loadAlertas = useCallback(async () => {
    if (!tenantCompanyId) return
    
    try {
      setLoading(true)
      setError(null)
      // Usar view segura que já filtra por tenantCompanyId via RLS
      const { data, error: queryError } = await supabase
        .from('v_operator_alerts_secure')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (queryError) {
        console.error("Erro ao carregar alertas:", queryError)
        setError(`Erro ao carregar alertas: ${queryError.message}`)
        notifyError(`Erro: ${queryError.message}`, { i18n: { ns: 'common', key: 'errors.generic' } })
        setAlertas([])
        return
      }
      setAlertas(data || [])
    } catch (err: any) {
      console.error("Erro ao carregar alertas:", err)
      const errorMessage = err?.message || 'Erro desconhecido'
      setError(errorMessage)
      notifyError(`Erro: ${errorMessage}`, { i18n: { ns: 'common', key: 'errors.generic' } })
      setAlertas([])
    } finally {
      setLoading(false)
    }
  }, [tenantCompanyId])

  useEffect(() => {
    if (tenantCompanyId && !tenantLoading) {
      loadAlertas()
    }
  }, [tenantCompanyId, tenantLoading, loadAlertas])

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (tenantError || error) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-red-600">Erro ao carregar</h2>
            <p className="text-gray-600 mb-4">{tenantError || error}</p>
            <Button onClick={() => window.location.reload()} variant="default">
              Tentar Novamente
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  if (!tenantCompanyId) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2">Nenhuma empresa selecionada</h2>
            <p className="text-gray-600 mb-4">Selecione uma empresa para continuar</p>
            <Button onClick={() => router.push('/operator')} variant="default">
              Voltar para Dashboard
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  const filteredAlertas = alertas.filter(a => {
    if (!a) return false
    
    const matchesSearch = !searchQuery || 
      a.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.alert_type?.toLowerCase().includes(searchQuery.toLowerCase())

    // Filtro via URL (?filter=delay|stopped|deviation)
    const urlFilter = searchParams?.get('filter')
    const filterMap: Record<string, string> = {
      delay: 'route_delayed',
      stopped: 'bus_stopped',
      deviation: 'route_deviation',
    }
    const mappedUrlFilter = urlFilter ? filterMap[urlFilter] : null
    const matchesUrlFilter = !mappedUrlFilter || a.alert_type === mappedUrlFilter

    // Filtro de severidade via dropdown
    const matchesSeverity = filterType === "all" 
      || (filterType === 'error' && (a.severity === 'error' || a.severity === 'critical'))
      || (filterType === 'warning' && a.severity === 'warning')
      || (filterType === 'info' && (a.severity === 'info' || !a.severity))

    return matchesSearch && matchesUrlFilter && matchesSeverity
  })

  const getAlertColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'info':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  const getBadgeColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Alertas</h1>
          <p className="text-gray-600">Notificações e alertas do sistema</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar alertas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="error">Erro</option>
            <option value="warning">Aviso</option>
            <option value="info">Info</option>
          </select>
        </div>

        {/* Lista de alertas */}
        <div className="grid gap-4">
          {filteredAlertas.map((alerta, index) => (
            <motion.div
              key={alerta.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <AlertTriangle className={`h-5 w-5 ${getAlertColor(alerta.severity)} flex-shrink-0`} />
                      <h3 className="font-bold text-lg capitalize truncate">
                        {alerta.alert_type?.replace(/_/g, ' ') || "Alerta"}
                      </h3>
                      <Badge className={`${getBadgeColor(alerta.severity)} flex-shrink-0`}>
                        {alerta.severity || "normal"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 break-words">
                      {alerta.message || "Sem mensagem"}
                    </p>
                    {alerta.created_at && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(alerta.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          {filteredAlertas.length === 0 && !loading && (
            <Card className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
              <p className="text-sm text-gray-500">
                {searchQuery ? "Tente ajustar sua busca" : "Não há alertas no momento"}
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default function AlertasOperatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <AlertasOperatorPageInner />
    </Suspense>
  )
}
