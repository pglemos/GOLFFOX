"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { notifySuccess, notifyError } from "@/lib/toast"

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
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS chassis VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS renavam VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS carrier_id UUID;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'address_%';`

export default function MigratePage() {
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<any>(null)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_SQL)
      setCopied(true)
      notifySuccess("SQL copiado para a área de transferência!")
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      notifyError("Erro ao copiar SQL")
    }
  }

  const checkMigration = async () => {
    setChecking(true)
    try {
      const response = await fetch("/api/admin/run-migration")
      const data = await response.json()
      setStatus(data)
      
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Migração do Banco de Dados</h1>
        
        <Card className="p-6 mb-6">
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
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Resultado:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {status.results?.map((r: any, i: number) => (
                  <div key={i} className={`p-2 rounded ${
                    r.status === "exists" ? "bg-green-100 text-green-800" : 
                    r.status === "needs_creation" ? "bg-yellow-100 text-yellow-800" : 
                    "bg-red-100 text-red-800"
                  }`}>
                    {r.table}.{r.column}: {r.status === "exists" ? "✅" : r.status === "needs_creation" ? "⚠️ Criar" : "❌"}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">SQL para Executar</h2>
            <Button onClick={copyToClipboard} variant={copied ? "default" : "outline"}>
              {copied ? "✅ Copiado!" : "📋 Copiar SQL"}
            </Button>
          </div>
          
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            {MIGRATION_SQL}
          </pre>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📌 Instruções:</h3>
            <ol className="list-decimal list-inside text-blue-700 space-y-2">
              <li>Clique em "Copiar SQL" acima</li>
              <li>Clique em "Abrir Supabase Dashboard"</li>
              <li>Cole o SQL no editor</li>
              <li>Clique em "Run" para executar</li>
              <li>Volte aqui e clique em "Verificar Colunas" para confirmar</li>
            </ol>
          </div>
        </Card>
      </div>
    </div>
  )
}

