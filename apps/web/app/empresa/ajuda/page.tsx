"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageCircle, FileText, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function AjudaOperatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
    }
    getUser()
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  const faqItems = [
    {
      question: "Como adicionar funcionários?",
      answer: "Acesse a página de Funcionários e clique em 'Adicionar Funcionário'. Preencha os dados necessários."
    },
    {
      question: "Como visualizar rotas atribuídas?",
      answer: "Acesse a página de Rotas para ver todas as rotas atribuídas à sua empresa."
    },
    {
      question: "Como interpretar os alertas?",
      answer: "Os alertas são notificações do sistema. Alertas vermelhos são erros críticos, amarelos são avisos e azuis são informativos."
    }
  ]

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>}>
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
        <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ajuda & Suporte</h1>
          <p className="text-[var(--ink-muted)]">Central de ajuda para operadores</p>
        </div>

        {/* Cards de Ação Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="group"
          >
          <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--brand)]/30 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="h-6 w-6 text-[var(--brand)]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Suporte WhatsApp</h3>
                <p className="text-sm text-[var(--ink-muted)]">Entre em contato conosco</p>
              </div>
            </div>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => window.open("https://wa.me/5511999999999", "_blank", "noopener,noreferrer")}
            >
              Abrir WhatsApp
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="group"
          >
          <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--accent)]/30 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent-soft)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Documentação</h3>
                <p className="text-sm text-[var(--ink-muted)]">Guia completo do sistema</p>
              </div>
            </div>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => window.open("/docs", "_blank")}
            >
              Ver Documentação
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4 }}
            className="group"
          >
          <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--ok)]/30 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <HelpCircle className="h-6 w-6 text-[var(--ok)]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">FAQ</h3>
                <p className="text-sm text-[var(--ink-muted)]">Perguntas frequentes</p>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              Ver FAQ
            </Button>
          </Card>
          </motion.div>
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-[var(--border)]">
          <h2 className="text-xl font-bold mb-4">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-[var(--border)] pb-4 last:border-0">
                <h3 className="font-semibold mb-2">{item.question}</h3>
                <p className="text-sm text-[var(--ink-muted)]">{item.answer}</p>
              </div>
            ))}
          </div>
        </Card>
        </motion.div>

        {/* Status do Sistema */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-[var(--border)]">
          <h2 className="text-xl font-bold mb-4">Status do Sistema</h2>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--ok)] animate-pulse"></div>
            <span className="text-sm">Todos os sistemas operacionais</span>
          </div>
        </Card>
        </motion.div>
        </div>
      </AppShell>
    </Suspense>
  )
}


