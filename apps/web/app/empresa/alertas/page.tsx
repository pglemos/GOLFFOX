"use client"

import { useEffect, useState, Suspense, useCallback } from "react"

import { motion } from "framer-motion"
import { AlertTriangle, Search, Bell, Clock, CheckCircle, XCircle, Plus } from "lucide-react"
import { useInView } from "react-intersection-observer"

import { AppShell } from "@/components/app-shell"
import { useOperatorTenant } from "@/components/providers/empresa-tenant-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAlerts, useResolveAlert } from "@/hooks/use-empresa-data"
import { useDebounce } from "@/lib/debounce"
import { useRouter, useSearchParams } from "@/lib/next-navigation"
import { supabase } from "@/lib/supabase"
import { notifyError, notifySuccess } from "@/lib/toast"
import { logError } from "@/lib/logger"
import type { Database } from "@/types/supabase"

type AlertRow = Database['public']['Views']['v_operador_alerts_secure']['Row']


function AlertasOperatorPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tenantCompanyId, loading: tenantLoading, error: tenantError } = useOperatorTenant()
  const [user, setUser] = useState<{ id?: string; name?: string; email?: string; avatar_url?: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 300)
  const pageSize = 50

  const urlFilter = searchParams?.get('filter')
  const filterMap: Record<string, string> = {
    delay: 'route_delayed',
    stopped: 'bus_stopped',
    deviation: 'route_deviation',
  }
  const mappedUrlFilter = urlFilter ? filterMap[urlFilter] : undefined

  // Usar React Query para alertas
  const { data: alertsData, isLoading: alertsLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAlerts(
    tenantCompanyId,
    currentPage,
    pageSize,
    {
      type: mappedUrlFilter,
      severity: filterType !== "all" ? filterType : undefined,
      resolved: filterType === "resolved" ? true : filterType === "unresolved" ? false : undefined,
    }
  )

  const resolveAlert = useResolveAlert()

  // Infinite scroll
  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          logError('Erro ao verificar sessão', { error: sessionError }, 'AlertasPage')
          setError('Erro ao verificar autenticação')
          return
        }
        if (!session) {
          router.push("/")
          return
        }
        setUser({ ...session.user })
      } catch (err: unknown) {
        const error = err as { message?: string }
        logError('Erro ao obter usuário', { error }, 'AlertasPage')
        setError('Erro ao carregar dados do usuário')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  // Removido - agora usando React Query

  const handleResolve = async (alertId: string, resolved: boolean) => {
    await resolveAlert.mutateAsync({ alertId, resolved })
    notifySuccess(resolved ? "Alerta marcado como resolvido" : "Alerta marcado como não resolvido")
  }

  const handleCreateRequest = (alerta: AlertRow) => {
    router.push(`/operador/solicitacoes?type=socorro&alert_id=${alerta.id || ''}`)
  }

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (tenantError || error) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertTriangle className="h-12 w-12 text-error mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-error">Erro ao carregar</h2>
            <p className="text-ink-muted mb-4">{tenantError || error}</p>
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
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2">Nenhuma empresa selecionada</h2>
            <p className="text-ink-muted mb-4">Selecione uma empresa para continuar</p>
            <Button onClick={() => router.push('/operador')} variant="default">
              Voltar para Dashboard
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  // Flatten pages data
  const alertas: AlertRow[] = alertsData?.pages.flatMap(page => page.data || []) || []

  const filteredAlertas = alertas.filter((a) => {
    if (!a) return false

    const matchesSearch = !debouncedSearch ||
      a.message?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      a.type?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      a.alert_type?.toLowerCase().includes(debouncedSearch.toLowerCase())

    return matchesSearch
  })

  const getAlertColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'text-error'
      case 'warning':
        return 'text-warning'
      case 'info':
        return 'text-info'
      default:
        return 'text-ink-muted'
    }
  }

  const getBadgeColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'bg-error-light text-error border-error-light'
      case 'warning':
        return 'bg-warning-light text-warning border-warning-light'
      case 'info':
        return 'bg-info-light text-info border-info-light'
      default:
        return 'bg-bg-soft text-ink-strong border-border-light'
    }
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Alertas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Notificações e alertas do sistema</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light h-4 w-4" />
            <Input
              placeholder="Buscar alertas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="min-h-[48px] px-4 py-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="error">Erro</option>
            <option value="warning">Aviso</option>
            <option value="info">Info</option>
            <option value="resolved">Resolvidos</option>
            <option value="unresolved">Não Resolvidos</option>
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
              <Card className="p-4 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:border-brand/30 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${alerta.severity === 'critical' || alerta.severity === 'error' ? 'bg-error-light' :
                        alerta.severity === 'warning' ? 'bg-warning-light' :
                          'bg-info-light'
                        }`}>
                        <AlertTriangle className={`h-4 w-4 ${getAlertColor(alerta.severity || undefined)}`} />
                      </div>
                      <h3 className="font-bold text-lg capitalize truncate group-hover:text-brand transition-colors">
                        {alerta.type?.replace(/_/g, ' ') || alerta.alert_type?.replace(/_/g, ' ') || "Alerta"}
                      </h3>
                      <Badge className={`${getBadgeColor(alerta.severity || undefined)} flex-shrink-0`}>
                        {alerta.severity || "normal"}
                      </Badge>
                    </div>
                    <p className="text-sm text-ink-strong mb-2 break-words">
                      {alerta.message || "Sem mensagem"}
                    </p>
                    {alerta.created_at && (
                      <div className="flex items-center gap-1 text-xs text-ink-muted">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(alerta.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!alerta.is_resolved && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(alerta.id || '', true)}
                          disabled={resolveAlert.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateRequest(alerta)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Criar Solicitação
                        </Button>
                      </>
                    )}
                    {alerta.is_resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(alerta.id || '', false)}
                        disabled={resolveAlert.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reabrir
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Infinite scroll trigger */}
          {hasNextPage && (
            <div ref={ref} className="flex justify-center py-4">
              {isFetchingNextPage && (
                <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          )}

          {filteredAlertas.length === 0 && !alertsLoading && (
            <Card className="p-12 text-center">
              <Bell className="h-12 w-12 text-ink-light mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
              <p className="text-sm text-ink-muted mb-4">
                {debouncedSearch ? "Tente ajustar sua busca" : "Não há alertas no momento"}
              </p>
              {!debouncedSearch && (
                <Button onClick={() => router.push('/operador/solicitacoes')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Solicitação
                </Button>
              )}
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
        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <AlertasOperatorPageInner />
    </Suspense>
  )
}
