"use client"

import { useEffect, useRef, useState, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, Eye, EyeOff, Moon, Sun, Globe, ChevronDown, Route, Shield, TrendingUp, Zap, Sparkles } from "lucide-react"
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

// Componente de partículas animadas
const AnimatedParticles = () => {
  const particles = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/20 backdrop-blur-[1px]"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// Componente de gradiente animado
const AnimatedGradient = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(30, 58, 95, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(45, 74, 107, 0.2) 0%, transparent 50%)
          `,
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear",
        }}
      />
    </div>
  )
}

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

  // Validação contínua dos campos (apenas email, senha será validada pelo Supabase)
  useEffect(() => {
    setEmailValid(EMAIL_REGEX.test(sanitizeInput(email)))
    // Remover validação de formato de senha - apenas verificar se não está vazia
    setPasswordValid(password.trim().length > 0)
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

      // Removida validação de formato de senha - deixar Supabase validar
      // A validação de senha deve ser apenas no cadastro, não no login

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

  // Feature card component com animação
  const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative"
    >
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 group-hover:from-white/30 group-hover:to-white/10 group-hover:scale-110 transition-all duration-300 shadow-lg">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-white transition-colors">
            {title}
          </h3>
          <p className="text-white/70 text-xs leading-relaxed group-hover:text-white/80 transition-colors">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* Seção Esquerda - Promocional (apenas desktop) */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#0A2540] overflow-hidden"
      >
        <AnimatedGradient />
        <AnimatedParticles />
        
        {/* Gradiente overlay adicional */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-0" />
        
        <div className="relative z-10 flex flex-col justify-center items-start px-16 xl:px-20 text-white">
          {/* Logo com animação */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand)]/20 to-transparent opacity-50" />
              <img 
                src="/icons/golf_fox_logo.svg" 
                alt="GolfFox Logo" 
                className="w-20 h-20 relative z-10 drop-shadow-2xl"
              />
        <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "linear",
                }}
              />
            </motion.div>
          </motion.div>

          {/* Título principal */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl xl:text-5xl 2xl:text-6xl font-extrabold mb-6 leading-tight tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E7FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Gestão Inteligente
            <br />
            <span className="bg-gradient-to-r from-[var(--brand)] to-[#FB923C] bg-clip-text text-transparent">
              de Frotas
            </span>
          </motion.h1>

          {/* Descrição */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg xl:text-xl 2xl:text-2xl text-white/90 leading-relaxed max-w-lg mb-10 font-light"
          >
            Otimize rotas, monitore veículos em tempo real e reduza custos operacionais com a plataforma mais completa do mercado.
          </motion.p>

          {/* Link para site */}
          <motion.a
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            href="https://golffox.com.br"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ x: 5 }}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-base font-medium transition-colors group mb-12"
          >
            <span className="underline underline-offset-4 decoration-2 decoration-white/30 group-hover:decoration-white/60 transition-all">
              Saiba mais sobre a GolfFox
            </span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </motion.a>
          
          {/* Features destacadas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-2xl w-full">
            <FeatureCard 
              icon={Route} 
              title="Rotas Inteligentes" 
              description="Otimização automática de trajetos"
              delay={0.6}
            />
            <FeatureCard 
              icon={Zap} 
              title="Tempo Real" 
              description="Monitoramento em tempo real"
              delay={0.7}
            />
            <FeatureCard 
              icon={TrendingUp} 
              title="Analytics" 
              description="Relatórios e métricas detalhadas"
              delay={0.8}
            />
            <FeatureCard 
              icon={Shield} 
              title="Segurança" 
              description="Proteção de dados avançada"
              delay={0.9}
            />
          </div>
        </div>
      </motion.div>

      {/* Banner Promocional Mobile */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="lg:hidden relative bg-gradient-to-r from-[#0F172A] via-[#1E3A5F] to-[#0A2540] text-white py-8 px-6 overflow-hidden"
      >
        <AnimatedParticles />
        <div className="relative z-10 flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20 flex-shrink-0"
          >
            <img 
              src="/icons/golf_fox_logo.svg" 
              alt="GolfFox Logo" 
              className="w-12 h-12"
            />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold leading-tight mb-1">Gestão Inteligente de Frotas</h2>
            <p className="text-sm text-white/80">Plataforma completa para gestão de frotas</p>
          </div>
              </div>
      </motion.div>

      {/* Seção Direita - Formulário */}
      <div className="flex-1 lg:w-1/2 bg-gradient-to-br from-[#FAF9F7] via-white to-[#F8FAFC] flex flex-col min-h-screen relative">
        {/* Padrão de fundo sutil */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #1E3A5F 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />

        {/* Controles do Topo */}
        <div className="flex justify-end items-center gap-3 sm:gap-4 p-5 sm:p-6 lg:p-8 relative z-10">
          {/* Dropdown de Idioma */}
          <div className="relative" ref={languageDropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/80 hover:shadow-md transition-all duration-200 bg-white/50 backdrop-blur-sm border border-gray-200/50"
              aria-expanded={showLanguageDropdown}
              aria-haspopup="true"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{language}</span>
              <span className="sm:hidden">PT</span>
              <motion.div
                animate={{ rotate: showLanguageDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>
            {showLanguageDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-44 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 py-2 z-50 overflow-hidden"
              >
                {["Português", "English", "Español"].map((lang, index) => (
                  <motion.button
                    key={lang}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4, backgroundColor: "rgba(249, 115, 22, 0.1)" }}
                    onClick={() => {
                      setLanguage(lang)
                      setShowLanguageDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 ${
                      language === lang
                        ? "bg-gradient-to-r from-[var(--brand)]/10 to-transparent text-[var(--brand)] font-semibold border-l-2 border-[var(--brand)]"
                        : "text-gray-700 hover:text-gray-900"
                    }`}
                  >
                    {lang}
                  </motion.button>
                ))}
              </motion.div>
            )}
              </div>

          {/* Toggle Dark Mode */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl text-gray-700 hover:bg-white/80 hover:shadow-md transition-all duration-200 bg-white/50 backdrop-blur-sm border border-gray-200/50"
            aria-label="Toggle dark mode"
          >
            <motion.div
              animate={{ rotate: darkMode ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.div>
          </motion.button>
            </div>

        {/* Card de Login */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 xl:px-16 py-8 sm:py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-lg"
          >
            <Card className="relative p-8 sm:p-10 lg:p-12 bg-white shadow-xl border border-gray-100 overflow-hidden">
              {/* Efeito sutil de gradiente */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand)]/3 via-transparent to-[var(--accent)]/3 pointer-events-none" />

              {loading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-2xl">
                  <div className="animate-spin rounded-full w-10 h-10 border-3 border-[var(--brand)]/20 border-t-[var(--brand)]" />
                  <p className="mt-4 text-sm text-gray-600 font-medium">
                    Validando credenciais…
                  </p>
                </div>
              )}

              <div className="relative z-10">
                {/* Logo e Título */}
                <div className="mb-8 sm:mb-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[var(--brand)]/10 to-[var(--brand)]/5">
                      <img 
                        src="/icons/golf_fox_logo.svg" 
                        alt="GolfFox Logo" 
                        className="w-12 h-12 sm:w-14 sm:h-14"
                      />
                    </div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                      GOLF FOX
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight leading-tight">
                    Entre em sua conta
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600">
                    Acesse sua frota com inteligência e controle total.
                  </p>
                </div>

                {/* Mensagens de Erro/Sucesso */}
                {error && (
                  <div
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
                    role="alert"
                    aria-live="assertive"
                  >
                    {error}
                  </div>
                )}

                {success && !error && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
                    <span className="font-medium">Login realizado com sucesso!</span>
                  </div>
                )}

                {/* Formulário */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!loading) {
                  handleLogin()
                }
              }}
                  className="space-y-6"
                >
                  {/* Campo Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5" htmlFor="login-email">
                      E-mail
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[var(--brand)] transition-colors duration-200" />
                      </div>
                    <Input
                      id="login-email"
                      ref={emailInputRef}
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                        aria-invalid={email && !emailValid ? true : undefined}
                      autoComplete="email"
                        className={`pl-12 pr-4 h-12 bg-white border transition-all duration-200 ${
                          fieldErrors.email
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            : "border-gray-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-gray-300"
                        } rounded-lg text-base`}
                    />
                  </div>
                    {fieldErrors.email && (
                      <p className="mt-2 text-xs text-red-600 font-medium" aria-live="assertive">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Campo Senha */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5" htmlFor="login-password">
                      Senha
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[var(--brand)] transition-colors duration-200" />
                      </div>
                    <Input
                      id="login-password"
                        type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      ref={passwordInputRef}
                        aria-invalid={password && !passwordValid ? true : undefined}
                      autoComplete="current-password"
                        className={`pl-12 pr-12 h-12 bg-white border transition-all duration-200 ${
                          fieldErrors.password
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            : "border-gray-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-gray-300"
                        } rounded-lg text-base`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                  </div>
                    {fieldErrors.password && (
                      <p className="mt-2 text-xs text-red-600 font-medium" aria-live="assertive">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Checkbox e Link */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
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
                        setError("Funcionalidade em desenvolvimento")
                      }}
                      className="text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>

                  {/* Botão Entrar */}
                  <div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                          Validando...
                        </span>
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </div>
            </form>

                {/* Estado de Transição */}
                {transitioning && !loading && (
                  <div className="mt-6 flex items-center justify-center gap-2" aria-live="polite">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--brand)]/20 border-t-[var(--brand)]" />
                    <span className="text-sm text-gray-600">Redirecionando…</span>
                  </div>
                )}

                {/* Mensagem JavaScript */}
            <noscript>
                  <p className="mt-6 text-xs text-center text-gray-500">
                Ative o JavaScript para utilizar o login. Caso não seja possível, entre em contato com o suporte.
              </p>
            </noscript>
              </div>
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF9F7] to-white">
        <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full mx-auto"
            />
            <p className="mt-6 text-gray-600 font-medium">Carregando...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
