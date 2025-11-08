"use client"

import { useEffect, useRef, useState, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Truck, Mail, Lock } from "lucide-react"
import { motion } from "framer-motion"
import { AuthManager } from "@/lib/auth"
import { getUserRoleByEmail } from "@/lib/user-role"
import { debug, error as logError } from "@/lib/logger"

const EMAIL_REGEX =
  /^(?:[a-zA-Z0-9_'^&/+\-])+(?:\.(?:[a-zA-Z0-9_'^&/+\-])+)*@(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/

const AUTH_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_ENDPOINT ?? "/api/auth/login"
const DEFAULT_LOGGED_URL = process.env.NEXT_PUBLIC_LOGGED_URL ?? "/operator"

const sanitizeInput = (value: string) => value.replace(/[<>"'`;()]/g, "").trim()

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
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [success, setSuccess] = useState(false)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const [failedAttempts, setFailedAttempts] = useState<number>(0)
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState<boolean>(false)

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
    setEmailValid(EMAIL_REGEX.test(sanitizeInput(email)))
    setPasswordValid(PASSWORD_REGEX.test(password.trim()))
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

  const handleLogin = useCallback(
    async (demoEmail?: string, demoPassword?: string) => {
      const rawEmail = demoEmail ?? email
      const rawPassword = demoPassword ?? password

      const sanitizedEmail = sanitizeInput(rawEmail)
      const sanitizedPassword = (demoPassword ?? password).trim()

      setFieldErrors({})
      setSuccess(false)

      if (!sanitizedEmail || !sanitizedPassword) {
        setError("Por favor, preencha todos os campos obrigatórios")
        if (!sanitizedEmail) {
          setFieldErrors((prev) => ({ ...prev, email: "Informe o e-mail" }))
          emailInputRef.current?.focus()
        } else {
          setFieldErrors((prev) => ({ ...prev, password: "Informe a senha" }))
          passwordInputRef.current?.focus()
        }
        return
      }

      if (!EMAIL_REGEX.test(sanitizedEmail)) {
        setError("Email inválido")
        setFieldErrors((prev) => ({ ...prev, email: "Utilize um e-mail válido" }))
        emailInputRef.current?.focus()
        return
      }

      if (!PASSWORD_REGEX.test(sanitizedPassword)) {
        setError("Senha deve ter ao menos 8 caracteres, com número e letra maiúscula")
        setFieldErrors((prev) => ({
          ...prev,
          password: "Senha precisa conter 8 caracteres, incluindo número e letra maiúscula",
        }))
        passwordInputRef.current?.focus()
        return
      }

      const now = Date.now()
      if (blockedUntil && now < blockedUntil) {
        const seconds = Math.ceil((blockedUntil - now) / 1000)
        setError(`Muitas tentativas. Aguarde ${seconds}s antes de tentar novamente.`)
        passwordInputRef.current?.focus()
        return
      }

      setLoading(true)
      setTransitioning(true)
      setError(null)
      const prevCursor = typeof document !== "undefined" ? document.body.style.cursor : ""
      if (typeof document !== "undefined") document.body.style.cursor = "progress"
      passwordInputRef.current?.focus()

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 10_000)
      const maskedEmail = sanitizedEmail.replace(/^(.{2}).+(@.*)$/, "$1***$2")

      try {
        debug("Iniciando autenticação", { email: maskedEmail }, "LoginPage")
        const response = await fetch(AUTH_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({ email: sanitizedEmail, password: sanitizedPassword }),
          signal: controller.signal,
          credentials: "include",
        })
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          const token: string | undefined = data?.token
          const user = data?.user

          if (!token || !user?.email) {
            throw new Error("invalid_response")
          }

          AuthManager.persistSession(
            {
              id: user.id,
              email: user.email,
              role: user.role ?? getUserRoleByEmail(user.email),
              accessToken: token,
            },
            { token, storage: "both" }
          )

          setFailedAttempts(0)
          setBlockedUntil(null)
          setFieldErrors({})
          setSuccess(true)

          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("golffox:auth-success", { detail: user }))
            sessionStorage.setItem("golffox-last-login", new Date().toISOString())
          }

          const rawNext = searchParams.get("next")
          const safeNext = sanitizePath(rawNext)
          let redirectUrl = DEFAULT_LOGGED_URL

          const resolvedRole = user.role ?? getUserRoleByEmail(user.email)
          if (safeNext && isAllowedForRole(resolvedRole, safeNext)) {
            redirectUrl = safeNext
          } else {
            redirectUrl = AuthManager.getRedirectUrl(resolvedRole)
          }
          redirectUrl = redirectUrl.split("?")[0]

          debug("Login bem-sucedido", { redirectUrl, email: maskedEmail }, "LoginPage")
          setTimeout(() => router.push(redirectUrl), 400)
          return
        }

        const apiError = await response.json().catch(() => ({}))
        const message = String(apiError?.error || "Falha ao autenticar")
        const normalized = message.toLowerCase()

        if (normalized.includes("csrf")) {
          setError("Sessão expirada. Atualize a página e tente novamente.")
        } else if (normalized.includes("timeout")) {
          setError("Tempo limite excedido. Verifique sua conexão.")
        } else if (normalized.includes("email")) {
          setError("E-mail não encontrado")
          setFieldErrors((prev) => ({ ...prev, email: "E-mail não localizado" }))
          emailInputRef.current?.focus()
        } else {
          setError("Credenciais inválidas")
          setFieldErrors((prev) => ({ ...prev, password: "Credenciais inválidas" }))
          passwordInputRef.current?.focus()
        }

        setFailedAttempts((prev) => {
          const next = prev + 1
          const delay = Math.min(2 ** next * 300, 60_000)
          setBlockedUntil(Date.now() + delay)
          return next
        })
      } catch (err) {
        clearTimeout(timeoutId)
        if ((err as Error).name === "AbortError") {
          setError("Tempo limite excedido. Verifique sua conexão.")
        } else {
          setError("Erro inesperado durante o login")
        }
        setFieldErrors((prev) => ({ ...prev, password: "Não foi possível autenticar" }))
        setPassword("")
        passwordInputRef.current?.focus()
        logError("Erro inesperado no login", { error: err }, "LoginPage")
      } finally {
        setLoading(false)
        setTimeout(() => setTransitioning(false), 800)
        if (typeof document !== "undefined") document.body.style.cursor = prevCursor
      }
    },
    [
      blockedUntil,
      csrfToken,
      email,
      password,
      router,
      searchParams,
    ]
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--bg)] via-[var(--bg-soft)] to-[var(--bg)]">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative p-8 backdrop-blur-xl bg-white/10 border-white/20 overflow-hidden">
            {loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--brand)] border-t-transparent" />
                <span className="mt-3 text-sm text-[var(--muted)]">Validando credenciais…</span>
              </div>
            )}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--brand)] flex items-center justify-center">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">GOLF FOX</h1>
              <p className="text-[var(--muted)]">Sistema de Gestão de Transportes</p>
            </div>

            {error && (
              <div
                className="mb-4 p-4 bg-[var(--err)]/10 border border-[var(--err)] rounded-xl text-sm text-[var(--err)]"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}

            {success && !error && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-400 rounded-xl text-sm text-emerald-600 flex items-center justify-center gap-2">
                <span className="font-medium">Login realizado com sucesso!</span>
              </div>
            )}

            <form
              tabIndex={0}
              noValidate
              onKeyDown={(e) => {
                if (e.key === "Enter" || (e as any).keyCode === 13) {
                  e.preventDefault()
                  if (!loading) {
                    handleLogin()
                  }
                }
              }}
              onSubmit={(e) => {
                e.preventDefault()
                if (!loading) {
                  handleLogin()
                }
              }}
            >
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="login-email">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)]" />
                    <Input
                      id="login-email"
                      ref={emailInputRef}
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                      aria-invalid={!emailValid}
                      autoComplete="email"
                      className={`pl-10 ${emailValid ? "" : "border-[var(--err)]"}`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-2 text-xs text-[var(--err)]" aria-live="assertive">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="login-password">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)]" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      ref={passwordInputRef}
                      aria-invalid={!passwordValid}
                      autoComplete="current-password"
                      className={`pl-10 ${passwordValid ? "" : "border-[var(--err)]"}`}
                    />
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-2 text-xs text-[var(--err)]" aria-live="assertive">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mb-6"
                onTouchEnd={(e) => {
                  e.preventDefault()
                  if (!loading) {
                    handleLogin()
                  }
                }}
              >
                {loading ? "Validando..." : "Entrar"}
              </Button>
            </form>

            {transitioning && (
              <div className="flex items-center justify-center" aria-live="polite">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2" />
                <span className="text-sm text-[var(--muted)]">Redirecionando…</span>
              </div>
            )}

            <noscript>
              <p className="mt-6 text-xs text-center text-[var(--muted)]">
                Ative o JavaScript para utilizar o login. Caso não seja possível, entre em contato com o suporte.
              </p>
            </noscript>
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
