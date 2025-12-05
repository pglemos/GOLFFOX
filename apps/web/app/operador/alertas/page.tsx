"use client"

import { useEffect, useState, Suspense, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Search, Bell, Clock, CheckCircle, XCircle, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { notifyError, notifySuccess } from "@/lib/toast"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"
import { useAlerts, useResolveAlert } from "@/hooks/use-operator-data"
import { useDebounce } from "@/lib/debounce"
import { useInView } from "react-intersection-observer"

function AlertasOperatorPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tenantCompanyId, loading: tenantLoading, error: tenantError } = useOperatorTenant()
  const [user, setUser] = useState<any>(null)
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

  // Removido - agora usando React Query

  const handleResolve = async (alertId: string, resolved: boolean) => {
    await resolveAlert.mutateAsync({ alertId, resolved })
    notifySuccess(resolved ? "Alerta marcado como resolvido" : "Alerta marcado como não resolvido")
  }

  const handleCreateRequest = (alerta: any) => {
    router.push(`/operador/solicitacoes?type=socorro&alert_id=${alerta.id}`)
  }

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (tenantError || error) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
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
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2">Nenhuma empresa selecionada</h2>
            <p className="text-gray-600 mb-4">Selecione uma empresa para continuar</p>
            <Button onClick={() => router.push('/operador')} variant="default">
              Voltar para Dashboard
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  // Flatten pages data
  const alertas = alertsData?.pages.flatMap(page => page.data) || []
  
  const filteredAlertas = alertas.filter(a => {
    if (!a) return false
    
    const matchesSearch = !debouncedSearch || 
      a.message?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (a as any).alert_type?.toLowerCase().includes(debouncedSearch.toLowerCase())

    return matchesSearch
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
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
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
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <AlertTriangle className={`h-5 w-5 ${getAlertColor(alerta.severity)} flex-shrink-0`} />
                      <h3 className="font-bold text-lg capitalize truncate">
                        {(alerta as any).alert_type?.replace(/_/g, ' ') || "Alerta"}
                      </h3>
                      <Badge className={`${getBadgeColor(alerta.severity || undefined)} flex-shrink-0`}>
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
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          )}
          
          {filteredAlertas.length === 0 && !alertsLoading && (
            <Card className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
              <p className="text-sm text-gray-500 mb-4">
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
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <AlertasOperatorPageInner />
    </Suspense>
  )
}
