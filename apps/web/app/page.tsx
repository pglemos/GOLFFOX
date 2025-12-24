"use client"

import { useState, useCallback, Suspense, useEffect } from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Shield, Zap } from "lucide-react"

import { LandingScene } from "@/components/landing/landing-scene"
import { LoginForm } from "@/components/landing/login-form"
import { AuthManager } from "@/lib/auth"
import { useRouter, useSearchParams } from "@/lib/next-navigation"
import { notifyError } from "@/lib/toast"


export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
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

  useEffect(() => {
    // Buscar CSRF token ao montar o componente
    fetch('/api/auth/csrf', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data?.token) {
          setCsrfToken(data.token)
        }
      })
      .catch(err => console.error("Erro ao buscar CSRF token:", err))
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
        throw new Error(data.error || "Falha ao autenticar")
      }

      const { user, token } = await result.json()

      await AuthManager.persistSession(
        { ...user, accessToken: token },
        { accessToken: token, storage: remember ? "both" : "session" }
      )

      const next = searchParams.get("next") || AuthManager.getRedirectUrl(user.role)
      router.push(next)
    } catch (err: any) {
      setError(err.message)
      notifyError(err, "Erro no login")
    } finally {
      setLoading(false)
    }
  }, [router, searchParams, csrfToken])

  return (
    <main className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      <LandingScene />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand/10 mb-4">
              <Sparkles className="h-8 w-8 text-brand" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">GOLFFOX</h1>
            <p className="text-slate-400">Sistema Inteligente de Transporte</p>
          </div>

          <LoginForm
            onLogin={handleLogin}
            loading={loading}
            error={error}
            onForgotPassword={() => { }}
          />

          <div className="mt-8 pt-6 border-t border-white/5 flex justify-center gap-6">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
              <Shield className="h-3 w-3" />
              Criptografia Bancária
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
              <Zap className="h-3 w-3" />
              Alta Performance
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
