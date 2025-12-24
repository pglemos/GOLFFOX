"use client"

import { useState, useCallback, Suspense, useEffect } from "react"
import { motion } from "framer-motion"
import {
  ChevronRight,
  LayoutDashboard
} from "lucide-react"

import { SiteHeader } from "@/components/landing/site-header"
import { SiteFooter } from "@/components/landing/site-footer"
import { HeroBackground } from "@/components/landing/hero-background"
import { BentoFeatures } from "@/components/landing/bento-features"
import { LoginForm } from "@/components/landing/login-form"
import { AuthManager } from "@/lib/auth"
import { useRouter, useSearchParams } from "@/lib/next-navigation"
import { notifyError } from "@/lib/toast"
import { logError } from "@/lib/logger"
import { Badge } from "@/components/ui/badge"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csrfToken, setCsrfToken] = useState<string>("")

  // Fetch CSRF Token
  useEffect(() => {
    fetch('/api/auth/csrf', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data?.token) setCsrfToken(data.token)
      })
      .catch((err) => logError('Erro ao buscar CSRF token', { error: err }, 'LoginPage'))
  }, [])

  const handleLogin = useCallback(async (email: string, pass: string, remember: boolean) => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken
        },
        body: JSON.stringify({ email, password: pass }),
      })

      if (!result.ok) {
        const data = await result.json()
        throw new Error(data.error || "Credenciais inválidas. Tente novamente.")
      }

      const { user, token } = await result.json()

      await AuthManager.persistSession(
        { ...user, accessToken: token },
        { accessToken: token, storage: remember ? "both" : "session" }
      )

      const next = searchParams.get("next") || AuthManager.getRedirectUrl(user.role)
      if (next) {
        // Usar window.location para garantir um redirecionamento limpo com a nova sessão
        window.location.href = next
      }
    } catch (err: any) {
      setError(err.message)
      notifyError(err, "Falha na autenticação")
    } finally {
      setLoading(false)
    }
  }, [router, searchParams, csrfToken])

  return (
    <main className="relative min-h-screen bg-[#020617] text-white selection:bg-brand/30 selection:text-brand-foreground overflow-x-hidden">
      <HeroBackground />
      <SiteHeader />

      {/* Main Content Area */}
      <div className="relative z-10 pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column: Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            {/* Version Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="outline" className="py-1.5 px-4 rounded-full border-brand/20 bg-brand/5 text-brand hover:bg-brand/10 transition-colors backdrop-blur-sm">
                <span className="mr-2 font-bold px-1.5 py-0.5 rounded bg-brand text-white text-[10px]">NOVITÀ</span>
                Fretamento Inteligente 4.0 disponível
                <ChevronRight className="ml-1 h-3 w-3" />
              </Badge>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              A evolução do <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Fretamento Corporativo
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
              Transforme o transporte de seus colaboradores com rotas inteligentes, controle de embarque digital e gestão de frota em tempo real.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
              <div className="grid grid-cols-3 gap-6 w-full max-w-md border-t border-white/5 pt-8">
                <div className="text-center sm:text-left">
                  <p className="text-2xl font-bold text-white">200k+</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Passageiros/dia</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-2xl font-bold text-white">15k+</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Rotas Otimizadas</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-2xl font-bold text-white">99%</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Pontualidade</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Login Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="lg:col-span-5 w-full relative"
          >
            <div className="relative rounded-[32px] p-[1px] overflow-hidden bg-gradient-to-b from-white/20 to-white/0 shadow-2xl shadow-black/50 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-b from-brand/10 to-transparent opacity-50" />

              <div className="relative rounded-[31px] bg-[#020617]/80 p-8 sm:p-10 border border-white/5">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand to-orange-600 flex items-center justify-center shadow-lg shadow-brand/20">
                      <LayoutDashboard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Portal do Cliente</h2>
                      <p className="text-slate-400 text-sm">Gerencie suas linhas e passageiros</p>
                    </div>
                  </div>

                  <LoginForm
                    onLogin={handleLogin}
                    loading={loading}
                    error={error}
                    onForgotPassword={() => { }}
                  />
                </div>
              </div>
            </div>

            {/* Elemento Decorativo flutuante atrás do card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 bg-brand/10 blur-[100px] rounded-full pointer-events-none" />
          </motion.div>
        </div>

        {/* Bento Grid Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mt-32 border-t border-white/5 pt-24"
        >
          <div className="text-center mb-16 max-w-3xl mx-auto px-4">
            <Badge variant="outline" className="mb-4 bg-brand/5 border-brand/20 text-brand">EXPERIÊNCIA PREMIUM</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Conforto e Eficiência em cada viagem</h2>
            <p className="text-slate-400 text-lg">
              Ofereça a melhor experiência de deslocamento para seus colaboradores com tecnologia de ponta e segurança absoluta.
            </p>
          </div>

          <BentoFeatures />
        </motion.div>
      </div>

      <SiteFooter />
    </main>
  )
}
