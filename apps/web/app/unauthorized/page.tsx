"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { Suspense } from "react"

function UnauthorizedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reason = searchParams.get('reason') || 'unauthorized'
  const role = searchParams.get('role') || 'unknown'

  const messages: Record<string, { title: string; description: string; showMobileInfo?: boolean }> = {
    admin_only: {
      title: "Acesso Restrito ao Administrador",
      description: "Esta área é exclusiva para administradores do sistema."
    },
    operator_access_required: {
      title: "Acesso Restrito",
      description: "Você precisa ser um operador ou administrador para acessar esta área."
    },
    carrier_access_required: {
      title: "Acesso Restrito",
      description: "Você precisa ser uma transportadora ou administrador para acessar esta área."
    },
    mobile_only: {
      title: "Acesso via Aplicativo Mobile",
      description: role === 'driver' 
        ? "Motoristas devem acessar o sistema através do aplicativo mobile GolfFox. Por favor, baixe o app no seu dispositivo móvel."
        : "Passageiros devem acessar o sistema através do aplicativo mobile GolfFox. Por favor, baixe o app no seu dispositivo móvel.",
      showMobileInfo: true
    },
    unauthorized: {
      title: "Acesso Não Autorizado",
      description: "Você não tem permissão para acessar esta área."
    }
  }

  const message = messages[reason] || messages.unauthorized

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--bg)] via-[var(--bg-soft)] to-[var(--bg)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 backdrop-blur-xl bg-white/10 border-white/20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--error)]/20 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-[var(--error)]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{message.title}</h1>
            <p className="text-[var(--ink-muted)] mb-6">{message.description}</p>
            
            {message.showMobileInfo && (
              <div className="mb-6 p-4 bg-gradient-to-br from-[var(--brand)]/10 to-[var(--accent)]/10 border-2 border-[var(--brand)]/20 rounded-lg">
                <p className="text-sm font-semibold text-[var(--ink-strong)] mb-2">
                  📱 Aplicativo Mobile GolfFox
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  O aplicativo está disponível para iOS e Android. Entre em contato com o administrador do sistema para obter o link de download.
                </p>
              </div>
            )}
            
            {role && role !== 'unknown' && (
              <div className="mb-6 p-3 bg-[var(--bg-soft)] rounded-lg">
                <p className="text-sm text-[var(--ink-muted)]">
                  Seu papel atual: <span className="font-semibold">{role}</span>
                </p>
              </div>
            )}
            
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  )
}

