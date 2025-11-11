"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LifeBuoy, Send, Plus, Search, Clock, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { AssistanceModal } from "@/components/modals/assistance-modal"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { notifySuccess, notifyError } from "@/lib/toast"

export default function SocorroPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ocorrencias, setOcorrencias] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    const getUser = async () => {
      try {
        // Primeiro, tentar obter usuário do cookie de sessão customizado
        if (typeof document !== 'undefined') {
          const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
          if (cookieMatch) {
            try {
              const decoded = atob(cookieMatch[1])
              const u = JSON.parse(decoded)
              if (u?.id && u?.email) {
                setUser({ id: u.id, email: u.email, name: u.email.split('@')[0], role: u.role || 'admin' })
                setLoading(false)
                loadOcorrencias()
                return
              }
            } catch (err) {
              console.warn('⚠️ Erro ao decodificar cookie de sessão:', err)
            }
          }
        }

        // Fallback: tentar sessão do Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Erro ao obter sessão do Supabase:', sessionError)
        }
        
        if (!session) {
          // Sem sessão - deixar o middleware proteger o acesso (não redirecionar aqui para evitar loop)
          console.log('⚠️ Sem sessão detectada - middleware irá proteger acesso')
          setLoading(false)
          return
        }
        
        setUser({ ...session.user })
        setLoading(false)
        loadOcorrencias()
      } catch (err) {
        console.error('❌ Erro ao obter usuário:', err)
        setLoading(false)
        // Não redirecionar aqui - deixar o middleware proteger
      }
    }
    getUser()
  }, [router])

  const loadOcorrencias = async () => {
    try {
      let query = supabase
        .from("gf_assistance_requests")
        .select(`
          *,
          trips(id, route_id),
          routes(id, name),
          vehicles!gf_assistance_requests_dispatched_vehicle_id_fkey(id, plate, model),
          drivers:users!gf_assistance_requests_dispatched_driver_id_fkey(id, email)
        `)
        .order("created_at", { ascending: false })

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setOcorrencias(data || [])
    } catch (error) {
      console.error("Erro ao carregar ocorrências:", error)
    }
  }

  useEffect(() => {
    if (user) {
      loadOcorrencias()
    }
  }, [filterStatus, user])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Socorro</h1>
            <p className="text-[var(--ink-muted)]">Gerencie ocorrências e emergências</p>
          </div>
          <Button onClick={() => {
            setSelectedRequest(null)
            setIsModalOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ocorrência
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar ocorrências..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="open">Abertas</option>
            <option value="dispatched">Despachadas</option>
            <option value="resolved">Resolvidas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>

        <div className="grid gap-4">
          {ocorrencias
            .filter(occ => 
              searchQuery === "" || 
              occ.request_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              occ.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              occ.address?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((ocorrencia) => (
            <motion.div
              key={ocorrencia.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <LifeBuoy className="h-5 w-5 text-[var(--error)]" />
                      <h3 className="font-bold text-lg capitalize">{ocorrencia.request_type}</h3>
                      <Badge 
                        variant={
                          ocorrencia.status === 'open' ? 'destructive' :
                          ocorrencia.status === 'dispatched' ? 'default' :
                          ocorrencia.status === 'resolved' ? 'secondary' : 'outline'
                        }
                      >
                        {ocorrencia.status === 'open' ? 'Aberta' :
                         ocorrencia.status === 'dispatched' ? 'Despachada' :
                         ocorrencia.status === 'resolved' ? 'Resolvida' : 'Cancelada'}
                      </Badge>
                    </div>
                    {ocorrencia.description && (
                      <p className="text-sm text-[var(--ink-muted)] mb-2">{ocorrencia.description}</p>
                    )}
                    <div className="space-y-1 text-xs text-[var(--ink-muted)]">
                      {ocorrencia.address && (
                        <p>📍 {ocorrencia.address}</p>
                      )}
                      {ocorrencia.routes && (
                        <p>🚌 Rota: {ocorrencia.routes.name || ocorrencia.route_id}</p>
                      )}
                      {ocorrencia.drivers && (
                        <p>
                          👤 Motorista: {(
                            ocorrencia.drivers.email?.split("@")[0] || ocorrencia.dispatched_driver_id
                          )}
                        </p>
                      )}
                      {ocorrencia.vehicles && (
                        <p>🚛 Veículo: {ocorrencia.vehicles.plate}</p>
                      )}
                      <p>🕐 {new Date(ocorrencia.created_at).toLocaleString('pt-BR')}</p>
                      {ocorrencia.status === 'open' && ocorrencia.created_at && (
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="h-3 w-3 text-orange-500" />
                          <span className="text-xs text-orange-600 font-medium">
                            Tempo de resposta: {(() => {
                              const minutes = Math.floor((Date.now() - new Date(ocorrencia.created_at).getTime()) / (1000 * 60))
                              return `${minutes}min`
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {ocorrencia.status === 'open' && (
                      <Button 
                        variant="destructive"
                        onClick={async () => {
                          setSelectedRequest(ocorrencia)
                          setIsModalOpen(true)
                          
                          // Criar alerta crítico
                          try {
                            const { data: { session } } = await supabase.auth.getSession()
                            if (session) {
                              await supabase.from('gf_incidents').insert({
                                company_id: ocorrencia.company_id || null,
                                route_id: ocorrencia.route_id || null,
                                vehicle_id: ocorrencia.vehicle_id || null,
                                driver_id: ocorrencia.driver_id || null,
                                severity: 'critical',
                                status: 'open',
                                description: `Ocorrência de socorro: ${ocorrencia.request_type} - ${ocorrencia.description || ''}`
                              })
                            }
                          } catch (error) {
                            console.error('Erro ao criar alerta:', error)
                          }
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Despachar
                      </Button>
                    )}
                    {ocorrencia.status === 'dispatched' && (
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('gf_assistance_requests')
                              .update({ status: 'resolved', resolved_at: new Date().toISOString() })
                              .eq('id', ocorrencia.id)
                            
                            if (error) throw error
                            
                            // Calcular SLA
                            const responseTime = new Date(ocorrencia.dispatched_at || Date.now()).getTime() - new Date(ocorrencia.created_at).getTime()
                            const resolutionTime = Date.now() - new Date(ocorrencia.created_at).getTime()
                            
                            notifySuccess('', { i18n: { ns: 'common', key: 'success.assistanceResolvedSLA', params: { response: Math.floor(responseTime / 60000), total: Math.floor(resolutionTime / 60000) } } })
                            loadOcorrencias()
                          } catch (error: any) {
                            notifyError(error, `Erro: ${error.message}`, { i18n: { ns: 'common', key: 'errors.assistanceResolve', params: { message: error.message } } })
                          }
                        }}
                      >
                        <LifeBuoy className="h-4 w-4 mr-2" />
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          {ocorrencias.length === 0 && (
            <Card className="p-12 text-center">
              <LifeBuoy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma ocorrência encontrada</h3>
              <p className="text-sm text-[var(--ink-muted)]">
                {searchQuery ? "Tente ajustar sua busca" : "Não há ocorrências no momento"}
              </p>
            </Card>
          )}
        </div>

        {/* Modal de Despache */}
        <AssistanceModal
          request={selectedRequest}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedRequest(null)
          }}
          onSave={loadOcorrencias}
        />
      </div>
    </AppShell>
  )
}

