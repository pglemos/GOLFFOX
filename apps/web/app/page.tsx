"use client"

import { useEffect, useRef, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AuthManager } from "@/lib/auth"
import { getUserRoleByEmail } from "@/lib/user-role"
import { debug, error as logError } from "@/lib/logger"
import { LoginErrorBoundary } from "./login-error-boundary"

const EMAIL_REGEX =
  /^(?:[a-zA-Z0-9_'^&/+\-])+(?:\.(?:[a-zA-Z0-9_'^&/+\-])+)*@(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/

const AUTH_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_ENDPOINT ?? "/api/auth/login"
const DEFAULT_LOGGED_URL = process.env.NEXT_PUBLIC_LOGGED_URL ?? "/operador"

const sanitizeInput = (value: string) => value.replace(/[<>"'`;()]/g, "").trim()

// Efeito de partículas minimalista (estilo Apple/Tesla)
const FloatingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${
              i === 0 ? 'rgba(249, 115, 22, 0.15)' : 
              i === 1 ? 'rgba(139, 92, 246, 0.1)' : 
              'rgba(59, 130, 246, 0.1)'
            } 0%, transparent 70%)`,
            filter: 'blur(60px)',
          }}
          initial={{
            x: i === 0 ? '-25%' : i === 1 ? '75%' : '40%',
            y: i === 0 ? '10%' : i === 1 ? '60%' : '-10%',
          }}
          animate={{
            x: i === 0 ? '-15%' : i === 1 ? '85%' : '50%',
            y: i === 0 ? '20%' : i === 1 ? '70%' : '0%',
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
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
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const [failedAttempts, setFailedAttempts] = useState<number>(0)
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState<boolean>(false)


  // Verificar sessão apenas uma vez no mount, com tratamento de erro robusto
  useEffect(() => {
    // Timeout maior para garantir que a página seja renderizada primeiro em mobile
    const timeoutId = setTimeout(() => {
      try {
        // Evitar interferência durante redirecionamentos explícitos pós-login
        if (typeof window !== 'undefined' && (window as any).__golffox_redirecting) {
          return
        }

        const nextParam = searchParams.get('next')

        // ✅ Usar apenas verificação de cookie - não usar Supabase auth na página de login
        // para evitar conflitos e erros de logout automático
        if (typeof window === 'undefined') return
        
        const hasSessionCookie = document.cookie.includes('golffox-session')
        if (!hasSessionCookie) {
          return
        }

        // Tentar decodificar o cookie para obter o role
        try {
          const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
          if (!cookieMatch) {
            // Cookie malformado, limpar e continuar na página de login
            document.cookie = 'golffox-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            return
          }

          const decoded = atob(cookieMatch[1])
          const userData = JSON.parse(decoded)
          
          if (!userData || !userData.role) {
            // Dados inválidos, limpar cookie
            document.cookie = 'golffox-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            return
          }
          
          const userRole = userData.role || getUserRoleByEmail(userData.email || '')

          const rawNext = nextParam
          const safeNext = (function sanitizePath(raw: string | null): string | null {
            if (!raw) return null
            try {
              const decoded = decodeURIComponent(raw)
              if (/^https?:\/:\/\//i.test(decoded)) return null
              if (!decoded.startsWith('/')) return null
              const url = new URL(decoded, window.location.origin)
              url.searchParams.delete('company')
              return url.pathname
            } catch {
              return null
            }
          })(rawNext)

          const isAllowedForRole = (role: string, path: string): boolean => {
            if (path.startsWith('/admin')) return role === 'admin'
            if (path.startsWith('/operador') || path.startsWith('/operator')) return ['admin', 'operador', 'operator'].includes(role)
            if (path.startsWith('/transportadora') || path.startsWith('/carrier')) return ['admin', 'transportadora'].includes(role)
            return true
          }

          let redirectUrl = userRole === 'admin' ? '/admin' :
                            (userRole === 'operador' || userRole === 'operator') ? '/operador' :
                            userRole === 'transportadora' ? '/transportadora' : '/dashboard'

          if (safeNext && isAllowedForRole(userRole, safeNext)) {
            redirectUrl = safeNext
          }

          // Aguardar um pouco mais em mobile para garantir que a página seja renderizada
          const isMobile = window.innerWidth < 1024
          const delay = isMobile ? 500 : 200
          
          if (userRole) {
            setTimeout(() => {
              window.location.href = redirectUrl
            }, delay)
          }
        } catch (err) {
          // Erro ao decodificar cookie - limpar e continuar na página de login
          console.warn('⚠️ Erro ao decodificar cookie:', err)
          try {
            document.cookie = 'golffox-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          } catch {}
        }
      } catch (err) {
        // Erro geral - apenas logar e continuar na página de login
        console.error('❌ Erro ao verificar sessão:', err)
      }
    }, 300) // Aguardar 300ms antes de verificar (aumentado de 100ms)

    return () => clearTimeout(timeoutId)
  }, [searchParams]) // Executar quando searchParams mudar

  // Buscar CSRF token
  useEffect(() => {
    const fetchCsrf = async () => {
      try {
        const res = await fetch('/api/auth/csrf', { 
          method: 'GET',
          credentials: 'include' // Incluir cookies na requisição
        })
        if (res.ok) {
          const data = await res.json()
          // Aceitar tanto 'token' quanto 'csrfToken' para compatibilidade
          const token = data?.csrfToken || data?.token
          if (token) {
            setCsrfToken(token)
            console.log('✅ CSRF token obtido:', token.substring(0, 10) + '...')
          } else {
            console.warn('⚠️ CSRF token não encontrado na resposta:', data)
          }
        } else {
          console.error('❌ Erro ao obter CSRF token:', res.status, res.statusText)
          // Tentar ler do cookie se a API falhar
          const cookieMatch = document.cookie.match(/golffox-csrf=([^;]+)/)
          if (cookieMatch) {
            setCsrfToken(cookieMatch[1])
            console.log('✅ CSRF token obtido do cookie')
          }
        }
      } catch (e) {
        console.error('❌ Erro ao buscar CSRF token:', e)
        // Tentar ler do cookie como fallback
        try {
          const cookieMatch = document.cookie.match(/golffox-csrf=([^;]+)/)
          if (cookieMatch) {
            setCsrfToken(cookieMatch[1])
            console.log('✅ CSRF token obtido do cookie (fallback)')
          } else {
            // Último recurso: gerar token local
            const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
            document.cookie = `golffox-csrf=${token}; path=/; SameSite=Lax; max-age=900`
            setCsrfToken(token)
            console.log('✅ CSRF token gerado localmente (fallback)')
          }
        } catch (cookieErr) {
          console.error('❌ Erro ao gerar CSRF token local:', cookieErr)
        }
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
    if (path.startsWith('/operador') || path.startsWith('/operator')) return ['admin', 'operador', 'operator'].includes(role)
    if (path.startsWith('/transportadora') || path.startsWith('/carrier')) return ['admin', 'transportadora', 'carrier'].includes(role)
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

      // ✅ FEEDBACK VISUAL IMEDIATO - mostrar loading ANTES de iniciar a requisição
      setLoading(true)
      setTransitioning(true)
      setError(null)
      
      const prevCursor = typeof document !== "undefined" ? document.body.style.cursor : ""
      if (typeof document !== "undefined") {
        document.body.style.cursor = "progress"
        // Forçar reflow para garantir que o loading seja renderizado imediatamente
        void document.body.offsetHeight
      }

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 10_000)
      const maskedEmail = sanitizedEmail.replace(/^(.{2}).+(@.*)$/, "$1***$2")

      try {
        debug("Iniciando autenticação", { email: maskedEmail }, "LoginPage")
        
        let token: string | undefined
        let user: { id: string; email: string; role?: string } | undefined
        
        // ✅ OBRIGATÓRIO: Usar apenas a API que verifica o banco de dados do Supabase
        // A API /api/auth/login verifica:
        // 1. Se o usuário existe na tabela users
        // 2. Se o usuário está ativo
        // 3. Obtém o role do banco de dados
        // 4. Autentica com Supabase Auth
        
        if (!csrfToken) {
          console.error('❌ CSRF token não encontrado')
          setError("Erro de segurança. Por favor, recarregue a página.")
          setLoading(false)
          setTransitioning(false)
          if (typeof document !== "undefined") document.body.style.cursor = prevCursor
          return
        }
        
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

        // ✅ Processar resposta da API
        if (!response.ok) {
          const apiError = await response.json().catch(() => ({}))
          const message = String(apiError?.error || "Falha ao autenticar")
          const normalized = message.toLowerCase()
          const code = String(apiError?.code || '')
          
          console.error('❌ Erro na API de login:', {
            status: response.status,
            message,
            code,
            email: maskedEmail,
            body: apiError
          })
          
          // Processar erros específicos
          if (normalized.includes("usuário não encontrado") || normalized.includes("não encontrado")) {
            setError("Usuário não encontrado no banco de dados. Verifique se o email está correto ou entre em contato com o administrador.")
            setFieldErrors((prev) => ({ ...prev, email: "E-mail não cadastrado" }))
          } else if (normalized.includes("inativo")) {
            setError("Usuário inativo. Entre em contato com o administrador.")
          } else if (response.status === 502 || code === 'supabase_unreachable' || normalized.includes('fetch failed')) {
            setError("Não foi possível conectar ao Supabase. Verifique as variáveis de ambiente (URL/Anon Key) e sua conexão.")
          } else if (response.status === 403 && (code === 'user_not_in_db' || normalized.includes('não cadastrado'))) {
            setError("Usuário não cadastrado no sistema. O acesso é permitido apenas para usuários criados via painel administrativo.")
            setFieldErrors((prev) => ({ ...prev, email: "Usuário não cadastrado" }))
          } else if (response.status === 403 && (code === 'no_company_mapping' || normalized.includes('sem empresa associada'))) {
            setError("Seu usuário operador não está associado a nenhuma empresa. Entre em contato com o administrador para associação.")
          } else if (response.status === 403 && code === 'company_inactive') {
            setError("A empresa associada ao seu usuário está inativa. Entre em contato com o administrador.")
          } else if (normalized.includes("invalid") || normalized.includes("credenciais")) {
            setError("Credenciais inválidas")
            setFieldErrors((prev) => ({ ...prev, password: "E-mail ou senha incorretos" }))
          } else if (normalized.includes("csrf")) {
            setError("Erro de segurança. Por favor, recarregue a página.")
          } else if (normalized.includes("timeout")) {
            setError("Tempo de resposta excedido. Tente novamente.")
          } else {
            setError(message || "Erro ao fazer login")
          }
          
          setLoading(false)
          setTransitioning(false)
          if (typeof document !== "undefined") document.body.style.cursor = prevCursor
          return
        }

        // ✅ Resposta bem-sucedida - obter dados do usuário
        const data = await response.json()
        token = data?.token
        user = data?.user
        const sessionData = data?.session
        if (user && !user.email && sessionData?.user?.email) {
          user.email = sessionData.user.email
        }

        console.log('✅ Login via API bem-sucedido (banco de dados verificado):', { 
          hasToken: !!token, 
          hasUser: !!user,
          hasSession: !!sessionData,
          userRole: user?.role,
          userId: user?.id,
          userEmail: user?.email?.replace(/^(.{2}).+(@.*)$/, '$1***$2')
        })

        if (!token || !user?.email || !user?.id) {
          console.error('❌ Resposta inválida da API:', { 
            token: !!token, 
            user: !!user,
            hasEmail: !!user?.email,
            hasId: !!user?.id
          })
          setError("Resposta inválida do servidor")
          setLoading(false)
          setTransitioning(false)
          if (typeof document !== "undefined") document.body.style.cursor = prevCursor
          return
        }

        // ✅ IMPORTANTE: O role vem do banco de dados (tabela users) via API
        // A API já verificou se o usuário existe no banco e obteve o role
        const userRoleFromDatabase = user.role
        
        if (!userRoleFromDatabase) {
          console.error('❌ Role não encontrado na resposta da API')
          setError("Erro ao determinar permissões do usuário")
          setLoading(false)
          setTransitioning(false)
          if (typeof document !== "undefined") document.body.style.cursor = prevCursor
          return
        }

        console.log('📊 Role obtido do banco de dados:', userRoleFromDatabase)
        console.log('📧 Email do usuário:', user.email)
        console.log('🆔 ID do usuário:', user.id)

        // ✅ OTIMIZADO: Processar sessão de forma síncrona e rápida
        // O cookie já foi definido pelo servidor, então apenas persistir no cliente
        AuthManager.persistSession(
          {
            id: user.id,
            email: user.email,
            role: userRoleFromDatabase,
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

        // ✅ Determinar URL de redirecionamento baseado no role do banco de dados
        const rawNext = searchParams.get("next")
        const safeNext = sanitizePath(rawNext)
        let redirectUrl: string
        
        // Se houver parâmetro ?next= e for permitido para o role, usar ele
        if (safeNext && isAllowedForRole(userRoleFromDatabase, safeNext)) {
          redirectUrl = safeNext
        } else {
          // Caso contrário, usar o role do banco para determinar o painel
          redirectUrl = AuthManager.getRedirectUrl(userRoleFromDatabase)
        }
        
        // Limpar query params da URL de redirecionamento
        redirectUrl = redirectUrl.split("?")[0]

        debug("Login bem-sucedido", { 
          redirectUrl, 
          email: maskedEmail, 
          role: userRoleFromDatabase,
          source: 'database'
        }, "LoginPage")
        
        // ✅ REDIRECIONAMENTO IMEDIATO - sem delays desnecessários
        // O cookie já foi definido pelo servidor na resposta HTTP
        // O navegador processa o Set-Cookie header automaticamente
        if (typeof window !== "undefined") {
          // Definir flag para evitar interferência do useEffect
          (window as any).__golffox_redirecting = true
          
          // Redirecionar IMEDIATAMENTE - sem esperar
          // O cookie será enviado automaticamente na próxima requisição
          window.location.href = redirectUrl
        } else {
          router.replace(redirectUrl)
        }
        
        return
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
        // Não resetar loading/transitioning se o redirecionamento está ocorrendo
        // Isso evita flicker antes do redirecionamento
        if (typeof window !== "undefined" && !(window as any).__golffox_redirecting) {
          setLoading(false)
          setTimeout(() => setTransitioning(false), 300)
        }
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

  // Estatística animada (estilo Apple)
  const StatItem = ({ value, label, delay }: { value: string, label: string, delay: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      <motion.div 
        className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent mb-2"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {value}
      </motion.div>
      <div className="text-sm md:text-base text-white/60 font-light tracking-wide">
        {label}
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-black w-full max-w-full">
      {/* Background com efeitos sutis */}
      <FloatingOrbs />
      
      {/* Grid pattern sutil (estilo Apple) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
      
      {/* Seção Esquerda - Hero Minimalista */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
      >
        <div className="relative z-10 max-w-2xl mx-auto text-center px-8">
          {/* Logo com destaque PREMIUM */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-20"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
              transition={{ duration: 0.6 }}
              className="relative inline-block"
            >
              {/* Glow effect animado */}
              <motion.div
                className="absolute inset-0 rounded-[40px] blur-3xl"
                animate={{
                  background: [
                    "radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)",
                    "radial-gradient(circle, rgba(249,115,22,0.6) 0%, transparent 70%)",
                    "radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)",
                  ],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Border gradient animado */}
              <div className="relative w-32 h-32 rounded-[40px] bg-gradient-to-br from-[#F97316] via-[#FB923C] to-[#EA580C] p-[3px] shadow-2xl shadow-orange-500/50">
                <div className="w-full h-full rounded-[37px] bg-black flex items-center justify-center relative overflow-hidden">
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-200%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut",
                    }}
                  />
                  
                  {/* Logo */}
                  <motion.img 
                    src="/icons/golf_fox_logo.svg" 
                    alt="Golf Fox" 
                    className="w-20 h-20 relative z-10 drop-shadow-2xl"
                    animate={{
                      filter: [
                        "drop-shadow(0 0 20px rgba(249,115,22,0.5))",
                        "drop-shadow(0 0 30px rgba(249,115,22,0.7))",
                        "drop-shadow(0 0 20px rgba(249,115,22,0.5))",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </div>

              {/* Pulse ring effect */}
              <motion.div
                className="absolute inset-0 rounded-[40px] border-2 border-orange-500/30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            </motion.div>
          </motion.div>

          {/* Headline minimalista (estilo Apple) */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl xl:text-7xl font-bold mb-8 leading-[1.1] tracking-tight"
          >
            <span className="text-white">O futuro do</span>
            <br />
            <span className="bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#FDBA74] bg-clip-text text-transparent">
              transporte corporativo
            </span>
          </motion.h1>

          {/* Subtítulo clean */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl text-white/60 mb-16 font-light leading-relaxed max-w-xl mx-auto"
          >
            Gerencie frotas, otimize rotas e monitore operações em tempo real com inteligência artificial.
          </motion.p>

          {/* Estatísticas (estilo Nike/Tesla) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-3 gap-8 pt-12 border-t border-white/10"
          >
            <StatItem value="24/7" label="Monitoramento" delay={0.5} />
            <StatItem value="100%" label="Rastreável" delay={0.6} />
            <StatItem value="< 1s" label="Tempo Real" delay={0.7} />
          </motion.div>
        </div>
      </motion.div>

      {/* Seção Direita - Formulário Minimalista */}
      <div className="flex-1 lg:w-1/2 bg-white flex flex-col min-h-screen relative w-full max-w-full overflow-x-hidden">
        {/* Barra superior minimalista (apenas desktop) */}
        <div className="hidden lg:flex justify-end items-center p-8 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-gray-400"
          >
            Novo por aqui? <span className="text-gray-900 font-medium cursor-not-allowed">Fale com vendas</span>
          </motion.div>
            </div>

        {/* Formulário de Login Minimalista */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8 md:py-12 relative z-10 w-full max-w-full overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto min-w-0"
          >
            <div className="relative w-full min-w-0">
              {/* Logo mobile com destaque */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="lg:hidden mb-8 sm:mb-12 text-center"
              >
                <div className="relative inline-block mb-4">
                  {/* Glow mobile */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl blur-2xl"
                    animate={{
                      background: [
                        "radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)",
                        "radial-gradient(circle, rgba(249,115,22,0.5) 0%, transparent 70%)",
                        "radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#F97316] via-[#FB923C] to-[#EA580C] p-[2.5px] shadow-xl shadow-orange-500/30">
                    <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center relative overflow-hidden">
                      {/* Shine effect mobile */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-100 to-transparent"
                        animate={{
                          x: ['-200%', '200%'],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: "easeInOut",
                        }}
                      />
                      <img 
                        src="/icons/golf_fox_logo.svg" 
                        alt="Golf Fox" 
                        className="w-12 h-12 sm:w-14 sm:h-14 relative z-10"
                      />
                    </div>
                  </div>
                </div>
                
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#F97316] to-[#EA580C] bg-clip-text text-transparent"
                >
                  Golf Fox
                </motion.h2>
              </motion.div>

              {/* Loading overlay minimalista */}
              <AnimatePresence>
                {loading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/98 backdrop-blur-sm rounded-3xl"
                  >
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-10 h-10 border-2 border-gray-200 border-t-[#F97316] rounded-full"
                    />
                    <motion.p 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="mt-4 text-sm text-gray-500 font-medium"
                    >
                      {transitioning ? "Entrando..." : "Autenticando"}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Título minimalista */}
              <div className="mb-8 sm:mb-10 md:mb-12">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
                  Entrar
                </h1>
                <p className="text-base sm:text-lg text-gray-500 font-light">
                  Acesse sua conta Golf Fox
                </p>
              </div>

              {/* Mensagens minimalistas */}
              <AnimatePresence mode="wait">
                    {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-50/50 border border-red-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-red-600"
                    role="alert"
                  >
                    {error}
                  </motion.div>
                )}

                {success && !error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 sm:mb-8 p-3 sm:p-4 bg-green-50/50 border border-green-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-green-600 flex items-center gap-2"
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>Login realizado com sucesso!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Formulário minimalista */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!loading && !transitioning) {
                    handleLogin()
                  }
                }}
                className="space-y-4 sm:space-y-5 md:space-y-6"
              >
                {/* Campo Email */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700" htmlFor="login-email">
                    E-mail
                  </label>
                  <div className="relative">
                    <Input
                      id="login-email"
                      ref={emailInputRef}
                      type="email"
                      placeholder="nome@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading && !transitioning && password.trim().length > 0) {
                          e.preventDefault()
                          passwordInputRef.current?.focus()
                        }
                      }}
                    autoComplete="email"
                    className={`w-full h-12 sm:h-14 px-3 sm:px-4 bg-gray-50 border ${
                        fieldErrors.email
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-200 focus:border-[#F97316] focus:ring-orange-100"
                      } rounded-xl sm:rounded-2xl text-base transition-all focus:ring-2 focus:bg-white placeholder:text-gray-400`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-2 text-xs text-red-600" aria-live="assertive">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Campo Senha */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700" htmlFor="login-password">
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading && !transitioning) {
                          e.preventDefault()
                          handleLogin()
                        }
                      }}
                      ref={passwordInputRef}
                      autoComplete="current-password"
                      className={`w-full h-12 sm:h-14 px-3 sm:px-4 pr-10 sm:pr-12 bg-gray-50 border ${
                        fieldErrors.password
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-200 focus:border-[#F97316] focus:ring-orange-100"
                      } rounded-xl sm:rounded-2xl text-base transition-all focus:ring-2 focus:bg-white placeholder:text-gray-400`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </button>
                    {fieldErrors.password && (
                      <p className="mt-2 text-xs text-red-600" aria-live="assertive">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                </div>

                {/* Opções extras */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 text-xs sm:text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group touch-manipulation">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="h-4 w-4 rounded border-gray-300 data-[state=checked]:bg-[#F97316] data-[state=checked]:border-[#F97316]"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                      Lembrar-me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setError("Funcionalidade em desenvolvimento")}
                    className="text-gray-600 hover:text-gray-900 transition-colors touch-manipulation text-xs sm:text-sm"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                {/* Botão de Login Premium */}
                <motion.div whileHover={{ scale: loading || transitioning ? 1 : 1.01 }} whileTap={{ scale: loading || transitioning ? 1 : 0.99 }}>
                  <Button
                    type="submit"
                    disabled={loading || transitioning}
                    className="w-full h-12 sm:h-14 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#F97316] text-white font-semibold text-sm sm:text-base shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl sm:rounded-2xl relative overflow-hidden group touch-manipulation"
                  >
                    {loading || transitioning ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          className="rounded-full h-4 w-4 border-2 border-white/30 border-t-white"
                        />
                        {transitioning ? "Entrando..." : "Autenticando"}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Entrar
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Footer */}
              <div className="mt-8 sm:mt-10 md:mt-12 text-center">
                <p className="text-xs sm:text-sm text-gray-500">
                  Protegido por{" "}
                  <span className="text-gray-700 font-medium">Golf Fox Security</span>
                </p>
              </div>

              <noscript>
                <p className="mt-6 text-xs text-center text-gray-500">
                  Ative o JavaScript para utilizar o login.
                </p>
              </noscript>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <LoginErrorBoundary>
      <Suspense fallback={<div />}> 
        <LoginContent />
      </Suspense>
    </LoginErrorBoundary>
  )
}
