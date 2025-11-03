"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageCircle, FileText, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function CarrierAjudaPage() {
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
      question: "Como visualizar minha frota no mapa?",
      answer: "Acesse a página Mapa para ver todos os veículos da sua transportadora em tempo real."
    },
    {
      question: "Como verificar o desempenho dos motoristas?",
      answer: "Acesse a página Motoristas para ver informações detalhadas e rankings de desempenho."
    },
    {
      question: "Como gerar relatórios?",
      answer: "Acesse a página Relatórios, selecione o tipo de relatório desejado e exporte nos formatos CSV, Excel ou PDF."
    }
  ]

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Transportadora", email: user?.email || "", role: "carrier" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ajuda & Suporte</h1>
          <p className="text-[var(--ink-muted)]">Central de ajuda para transportadoras</p>
        </div>

        {/* Cards de Ação Rápida */}
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
                <h3 className="font-semibold mb-1">Documentação</h3>
                <p className="text-sm text-[var(--ink-muted)]">Guia completo do sistema</p>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" asChild>
              <a href="/docs" target="_blank">
                Ver Documentação
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
  )
}

