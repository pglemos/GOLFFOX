"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from "react"
// @ts-expect-error Legacy: valid em ambiente sem tipagem
import { AppShell } from "@/components/app-shell"
// @ts-expect-error Legacy: valid em ambiente sem tipagem
import { Card } from "@/components/ui/card"
// @ts-expect-error Legacy: valid em ambiente sem tipagem
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageCircle, FileText, ExternalLink } from "lucide-react"
// @ts-expect-error Legacy: valid em ambiente sem tipagem
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
      question: "Como adicionar funcionÃ¡rios?",
      answer: "Acesse a pÃ¡gina de FuncionÃ¡rios e clique em 'Adicionar FuncionÃ¡rio'. Preencha os dados necessÃ¡rios."
    },
    {
      question: "Como visualizar rotas atribuÃ­das?",
      answer: "Acesse a pÃ¡gina de Rotas para ver todas as rotas atribuÃ­das Ã  sua empresa."
    },
    {
      question: "Como interpretar os alertas?",
      answer: "Os alertas sÃ£o notificaÃ§Ãµes do sistema. Alertas vermelhos sÃ£o erros crÃ­ticos, amarelos sÃ£o avisos e azuis sÃ£o informativos."
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

        {/* Cards de AÃ§Ã£o RÃ¡pida */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--brand)]/20 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-[var(--brand)]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Suporte WhatsApp</h3>
                <p className="text-sm text-[var(--ink-muted)]">Entre em contato conosco</p>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" asChild>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                Abrir WhatsApp
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">DocumentaÃ§Ã£o</h3>
                <p className="text-sm text-[var(--ink-muted)]">Guia completo do sistema</p>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" asChild>
              <a href="/docs" target="_blank">
                Ver DocumentaÃ§Ã£o
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--ok)]/20 flex items-center justify-center">
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
        </div>

        {/* FAQ */}
        <Card className="p-6">
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

        {/* Status do Sistema */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Status do Sistema</h2>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--ok)] animate-pulse"></div>
            <span className="text-sm">Todos os sistemas operacionais</span>
          </div>
        </Card>
        </div>
      </AppShell>
    </Suspense>
  )
}


