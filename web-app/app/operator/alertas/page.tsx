"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Search, Bell, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function AlertasOperatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

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

  const loadAlertas = async () => {
    try {
      // Buscar alertas relacionados à empresa do operador
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single()

      let query = supabase
        .from('gf_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (userData?.company_id) {
        query = query.or(`company_id.eq.${userData.company_id},company_id.is.null`)
      }

      const { data, error } = await query

      if (error) throw error
      setAlertas(data || [])
    } catch (error) {
      console.error("Erro ao carregar alertas:", error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  const filteredAlertas = alertas.filter(a => {
    const matchesSearch = searchQuery === "" || 
      a.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.type?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === "all" || a.type === filterType
    return matchesSearch && matchesFilter
  })

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-[var(--error)]'
      case 'warning':
        return 'bg-[var(--warning)]'
      case 'info':
        return 'bg-[var(--accent)]'
      default:
        return 'bg-[var(--muted)]'
    }
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Alertas</h1>
          <p className="text-[var(--ink-muted)]">Notificações e alertas do sistema</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar alertas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="error">Erro</option>
            <option value="warning">Aviso</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="grid gap-4">
          {filteredAlertas.map((alerta, index) => (
            <motion.div
              key={alerta.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`h-5 w-5 ${getAlertColor(alerta.type)}`} />
                      <h3 className="font-bold text-lg capitalize">{alerta.type || "Alerta"}</h3>
                      <Badge className={getAlertColor(alerta.type)}>
                        {alerta.severity || "normal"}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--ink-strong)] mb-2">{alerta.message || "Sem mensagem"}</p>
                    <div className="flex items-center gap-4 text-xs text-[var(--ink-muted)]">
                      {alerta.created_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(alerta.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          {filteredAlertas.length === 0 && (
            <Card className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
              <p className="text-sm text-[var(--ink-muted)]">
                {searchQuery ? "Tente ajustar sua busca" : "Não há alertas no momento"}
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}

