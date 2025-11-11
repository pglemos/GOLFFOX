"use client"

import { useEffect, useRef, useState, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, Eye, EyeOff, Moon, Sun, Globe, ChevronDown } from "lucide-react"
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
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState("Português")
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const languageDropdownRef = useRef<HTMLDivElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const [failedAttempts, setFailedAttempts] = useState<number>(0)
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState<boolean>(false)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false)
      }
    }

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLanguageDropdown])

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (session) {
        const nextUrl = searchParams.get('next')
        if (nextUrl) {
          const cleanNextUrl = decodeURIComponent(nextUrl).split('?')[0]
          router.push(cleanNextUrl)
        } else {
          const userRole = session.user.user_metadata?.role || getUserRoleByEmail(session.user.email)
          const cleanUrl = `/${userRole}`.split('?')[0]
          router.push(cleanUrl)
        }
      }
    })
  }, [router, searchParams])

  // Buscar CSRF token
  useEffect(() => {
    const fetchCsrf = async () => {
      try {
        const res = await fetch('/api/auth/csrf', { method: 'GET' })
        if (res.ok) {
          const data = await res.json()
          if (data?.token) setCsrfToken(data.token)
        }
      } catch (_e) {
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
      if (/^https?:\/\//i.test(decoded)) return null
      if (!decoded.startsWith('/')) return null
      const url = new URL(decoded, window.location.origin)
      url.searchParams.delete('company')
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
            { token, storage: rememberMe ? "both" : "session" }
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
      rememberMe,
    ]
  )

  // Estrelas decorativas para a seção esquerda
  const StarField = () => {
    const stars = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    }))

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Seção Esquerda - Promocional (apenas desktop) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[var(--accent)] via-[var(--accent-soft)] to-[var(--accent-dark)] overflow-hidden"
      >
        <StarField />
        <div className="relative z-10 flex flex-col justify-center items-start px-12 xl:px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-[var(--brand)] flex items-center justify-center mb-8 shadow-lg">
              <span className="text-4xl font-bold text-white">G</span>
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl xl:text-5xl font-bold mb-6 leading-tight"
          >
            Gestão Inteligente de Frotas
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg xl:text-xl text-white/90 leading-relaxed max-w-md"
          >
            Otimize rotas, monitore veículos em tempo real e reduza custos operacionais com a plataforma mais completa do mercado.
          </motion.p>
        </div>
      </motion.div>

      {/* Banner Promocional Mobile (apenas mobile) */}
      <div className="lg:hidden relative bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] text-white py-6 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <StarField />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--brand)] flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-2xl font-bold text-white">G</span>
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight">Gestão Inteligente de Frotas</h2>
            <p className="text-sm text-white/80 mt-1">Plataforma completa para gestão de frotas</p>
          </div>
        </div>
      </div>

      {/* Seção Direita - Formulário */}
      <div className="flex-1 lg:w-1/2 bg-[#FAF9F7] flex flex-col min-h-screen">
        {/* Controles do Topo */}
        <div className="flex justify-end items-center gap-3 sm:gap-4 p-4 sm:p-6">
          {/* Dropdown de Idioma */}
          <div className="relative" ref={languageDropdownRef}>
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-white/50 transition-colors"
              aria-expanded={showLanguageDropdown}
              aria-haspopup="true"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{language}</span>
              <span className="sm:hidden">PT</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showLanguageDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              >
                {["Português", "English", "Español"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang)
                      setShowLanguageDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      language === lang
                        ? "bg-gray-50 text-[var(--brand)] font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Toggle Dark Mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-gray-700 hover:bg-white/50 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Card de Login */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <Card className="relative p-6 sm:p-8 lg:p-10 bg-white shadow-xl border-0">
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-[var(--radius-xl)]"
                >
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--brand)] border-t-transparent" />
                  <span className="mt-4 text-sm text-gray-600 font-medium">Validando credenciais…</span>
                </motion.div>
              )}

              {/* Logo e Título */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand)] flex items-center justify-center">
                    <span className="text-xl font-bold text-white">G</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                    <span className="text-[var(--brand)]">G</span> GOLF FOX
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Entre em sua conta</h1>
                <p className="text-sm sm:text-base text-gray-600">Acesse sua frota com inteligência e controle total.</p>
              </div>

              {/* Mensagens de Erro/Sucesso */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </motion.div>
              )}

              {success && !error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2"
                >
                  <span className="font-medium">Login realizado com sucesso!</span>
                </motion.div>
              )}

              {/* Formulário */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!loading) {
                    handleLogin()
                  }
                }}
                className="space-y-5"
              >
                {/* Campo Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="login-email">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="login-email"
                      ref={emailInputRef}
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                      aria-invalid={email && !emailValid}
                      autoComplete="email"
                      className={`pl-12 h-12 bg-gray-50 border-gray-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 ${
                        fieldErrors.email ? "border-red-300 focus:border-red-400 focus:ring-red-200" : ""
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-2 text-xs text-red-600" aria-live="assertive">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Campo Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="login-password">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      ref={passwordInputRef}
                      aria-invalid={password && !passwordValid}
                      autoComplete="current-password"
                      className={`pl-12 pr-12 h-12 bg-gray-50 border-gray-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 ${
                        fieldErrors.password ? "border-red-300 focus:border-red-400 focus:ring-red-200" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-2 text-xs text-red-600" aria-live="assertive">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Checkbox e Link */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="h-4 w-4 rounded border-gray-300 data-[state=checked]:bg-[var(--brand)] data-[state=checked]:border-[var(--brand)] data-[state=checked]:text-white focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20"
                    />
                    <label
                      htmlFor="remember-me"
                      className="text-sm text-gray-600 cursor-pointer select-none hover:text-gray-700 transition-colors"
                    >
                      Manter conectado
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // TODO: Implementar recuperação de senha
                      setError("Funcionalidade em desenvolvimento")
                    }}
                    className="text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>

                {/* Botão Entrar */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Validando...
                    </span>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>

              {/* Estado de Transição */}
              {transitioning && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 flex items-center justify-center gap-2"
                  aria-live="polite"
                >
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--brand)] border-t-transparent" />
                  <span className="text-sm text-gray-600">Redirecionando…</span>
                </motion.div>
              )}

              {/* Mensagem JavaScript */}
              <noscript>
                <p className="mt-6 text-xs text-center text-gray-500">
                  Ative o JavaScript para utilizar o login. Caso não seja possível, entre em contato com o suporte.
                </p>
              </noscript>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--brand)] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
