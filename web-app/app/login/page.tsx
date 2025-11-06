"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Truck, Mail, Lock } from "lucide-react"
import { motion } from "framer-motion"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csrfToken, setCsrfToken] = useState<string>("")
  const [emailValid, setEmailValid] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)
  const formRef = useRef<HTMLDivElement | null>(null)

  // Demo accounts
  const demoAccounts = [
    { email: "golffox@admin.com", password: "senha123", role: "admin", label: "Admin" },
    { email: "operador@empresa.com", password: "senha123", role: "operator", label: "Operator" },
    { email: "transportadora@trans.com", password: "senha123", role: "carrier", label: "Carrier" },
    { email: "motorista@trans.com", password: "senha123", role: "driver", label: "Driver" },
    { email: "passageiro@empresa.com", password: "senha123", role: "passenger", label: "Passenger" },
  ]

  // Function to get user role based on email
  const getUserRoleByEmail = (email: string): string => {
    const account = demoAccounts.find(acc => acc.email === email)
    return account?.role || "driver"
  }

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (session) {
        const nextUrl = searchParams.get('next')
        if (nextUrl) {
          // Se há um parâmetro next, redireciona para lá
          router.push(decodeURIComponent(nextUrl))
        } else {
          // Senão, redireciona baseado no role
          const userRole = session.user.user_metadata?.role || getUserRoleByEmail(session.user.email)
          router.push(`/${userRole}`)
        }
      }
    })
  }, [router, searchParams])

  // Buscar CSRF token (GET) para proteger POST subsequente
  useEffect(() => {
    const fetchCsrf = async () => {
      try {
        const res = await fetch('/api/auth/csrf', { method: 'GET' })
        if (res.ok) {
          const data = await res.json()
          if (data?.token) setCsrfToken(data.token)
        }
      } catch (_e) {
        // Silenciar: rota /set-session irá rejeitar sem token
      }
    }
    fetchCsrf()
  }, [])

  // Validação contínua dos campos
  useEffect(() => {
    const emailSanitized = email.trim().replace(/[<>]/g, '')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setEmailValid(emailRegex.test(emailSanitized))
    setPasswordValid((password || '').length >= 8)
  }, [email, password])

  // Captura Enter no container do formulário
  useEffect(() => {
    const el = formRef.current
    if (!el) return
    const onKeyDown = (e: KeyboardEvent) => {
      const isEnter = (e as any).keyCode === 13 || e.key === 'Enter'
      if (!isEnter) return
      e.preventDefault()
      e.stopPropagation()
      if (emailValid && passwordValid && !loading) {
        handleLogin()
      } else {
        setError('Preencha email válido e senha (mínimo 8 caracteres)')
      }
    }
    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [emailValid, passwordValid, loading])

  const handleLogin = async (demoEmail?: string, demoPassword?: string) => {
    const loginEmail = demoEmail || email
    const loginPassword = demoPassword || password

    if (!loginEmail || !loginPassword) {
      setError("Por favor, preencha todos os campos")
      return
    }

    // Sanitização e validação inicial
    const emailSanitized = loginEmail.trim().replace(/[<>]/g, '')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailSanitized)) {
      setError('Email inválido')
      return
    }
    if ((loginPassword || '').length < 8) {
      setError('Senha deve ter ao menos 8 caracteres')
      return
    }

    setLoading(true)
    setError(null)
    console.log('🔐 Iniciando login para:', loginEmail)
    const prevCursor = typeof document !== 'undefined' ? document.body.style.cursor : ''
    if (typeof document !== 'undefined') document.body.style.cursor = 'progress'

    try {
      // Usar o novo sistema de autenticação
      const { AuthManager } = await import('@/lib/auth')
      // Envolver com timeout de 5s para erros de conexão
      const withTimeout = <T>(p: Promise<T>, ms: number) => new Promise<T>((resolve, reject) => {
        const id = setTimeout(() => reject(new Error('timeout')), ms)
        p.then((v) => { clearTimeout(id); resolve(v) }).catch((e) => { clearTimeout(id); reject(e) })
      })
      const result = await withTimeout(AuthManager.login(emailSanitized, loginPassword), 5000)

      if (result.success && result.user) {
        console.log('✅ Login bem-sucedido!')
        console.log('👤 Usuário:', result.user.email, 'Role:', result.user.role)

        // Garantir que o cookie de sessão seja persistido no servidor (lido pelo middleware)
        try {
          const resp = await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
            body: JSON.stringify({ user: result.user })
          })
          if (!resp.ok) {
            console.warn('⚠️ Falha ao setar cookie de sessão via API:', await resp.text())
          }
        } catch (e) {
          console.warn('⚠️ Erro ao chamar /api/auth/set-session:', e)
        }

        // Determinar URL de redirecionamento
        const nextUrl = searchParams.get('next')
        let redirectUrl = '/'

        if (nextUrl) {
          redirectUrl = nextUrl
          console.log('🔄 Redirecionando para URL solicitada:', redirectUrl)
        } else {
          // Redirecionar baseado na role
          redirectUrl = AuthManager.getRedirectUrl(result.user.role)
          console.log('🔄 Redirecionando baseado na role:', redirectUrl)
        }

        // Usar router.replace para evitar voltar ao login
        console.log('🚀 Executando redirecionamento...')
        router.replace(redirectUrl)
      } else {
        console.error('❌ Erro de login:', result.error)
        const msg = (result.error || '').toLowerCase()
        if (msg.includes('invalid') || msg.includes('unauthorized') || msg.includes('credenciais')) {
          setError('Credenciais inválidas')
        } else {
          setError(result.error || 'Erro no login')
        }
      }
    } catch (err: any) {
      console.error('💥 Erro inesperado no login:', err)
      if (String(err?.message).includes('timeout')) {
        setError('Erro de conexão (timeout). Tente novamente.')
      } else {
        setError('Erro inesperado durante o login')
      }
      // limpar senha por segurança, manter email
      setPassword('')
    } finally {
      setLoading(false)
      if (typeof document !== 'undefined') document.body.style.cursor = prevCursor
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--bg)] via-[var(--bg-soft)] to-[var(--bg)]">
      <div className="w-full max-w-md" ref={formRef} tabIndex={0}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 backdrop-blur-xl bg-white/10 border-white/20">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--brand)] flex items-center justify-center">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">GOLF FOX</h1>
              <p className="text-[var(--muted)]">Sistema de Gestão de Transportes</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-[var(--err)]/10 border border-[var(--err)] rounded-xl text-sm text-[var(--err)]">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)]" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!emailValid}
                    className={`pl-10 ${emailValid ? '' : 'border-[var(--err)]'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)]" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!passwordValid}
                    className={`pl-10 ${passwordValid ? '' : 'border-[var(--err)]'}`}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={() => handleLogin()}
              disabled={loading}
              className="w-full mb-6"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            {/* Contas de demonstração removidas conforme solicitação */}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
