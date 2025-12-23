"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { notifySuccess, notifyError } from "@/lib/toast"
import { motion } from "framer-motion"
import { AppShell } from "@/components/app-shell"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { Database, CheckCircle, AlertCircle } from "lucide-react"

const MIGRATION_SQL = `-- Execute este SQL no Supabase Dashboard (SQL Editor)
-- Link: https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/sql/new

-- TABELA USERS - Adicionar colunas de endereço
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_zip_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnh VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnh_category VARCHAR(5);

-- TABELA VEHICLES - Adicionar colunas faltantes
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS chassis VARCHAR(50);
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS renavam VARCHAR(20);
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50);
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS veiculo_type VARCHAR(50);
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS transportadora_id UUID;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'address_%';`

export default function MigratePage() {
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [status, setStatus] = useState<any>(null)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_SQL)
      setCopied(true)
      notifySuccess("SQL copiado para a área de transferência!")
      setTimeout(() => setCopied(false), 3000)
    } catch {
      notifyError("Erro ao copiar SQL")
    }
  }

  const checkMigration = async () => {
    setChecking(true)
    try {
      const response = await fetch("/api/admin/run-migration")
      const data = await response.json()
      setStatus(data)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const needsCreation = data.results?.filter((r: any) => r.status === "needs_creation") || []
      if (needsCreation.length === 0) {
        notifySuccess("Todas as colunas já existem! ✅")
      } else {
        notifyError(`${needsCreation.length} colunas precisam ser criadas`)
      }
    } catch (err) {
      notifyError("Erro ao verificar migração")
    } finally {
      setChecking(false)
    }
  }

  const openSupabaseDashboard = () => {
    window.open("https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/sql/new", "_blank")
  }

  const { user, loading } = useAuthFast()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-bg">
        <div className="w-8 h-8 border-2 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: user?.role || "admin", avatar_url: user?.avatar_url }} panel="admin">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="p-3 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
            <Database className="h-6 w-6 text-brand" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Migração do Banco de Dados</h1>
            <p className="text-ink-muted">Ferramentas de migração e verificação</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
        <Card variant="premium" className="p-6">
          <h2 className="text-xl font-semibold mb-4">Status da Migração</h2>
          <div className="flex gap-4 mb-4">
            <Button onClick={checkMigration} disabled={checking}>
              {checking ? "Verificando..." : "Verificar Colunas"}
            </Button>
            <Button onClick={openSupabaseDashboard} variant="outline">
              Abrir Supabase Dashboard
            </Button>
          </div>

          {status && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-bg-soft rounded-lg"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Database className="h-5 w-5 text-brand" />
                Resultado:
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {status.results?.map((r: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-3 rounded-lg flex items-center gap-2 ${
                      r.status === "exists" ? "bg-success-light text-success border border-success-light" :
                      r.status === "needs_creation" ? "bg-warning-light text-warning border border-warning-light" :
                      "bg-error-light text-error border border-error-light"
                    }`}
                  >
                    {r.status === "exists" ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : r.status === "needs_creation" ? (
                      <AlertCircle className="h-4 w-4 text-warning" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-error" />
                    )}
                    <span className="font-medium">{r.table}.{r.column}</span>
                    <span className="ml-auto">
                      {r.status === "exists" ? "✅" : r.status === "needs_creation" ? "⚠️" : "❌"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
        <Card variant="premium" className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">SQL para Executar</h2>
            <Button onClick={copyToClipboard} variant={copied ? "default" : "outline"}>
              {copied ? "✅ Copiado!" : "📋 Copiar SQL"}
            </Button>
          </div>

          <pre className="bg-ink-strong text-success p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            {MIGRATION_SQL}
          </pre>

          <div className="mt-6 p-4 bg-info-light border border-info-light rounded-lg">
            <h3 className="font-semibold text-info mb-2">📌 Instruções:</h3>
            <ol className="list-decimal list-inside text-info space-y-2">
              <li>Clique em "Copiar SQL" acima</li>
              <li>Clique em "Abrir Supabase Dashboard"</li>
              <li>Cole o SQL no editor</li>
              <li>Clique em "Run" para executar</li>
              <li>Volte aqui e clique em "Verificar Colunas" para confirmar</li>
            </ol>
          </div>
        </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}

