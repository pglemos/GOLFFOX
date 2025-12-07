"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageCircle, FileText, ExternalLink, Search, BookOpen, Video, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function TransportadoraAjudaPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

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

  const faqCategories = {
    all: "Todas",
    fleet: "Frota",
    drivers: "Motoristas",
    reports: "Relatórios",
    costs: "Custos",
    alerts: "Alertas"
  }

  const faqItems = [
    {
      category: "fleet",
      question: "Como visualizar minha frota no mapa?",
      answer: "Acesse a página Mapa para ver todos os veículos da sua transportadora em tempo real. Você pode filtrar por status, rota e alternar entre visualizações de mapa, satélite e terreno."
    },
    {
      category: "fleet",
      question: "Como gerenciar veículos?",
      answer: "Na página Veículos, você pode visualizar todos os veículos da sua transportadora, ver documentos, manutenções e exportar a lista. Use os filtros para encontrar veículos específicos."
    },
    {
      category: "drivers",
      question: "Como verificar o desempenho dos motoristas?",
      answer: "Acesse a página Motoristas para ver informações detalhadas, rankings de desempenho, estatísticas de viagens, pontualidade e segurança. Os motoristas são ordenados por performance."
    },
    {
      category: "drivers",
      question: "Como gerenciar documentos dos motoristas?",
      answer: "Na página Motoristas, selecione a aba Documentos, escolha um motorista e faça upload dos documentos necessários. O sistema alerta sobre documentos vencendo."
    },
    {
      category: "reports",
      question: "Como gerar relatórios?",
      answer: "Acesse a página Relatórios, selecione o período desejado usando os filtros ou presets (hoje, últimos 7 dias, etc.), escolha o tipo de relatório e exporte nos formatos CSV, Excel ou PDF."
    },
    {
      category: "reports",
      question: "Quais relatórios estão disponíveis?",
      answer: "Você pode gerar relatórios de Frota em Uso, Performance de Motoristas e Viagens Realizadas. Cada relatório inclui um resumo e dados detalhados."
    },
    {
      category: "costs",
      question: "Como monitorar custos?",
      answer: "A página Custos mostra análises detalhadas de custos por veículo, por rota, custo por km, custo por passageiro e comparação com períodos anteriores."
    },
    {
      category: "alerts",
      question: "Como funcionam os alertas?",
      answer: "O sistema monitora automaticamente documentos e exames próximos do vencimento. Você pode filtrar alertas por tipo, nível de criticidade e exportar a lista. Use as ações rápidas para agendar renovações."
    },
    {
      category: "fleet",
      question: "Como adicionar documentos aos veículos?",
      answer: "Na página Veículos, selecione a aba Documentos, escolha um veículo e clique em Upload Documento. Selecione o tipo de documento e faça o upload do arquivo."
    },
    {
      category: "fleet",
      question: "Como registrar manutenções?",
      answer: "Na página Veículos, selecione a aba Manutenções, escolha um veículo e clique em Nova Manutenção. Preencha os dados da manutenção incluindo custos, data e status."
    }
  ]

  const filteredFaqItems = faqItems.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Transportadora", email: user?.email || "", role: "transportadora", avatar_url: user?.avatar_url }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ajuda & Suporte</h1>
          <p className="text-[var(--ink-muted)]">Central de ajuda para transportadoras</p>
        </div>

        {/* Cards de Ação Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="group"
          >
          <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--brand)]/30 cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="h-6 w-6 text-[var(--brand)]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Suporte WhatsApp</h3>
                <p className="text-sm text-[var(--ink-muted)]">Entre em contato conosco</p>
              </div>
            </div>
            <Button className="w-full" variant="outline" asChild>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                Abrir WhatsApp
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
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
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent-soft)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Documentação</h3>
                <p className="text-sm text-[var(--ink-muted)]">Guia completo do sistema</p>
              </div>
            </div>
            <Button className="w-full" variant="outline" asChild>
              <a href="/docs" target="_blank">
                Ver Documentação
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
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
          <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-purple-500/30 cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Video className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Tutoriais em Vídeo</h3>
                <p className="text-sm text-[var(--ink-muted)]">Aprenda com vídeos</p>
              </div>
            </div>
            <Button className="w-full" variant="outline" asChild>
              <a href="/tutoriais" target="_blank">
                Ver Tutoriais
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -4 }}
            className="group"
          >
          <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-green-500/30 cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Contato por Email</h3>
                <p className="text-sm text-[var(--ink-muted)]">Envie sua dúvida</p>
              </div>
            </div>
            <Button className="w-full" variant="outline" asChild>
              <a href="mailto:suporte@golffox.com">
                Enviar Email
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </Card>
          </motion.div>
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-[var(--border)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Perguntas Frequentes</h2>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar no FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(faqCategories).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            {filteredFaqItems.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-[var(--ink-muted)]">Nenhuma pergunta encontrada</p>
              </div>
            ) : (
              filteredFaqItems.map((item, index) => (
                <div key={index} className="border-b border-[var(--border)] pb-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="flex-shrink-0">
                      {faqCategories[item.category as keyof typeof faqCategories]}
                    </Badge>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{item.question}</h3>
                      <p className="text-sm text-[var(--ink-muted)]">{item.answer}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        </motion.div>

        {/* Status do Sistema */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
  )
}

