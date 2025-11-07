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
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const [failedAttempts, setFailedAttempts] = useState<number>(0)
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState<boolean>(false)

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
          const cleanNextUrl = decodeURIComponent(nextUrl).split('?')[0]
          router.push(cleanNextUrl)
        } else {
          // Senão, redireciona baseado no role
          const userRole = session.user.user_metadata?.role || getUserRoleByEmail(session.user.email)
          // Garantir URL limpa sem parâmetros
          const cleanUrl = `/${userRole}`.split('?')[0]
          router.push(cleanUrl)
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
        // Gerar token CSRF cliente (double-submit cookie) caso rota não exista
        try {
          const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
          document.cookie = `golffox-csrf=${token}; path=/; SameSite=Lax`
          setCsrfToken(token)
        } catch {}
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

  // Carregar estado de tentativas do localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('golffox-login-attempts')
      if (raw) {
        const data = JSON.parse(raw)
        if (typeof data?.failedAttempts === 'number') setFailedAttempts(data.failedAttempts)
        if (typeof data?.blockedUntil === 'number') setBlockedUntil(data.blockedUntil)
      }
    } catch {}
  }, [])

  // Persistir estado de tentativas
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('golffox-login-attempts', JSON.stringify({ failedAttempts, blockedUntil }))
    } catch {}
  }, [failedAttempts, blockedUntil])

  // Auxiliares de segurança e navegação
  const sanitizePath = (raw: string | null): string | null => {
    if (!raw) return null
    try {
      const decoded = decodeURIComponent(raw)
      // Permitir apenas paths internos
      if (/^https?:\/\//i.test(decoded)) return null
      if (!decoded.startsWith('/')) return null
      const url = new URL(decoded, window.location.origin)
      // Remover parâmetro ?company= se existir
      url.searchParams.delete('company')
      // Retornar apenas pathname (sem query params indesejados)
      return url.pathname
    } catch {
      return null
    }
  }

  const isAllowedForRole = (role: string, path: string): boolean => {
    if (path.startsWith('/admin')) return role === 'admin'
    if (path.startsWith('/operator')) return ['admin', 'operator'].includes(role)
    if (path.startsWith('/carrier')) return ['admin', 'carrier'].includes(role)
    return true
  }

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

    // Proteção simples contra brute force (cooldown baseado em falhas)
    const now = Date.now()
    if (blockedUntil && now < blockedUntil) {
      const seconds = Math.ceil((blockedUntil - now) / 1000)
      setError(`Muitas tentativas. Aguarde ${seconds}s antes de tentar novamente.`)
      // manter o foco no campo de senha
      passwordInputRef.current?.focus()
      return
    }

    setLoading(true)
    setTransitioning(true)
    setError(null)
    console.log('🔐 Iniciando login para:', loginEmail)
    const prevCursor = typeof document !== 'undefined' ? document.body.style.cursor : ''
    if (typeof document !== 'undefined') document.body.style.cursor = 'progress'
    // garantir foco no campo de senha durante autenticação
    passwordInputRef.current?.focus()

    try {
      // Usar o novo sistema de autenticação
      const { AuthManager } = await import('@/lib/auth')
      // Envolver com timeout estrito de 300ms para validar credenciais rapidamente
      function withTimeout<T>(p: Promise<T>, ms: number) {
        return new Promise<T>((resolve, reject) => {
          const id = setTimeout(() => reject(new Error('timeout')), ms)
          p.then((v) => { clearTimeout(id); resolve(v) }).catch((e) => { clearTimeout(id); reject(e) })
        })
      }
      // Cache de sessão: se já autenticado e email coincide, usar diretamente
      const stored = AuthManager.getStoredUser?.() || null
      const sessionShortcut = (async () => {
        if (stored && stored.email === emailSanitized) {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user?.email === emailSanitized) {
              return { success: true, user: stored }
            }
          } catch {}
        }
        throw new Error('no_session_cache')
      })()

      let result: any
      try {
        result = await Promise.race([
          withTimeout(AuthManager.login(emailSanitized, loginPassword), 300),
          sessionShortcut,
        ])
      } catch (raceErr) {
        // Se timeout de 300ms ocorrer, continuar aguardando até 1500ms como fallback
        try {
          result = await withTimeout(AuthManager.login(emailSanitized, loginPassword), 1500)
        } catch (finalErr) {
          throw finalErr
        }
      }

      if (result.success && result.user) {
        console.log('✅ Login bem-sucedido!')
        console.log('👤 Usuário:', result.user.email, 'Role:', result.user.role)

        // reset tentativas em sucesso
        setFailedAttempts(0)
        setBlockedUntil(null)

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

        // Determinar URL de redirecionamento (sanitizada e validada)
        const rawNext = searchParams.get('next')
        const safeNext = sanitizePath(rawNext)
        let redirectUrl = '/'

        if (safeNext && isAllowedForRole(result.user.role, safeNext)) {
          redirectUrl = safeNext
          console.log('🔄 Redirecionando para URL solicitada (validada):', redirectUrl)
        } else {
          // Redirecionar baseado na role - URL limpa sem parâmetros
          const userRole = result.user.role || getUserRoleByEmail(result.user.email)
          redirectUrl = `/${userRole}`
          console.log('🔄 Redirecionando baseado na role:', redirectUrl)
        }

        // Garantir que redirectUrl não tenha parâmetros indesejados
        redirectUrl = redirectUrl.split('?')[0]

        // Validação simples do token JWT antes do redirect
        try {
          const parts = (result.user.accessToken || '').split('.')
          if (parts.length !== 3) throw new Error('invalid_jwt_structure')
        } catch (jwtErr) {
          setError('Sessão inválida. Tente novamente.')
          setLoading(false)
          setTransitioning(false)
          return
        }

        // Navegação programática (Next router usa history.pushState sob o capô)
        console.log('🚀 Executando redirecionamento suave para:', redirectUrl)
        router.push(redirectUrl)
      } else {
        console.error('❌ Erro de login:', result.error)
        const msg = (result.error || '').toLowerCase()
        if (msg.includes('invalid') || msg.includes('unauthorized') || msg.includes('credenciais')) {
          setError('Credenciais inválidas')
        } else {
          setError(result.error || 'Erro no login')
        }
        // atualizar tentativas e definir bloqueio progressivo
        setFailedAttempts((prev) => {
          const next = prev + 1
          // política: a partir de 5 falhas, bloquear 60s; a partir de 10, bloquear 300s
          if (next >= 10) {
            setBlockedUntil(Date.now() + 300 * 1000)
          } else if (next >= 5) {
            setBlockedUntil(Date.now() + 60 * 1000)
          }
          return next
        })
        // manter foco no campo de senha
        passwordInputRef.current?.focus()
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
      // manter foco no campo de senha
      passwordInputRef.current?.focus()
    } finally {
      setLoading(false)
      setTimeout(() => setTransitioning(false), 800)
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (emailValid && passwordValid && !loading) {
                          handleLogin()
                        } else {
                          setError('Preencha email válido e senha (mínimo 8 caracteres)')
                        }
                      }
                    }}
                    ref={passwordInputRef}
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

            {transitioning && (
              <div className="flex items-center justify-center mb-2" aria-live="polite">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2" />
                <span className="text-sm text-[var(--muted)]">Redirecionando…</span>
              </div>
            )}

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
