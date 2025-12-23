"use client"

import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Columns } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "@/lib/next-navigation"
import { SolicitacaoModal } from "@/components/empresa/solicitacao-modal"

export default function SolicitacoesOperatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [empresaId, setEmpresaId] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }
      
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', session.user.id)
        .single()

      if (userData?.company_id) {
        setEmpresaId(userData.company_id)
      }
      
      setUser({ ...session.user })
      setLoading(false)
    }
    run()
  }, [router])

  useEffect(() => {
    if (empresaId) {
      load()
    }
  }, [empresaId])

  const load = async () => {
    try {
      if (empresaId) {
        const { data, error } = await supabase
          .from('gf_service_requests')
          .select('*')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setItems(data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error)
    }
  }

  const columns = [
    { key: 'rascunho', label: 'Rascunho' },
    { key: 'enviado', label: 'Enviado' },
    { key: 'em_analise', label: 'Em Análise' },
    { key: 'aprovado', label: 'Aprovado' },
    { key: 'reprovado', label: 'Reprovado' },
  ]

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 break-words">Solicitações & Mudanças</h1>
            <p className="text-sm sm:text-base text-ink-muted break-words">Abra solicitações para a GOLF FOX e acompanhe o status</p>
          </div>
          <Button 
            className="bg-brand hover:bg-brand-hover w-full sm:w-auto flex-shrink-0" 
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2 flex-shrink-0" /> 
            <span className="hidden sm:inline">Nova Solicitação</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 w-full">
          {columns.map((col, index) => (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group"
            >
            <Card key={col.key} className="p-3 sm:p-4 overflow-hidden w-full hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:border-text-brand/30">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="font-semibold text-sm sm:text-base break-words flex-1">{col.label}</h3>
                <Columns className="h-4 w-4 text-ink-muted flex-shrink-0 ml-2" />
              </div>
              <div className="space-y-2 sm:space-y-3">
                {items.filter(i => i.status === col.key).map(item => (
                  <div key={item.id} className="p-2 sm:p-3 rounded-lg border border-border bg-bg-soft">
                    <p className="text-xs sm:text-sm font-medium break-words">{item.tipo}</p>
                    <p className="text-xs text-ink-muted mt-1">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                ))}
                {items.filter(i => i.status === col.key).length === 0 && (
                  <p className="text-xs text-ink-muted text-center py-2">Sem itens</p>
                )}
              </div>
            </Card>
            </motion.div>
          ))}
        </div>

        {empresaId && (
          <SolicitacaoModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={() => {
              load()
              setIsModalOpen(false)
            }}
            empresaId={empresaId}
          />
        )}
      </div>
    </AppShell>
  )
}

