"use client"

import { useEffect, useRef, useState, useCallback, Suspense, useMemo, memo } from "react"
import { useRouter, useSearchParams } from "@/lib/next-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Shield, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AuthManager } from "@/lib/auth"
import { getUserRoleByEmail } from "@/lib/user-role"
import { debug, error as logError } from "@/lib/logger"
import { LoginErrorBoundary } from "./login-error-boundary"

const EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/

const DEFAULT_AUTH_ENDPOINT = "/api/auth/login"
const AUTH_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_ENDPOINT ?? DEFAULT_AUTH_ENDPOINT
const DEFAULT_LOGGED_URL = process.env.NEXT_PUBLIC_LOGGED_URL ?? "/operador"

function resolveAuthEndpoint(raw: string): string {
  const trimmed = (raw || DEFAULT_AUTH_ENDPOINT).trim()
  if (!trimmed) return DEFAULT_AUTH_ENDPOINT
  if (trimmed.startsWith("/")) return trimmed

  // Treat as path-like value (e.g. "api/auth/login")
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return `/${trimmed.replace(/^\/+/, "")}`
  }

  // Absolute URL (helps avoid CORS issues when host differs like 0.0.0.0/127.0.0.1/localhost)
  try {
    const url = new URL(trimmed)
    const isLocalHost =
      url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "0.0.0.0"
    if (typeof window !== "undefined" && isLocalHost) {
      return `${url.pathname}${url.search}`
    }
    return url.toString()
  } catch {
    return DEFAULT_AUTH_ENDPOINT
  }
}

const sanitizeInput = (value: string) => value.replace(/[<>"'`;()]/g, "").trim()

// Hook para verificar preferência de movimento reduzido
function useReducedMotion(): boolean {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setShouldReduceMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setShouldReduceMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return shouldReduceMotion
}

// Efeito de partículas otimizado com memoização
const FloatingOrbs = memo(() => {
  const shouldReduceMotion = useReducedMotion()
  const orbs = useMemo(() => [
    { color: 'rgba(249, 115, 22, 0.12)', x: ['-25%', '-15%'], y: ['10%', '20%'], duration: 20 },
    { color: 'rgba(139, 92, 246, 0.08)', x: ['75%', '85%'], y: ['60%', '70%'], duration: 25 },
    { color: 'rgba(59, 130, 246, 0.08)', x: ['40%', '50%'], y: ['-10%', '0%'], duration: 30 },
  ], [])

  if (shouldReduceMotion) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute w-[500px] h-[500px] rounded-full will-change-transform"
          style={{
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: 'blur(60px)',
          }}
          initial={{
            x: orb.x[0],
            y: orb.y[0],
          }}
          animate={{
            x: orb.x[1],
            y: orb.y[1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
})
FloatingOrbs.displayName = "FloatingOrbs"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedAuthEndpoint = useMemo(() => resolveAuthEndpoint(AUTH_ENDPOINT), [])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csrfToken, setCsrfToken] = useState<string>("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const [failedAttempts, setFailedAttempts] = useState<number>(0)
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState<boolean>(false)
  const sessionCheckRef = useRef<boolean>(false)
  const redirectingRef = useRef<boolean>(false)

  // Verificar sessão apenas uma vez no mount, com tratamento de erro robusto
  useEffect(() => {
    const nextParam = searchParams.get('next')

    // Evitar múltiplas verificações - verificar apenas uma vez
    if (sessionCheckRef.current) {
      return
    }

    // Evitar interferência durante redirecionamentos explícitos pós-login
    if (typeof window !== 'undefined' && (window as any).__golffox_redirecting) {
      return
    }

    // Marcar como verificado imediatamente para evitar múltiplas execuções
    sessionCheckRef.current = true

    // Timeout maior para garantir que a página seja renderizada primeiro em mobile
    const timeoutId = setTimeout(() => {
      try {
        const rawNext = nextParam || null

        // ✅ Usar apenas verificação de cookie - não usar Supabase auth na página de login
        // para evitar conflitos e erros de logout automático
        if (typeof window === 'undefined') return

        const hasSessionCookie = document.cookie.includes('golffox-session')

        if (!hasSessionCookie) {
          return
        }

        // Verificar se já estamos redirecionando para evitar loops
        if (redirectingRef.current) {
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

          const safeNext = sanitizePath(rawNext)

          const isAllowedForRole = (role: string, path: string): boolean => {
            if (path.startsWith('/admin')) return role === 'admin'
            // empresa = empresa contratante (antigo operador)
            if (path.startsWith('/empresa')) return ['admin', 'empresa', 'operador'].includes(role)
            // operador = transportadora
            if (path.startsWith('/transportadora')) return ['admin', 'operador', 'transportadora', 'transportadora'].includes(role)
            return true
          }

          // Normalizar roles para PT-BR
          const normalizedRole =
            userRole === 'operador' ? 'empresa' :  // antigo operador → empresa
              userRole === 'transportadora' ? 'operador' :  // antigo transportadora → operador
                userRole === 'motorista' ? 'motorista' :
                  userRole === 'passageiro' ? 'passageiro' : userRole

          // Redirect baseado na role normalizada
          let redirectUrl =
            normalizedRole === 'admin' ? '/admin' :
              normalizedRole === 'empresa' ? '/empresa' :  // Empresa Contratante
                normalizedRole === 'operador' || normalizedRole === 'transportadora' ? '/transportadora' :  // Operador da Transportadora
                  '/empresa' // Default para empresa

          if (safeNext && isAllowedForRole(userRole, safeNext)) {
            redirectUrl = safeNext
          }

          // Verificar se já estamos na URL de destino para evitar loops
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname
            const currentSearch = window.location.search

            // Se já estamos na URL de destino (com ou sem query params), não redirecionar
            if (currentPath === redirectUrl || (currentPath === redirectUrl && !currentSearch.includes('next='))) {
              return
            }

            // Se estamos na raiz sem query params e temos sessão válida, redirecionar
            // Mas apenas se não estivermos já redirecionando
            if (currentPath === '/' && !currentSearch && redirectUrl !== '/') {
              // OK para redirecionar
            } else if (currentPath === redirectUrl) {
              return
            }
          }

          // Marcar como redirecionando antes de executar o redirect
          redirectingRef.current = true
          if (typeof window !== 'undefined') {
            (window as any).__golffox_redirecting = true
          }

          if (userRole) {
            // Usar router.push para evitar reload completo e manter estado
            // Isso evita que o middleware seja executado novamente antes do cookie ser processado
            try {
              router.push(redirectUrl)
            } catch (err) {
              // Fallback para window.location.href se router.push falhar
              console.warn('Router.push failed, using window.location.href:', err)
              window.location.href = redirectUrl
            }
          }
        } catch (err) {
          // Erro ao decodificar cookie - limpar e continuar na página de login
          console.warn('⚠️ Erro ao decodificar cookie:', err)
          try {
            document.cookie = 'golffox-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          } catch { }
        }
      } catch (err) {
        // Erro geral - apenas logar e continuar na página de login
        console.error('❌ Erro ao verificar sessão:', err)
      }
    }, 300) // Aguardar 300ms antes de verificar (aumentado de 100ms)

    return () => {
      clearTimeout(timeoutId)
    }
  }, []) // Remover searchParams da dependência para evitar loops

  // Buscar CSRF token
  useEffect(() => {
    const fetchCsrf = async () => {
      console.log('🔍 [CSRF] Iniciando busca do CSRF token...')
      try {
        const res = await fetch('/api/auth/csrf', {
          method: 'GET',
          credentials: 'include' // Incluir cookies na requisição
        })
        console.log('🔍 [CSRF] Resposta da API:', { status: res.status, ok: res.ok })
        if (res.ok) {
          const data = await res.json()
          console.log('🔍 [CSRF] Dados recebidos:', { hasCsrfToken: !!data?.csrfToken, hasToken: !!data?.token, hasData: !!data?.data, keys: Object.keys(data) })
          // A API retorna { success: true, data: { token, csrfToken } }
          // Aceitar tanto 'token' quanto 'csrfToken' e também dentro de 'data'
          const token = data?.data?.token || data?.data?.csrfToken || data?.csrfToken || data?.token
          if (token) {
            setCsrfToken(token)
            console.log('✅ [CSRF] Token obtido e definido:', token.substring(0, 10) + '...')
          } else {
            console.warn('⚠️ [CSRF] Token não encontrado na resposta:', data)
            // Tentar ler do cookie
            const cookieMatch = document.cookie.match(/golffox-csrf=([^;]+)/)
            if (cookieMatch) {
              setCsrfToken(cookieMatch[1])
              console.log('✅ [CSRF] Token obtido do cookie após resposta vazia')
            }
          }
        } else {
          const errorText = await res.text().catch(() => '')
          console.error('❌ [CSRF] Erro ao obter CSRF token:', res.status, res.statusText, errorText)
          // Tentar ler do cookie se a API falhar
          const cookieMatch = document.cookie.match(/golffox-csrf=([^;]+)/)
          if (cookieMatch) {
            setCsrfToken(cookieMatch[1])
            console.log('✅ [CSRF] Token obtido do cookie após erro da API')
          } else {
            // Gerar token local como fallback
            const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
            document.cookie = `golffox-csrf=${token}; path=/; SameSite=Lax; max-age=900`
            setCsrfToken(token)
            console.log('✅ [CSRF] Token gerado localmente após erro da API')
          }
        }
      } catch (e: any) {
        console.error('❌ [CSRF] Erro ao buscar CSRF token:', e?.message || e)
        // Tentar ler do cookie como fallback
        try {
          const cookieMatch = document.cookie.match(/golffox-csrf=([^;]+)/)
          if (cookieMatch) {
            setCsrfToken(cookieMatch[1])
            console.log('✅ [CSRF] Token obtido do cookie (fallback)')
          } else {
            // Último recurso: gerar token local
            const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
            document.cookie = `golffox-csrf=${token}; path=/; SameSite=Lax; max-age=900`
            setCsrfToken(token)
            console.log('✅ [CSRF] Token gerado localmente (fallback)')
          }
        } catch (cookieErr) {
          console.error('❌ [CSRF] Erro ao gerar CSRF token local:', cookieErr)
        }
      }
    }
    fetchCsrf()
  }, [])

  // Habilitar submit sem depender de blur (evita botão travado no mobile)
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
    } catch { }
  }, [])

  // Persistir estado de tentativas
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('golffox-login-attempts', JSON.stringify({ failedAttempts, blockedUntil }))
    } catch { }
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
    // empresa = empresa contratante (antigo operador)
    if (path.startsWith('/empresa')) return ['admin', 'empresa', 'operador'].includes(role)
    // operador = gestor da transportadora
    if (path.startsWith('/transportadora')) return ['admin', 'operador', 'transportadora', 'transportadora'].includes(role)
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
      const requestTimeoutMs = process.env.NODE_ENV === 'development' ? 60_000 : 15_000
      const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs)
      const maskedEmail = sanitizedEmail.replace(/^(.{2}).+(@.*)$/, "$1***$2")

      try {
        debug("Iniciando autenticação", { email: maskedEmail }, "LoginPage")

        // ✅ OBRIGATÓRIO: Usar apenas a API que verifica o banco de dados do Supabase
        // A API /api/auth/login verifica:
        // 1. Se o usuário existe na tabela users
        // 2. Se o usuário está ativo
        // 3. Obtém o role do banco de dados
        // 4. Autentica com Supabase Auth

        // Obter CSRF token (do estado ou buscar se não estiver disponível)
        let finalCsrfToken = csrfToken

        if (!finalCsrfToken) {
          console.log('🔍 [CSRF] Token não encontrado no estado, tentando obter...')
          // Tentar ler do cookie primeiro
          const cookieMatch = document.cookie.match(/golffox-csrf=([^;]+)/)
          if (cookieMatch) {
            finalCsrfToken = cookieMatch[1]
            setCsrfToken(finalCsrfToken)
            console.log('✅ [CSRF] Token obtido do cookie')
          } else {
            // Tentar buscar da API
            try {
              const res = await fetch('/api/auth/csrf', {
                method: 'GET',
                credentials: 'include'
              })
              if (res.ok) {
                const data = await res.json()
                // A API retorna { success: true, data: { token, csrfToken } }
                const token = data?.data?.token || data?.data?.csrfToken || data?.csrfToken || data?.token
                if (token) {
                  finalCsrfToken = token
                  setCsrfToken(token)
                  console.log('✅ [CSRF] Token obtido da API')
                } else {
                  console.error('❌ [CSRF] Token não encontrado na resposta da API')
                  setError("Erro de segurança. Por favor, recarregue a página.")
                  setLoading(false)
                  setTransitioning(false)
                  if (typeof document !== "undefined") document.body.style.cursor = prevCursor
                  return
                }
              } else {
                console.error('❌ [CSRF] Erro ao obter token da API:', res.status, res.statusText)
                setError("Erro de segurança. Por favor, recarregue a página.")
                setLoading(false)
                setTransitioning(false)
                if (typeof document !== "undefined") document.body.style.cursor = prevCursor
                return
              }
            } catch (e: any) {
              console.error('❌ [CSRF] Erro ao buscar token:', e?.message || e)
              setError("Erro de segurança. Por favor, recarregue a página.")
              setLoading(false)
              setTransitioning(false)
              if (typeof document !== "undefined") document.body.style.cursor = prevCursor
              return
            }
          }
        }

        if (!finalCsrfToken) {
          console.error('❌ [CSRF] Token não encontrado após todas as tentativas')
          setError("Erro de segurança. Por favor, recarregue a página.")
          setLoading(false)
          setTransitioning(false)
          if (typeof document !== "undefined") document.body.style.cursor = prevCursor
          return
        }

        console.log('✅ [CSRF] Token final obtido:', finalCsrfToken.substring(0, 10) + '...')
        console.log('🔍 [LOGIN] Preparando requisição:', {
          endpoint: resolvedAuthEndpoint,
          hasEmail: !!sanitizedEmail,
          hasPassword: !!sanitizedPassword,
          emailLength: sanitizedEmail?.length,
          hasCsrfToken: !!finalCsrfToken
        })

        let response: Response
        try {
          response = await fetch(resolvedAuthEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": finalCsrfToken,
            },
            body: JSON.stringify({ email: sanitizedEmail, password: sanitizedPassword }),
            signal: controller.signal,
            credentials: "include",
          })
          console.log('✅ [LOGIN] Resposta recebida:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
          })
        } catch (fetchError: any) {
          console.error('❌ [LOGIN] Erro na requisição fetch:', {
            name: fetchError?.name,
            message: fetchError?.message,
            stack: fetchError?.stack?.substring(0, 500)
          })
          throw fetchError
        }
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
        let data: any
        try {
          const responseText = await response.text()
          console.log('🔍 [LOGIN] Resposta texto (primeiros 200 chars):', responseText.substring(0, 200))
          data = JSON.parse(responseText)
          console.log('✅ [LOGIN] JSON parseado com sucesso:', {
            hasToken: !!data?.token,
            hasUser: !!data?.user,
            hasSession: !!data?.session
          })
        } catch (parseError: any) {
          console.error('❌ [LOGIN] Erro ao fazer parse do JSON:', {
            message: parseError?.message,
            stack: parseError?.stack?.substring(0, 500)
          })
          throw new Error(`Erro ao processar resposta do servidor: ${parseError?.message || 'JSON inválido'}`)
        }

        const token = data?.token
        const user = data?.user
        const sessionData = data?.session
        const refreshToken = data?.refreshToken ?? sessionData?.refresh_token
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
        // ✅ Incluir name e avatar_url para exibição no Topbar
        await AuthManager.persistSession(
          {
            id: user.id,
            email: user.email,
            role: userRoleFromDatabase,
            accessToken: token,
            name: user.name || user.email.split('@')[0],
            avatar_url: user.avatar_url || null,
          },
          { accessToken: token, refreshToken, storage: rememberMe ? "both" : "session" }
        )

        setFailedAttempts(0)
        setBlockedUntil(null)
        setFieldErrors({})
        setSuccess(true)

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("golffox:auth-success", { detail: user }))
          sessionStorage.setItem("golffox-last-login", new Date().toISOString())
        }

        // ✅ Verificar se o role permite acesso web
        // motorista e passageiro devem usar app mobile
        if (userRoleFromDatabase === 'motorista' || userRoleFromDatabase === 'passageiro') {
          setError(`Seu perfil (${userRoleFromDatabase}) deve acessar o sistema através do aplicativo mobile. Por favor, baixe o app GolfFox no seu dispositivo móvel.`)
          setLoading(false)
          setTransitioning(false)
          if (typeof document !== "undefined") document.body.style.cursor = prevCursor

          // Limpar sessão se foi criada
          try {
            await AuthManager.logout()
          } catch (err) {
            console.warn('Erro ao limpar sessão:', err)
          }

          return
        }

        // ✅ Determinar URL de redirecionamento baseado no role do banco de dados
        const rawNext = searchParams.get("next")
        const safeNext = sanitizePath(rawNext)
        let redirectUrl: string | null

        // Se houver parâmetro ?next= e for permitido para o role, usar ele
        if (safeNext && isAllowedForRole(userRoleFromDatabase, safeNext)) {
          redirectUrl = safeNext
        } else {
          // Caso contrário, usar o role do banco para determinar o painel
          redirectUrl = AuthManager.getRedirectUrl(userRoleFromDatabase)
        }

        // Se não houver URL de redirecionamento (motorista/passageiro), mostrar erro
        if (!redirectUrl) {
          setError(`Seu perfil (${userRoleFromDatabase}) deve acessar o sistema através do aplicativo mobile. Por favor, baixe o app GolfFox no seu dispositivo móvel.`)
          setLoading(false)
          setTransitioning(false)
          if (typeof document !== "undefined") document.body.style.cursor = prevCursor

          // Limpar sessão se foi criada
          try {
            await AuthManager.logout()
          } catch (err) {
            console.warn('Erro ao limpar sessão:', err)
          }

          return
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
          (window as any).__golffox_just_logged_in = true

          // ✅ CORREÇÃO: Usar window.location.replace para garantir redirecionamento completo
          // window.location.replace não adiciona ao histórico, evitando loops
          // window.location.href força um reload completo e garante que o middleware veja o cookie
          // Isso também remove o parâmetro ?next= da URL
          console.log('🔄 Redirecionando para:', redirectUrl)
          
          // ✅ IMPORTANTE: Não usar setTimeout - redirecionar imediatamente
          // O cookie já foi definido na resposta HTTP, então está disponível
          // O delay pode causar problemas com o middleware interceptando antes
          window.location.replace(redirectUrl)
        } else {
          router.replace(redirectUrl)
        }

        return
      } catch (err: any) {
        clearTimeout(timeoutId)

        console.error('❌ [LOGIN] Erro capturado no catch:', {
          name: err?.name,
          message: err?.message,
          stack: err?.stack?.substring(0, 500),
          type: typeof err,
          keys: err ? Object.keys(err) : []
        })

        if (err?.name === "AbortError") {
          setError("Tempo limite excedido. Verifique sua conexão.")
        } else {
          const errorMessage = err?.message || 'Erro desconhecido'
          console.error('❌ [LOGIN] Mensagem de erro:', errorMessage)
          setError(`Erro inesperado durante o login: ${errorMessage}`)
        }
        setFieldErrors((prev) => ({ ...prev, password: "Não foi possível autenticar" }))
        setPassword("")
        passwordInputRef.current?.focus()
        logError("Erro inesperado no login", {
          error: err,
          errorName: err?.name,
          errorMessage: err?.message,
          errorStack: err?.stack?.substring(0, 500)
        }, "LoginPage")
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
      resolvedAuthEndpoint,
    ]
  )

  // Estatística sem animações (estilo minimalista)
  const StatItem = memo(({ value, label }: { value: string, label: string }) => {
    return (
      <div className="text-center">
        <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent mb-2">
          {value}
        </div>
        <div className="text-sm md:text-base text-white/60 font-light tracking-wide">
          {label}
        </div>
      </div>
    )
  })
  StatItem.displayName = "StatItem"

  // Memoizar valores computados para performance
  const canSubmit = useMemo(() => !loading && !transitioning, [loading, transitioning])
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-muted lg:bg-black w-full max-w-full">
      {/* Background com efeitos sutis otimizados (somente desktop) */}
      <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
        <FloatingOrbs />
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]"
          style={{ willChange: 'auto' }}
        />
      </div>

      {/* Seção Esquerda - Hero Minimalista */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-black"
      >
        <div className="relative z-10 max-w-2xl mx-auto text-center px-8">
          {/* Logo com destaque PREMIUM */}
          <motion.div
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-20"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
              transition={{ duration: 0.6 }}
              className="relative inline-block"
            >
              {/* Glow effect animado otimizado */}
              {!shouldReduceMotion && (
                <motion.div
                  className="absolute inset-0 rounded-[40px] blur-3xl will-change-transform"
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
              )}

              {/* Border gradient animado */}
              <div className="relative w-32 h-32 rounded-[40px] bg-gradient-to-br from-[#F97316] via-[#FB923C] to-[#EA580C] p-[3px] shadow-2xl shadow-brand/50">
                <div className="w-full h-full rounded-[37px] bg-black flex items-center justify-center relative overflow-hidden">
                  {/* Shine effect otimizado */}
                  {!shouldReduceMotion && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent will-change-transform"
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
                  )}

                  {/* Logo otimizado */}
                  <motion.img
                    src="/icons/golf_fox_logo.svg"
                    alt="Golf Fox"
                    className="w-20 h-20 relative z-10 drop-shadow-2xl"
                    loading="eager"
                    fetchPriority="high"
                    animate={shouldReduceMotion ? {} : {
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

              {/* Pulse ring effect otimizado */}
              {!shouldReduceMotion && (
                <motion.div
                  className="absolute inset-0 rounded-[40px] border-2 border-brand/30 will-change-transform"
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
              )}
            </motion.div>
          </motion.div>

          {/* Headline ultra premium (estilo Apple) */}
          <motion.h1
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: shouldReduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl xl:text-7xl font-bold mb-8 leading-[1.1] tracking-tight"
          >
            <span className="text-white">O futuro do</span>
            <br />
            <span className={`bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#FDBA74] bg-clip-text text-transparent ${!shouldReduceMotion ? 'bg-[length:200%_100%] animate-[gradient-shift_3s_ease_infinite]' : ''}`}>
              transporte corporativo
            </span>
          </motion.h1>

          {/* Subtítulo premium */}
          <motion.p
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: shouldReduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl text-white/70 mb-16 font-light leading-relaxed max-w-xl mx-auto"
          >
            Gerencie frotas, otimize rotas e monitore operações em tempo real com inteligência artificial.
          </motion.p>

          {/* Estatísticas premium (estilo minimalista) */}
          <div className="grid grid-cols-3 gap-8 pt-12">
            <StatItem value="24/7" label="Monitoramento" />
            <StatItem value="100%" label="Rastreável" />
            <StatItem value="< 1s" label="Tempo Real" />
          </div>
        </div>
      </motion.div>

      {/* Seção Direita - Formulário Minimalista */}
      <div className="flex-1 lg:w-1/2 flex flex-col min-h-screen relative w-full max-w-full overflow-x-hidden lg:bg-white bg-muted">
        {/* Barra superior minimalista (apenas desktop) */}
        <div className="hidden lg:flex justify-end items-center p-8 relative z-10">
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-ink-light"
          >
            Novo por aqui? <span className="text-ink-strong font-medium cursor-pointer hover:text-brand transition-colors">Fale com vendas</span>
          </motion.div>
        </div>

        {/* Formulário de Login Minimalista */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8 md:py-12 relative z-10 w-full max-w-full overflow-x-hidden">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto min-w-0"
          >
            {/* Mobile: Card wrapper Premium */}
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden bg-gradient-to-br from-white via-white to-bg-soft rounded-3xl shadow-2xl border border-border p-6 sm:p-8 mb-8 relative overflow-hidden"
            >
              {/* Background pattern sutil */}
              <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,rgb(0,0,0)_1px,transparent_0)] bg-[length:24px_24px]" />

              <div className="relative w-full min-w-0 z-10">
                {/* Logo mobile Premium */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:hidden mb-8 text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center justify-center gap-3 mb-4"
                  >
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-ink-strong to-brand bg-clip-text text-transparent">
                      GOLF FOX
                    </h2>
                  </motion.div>
                </motion.div>

                {/* Mobile: Loading overlay estilo Linear premium - ultra minimalista */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                      className="lg:hidden absolute inset-0 z-50 flex items-center justify-center rounded-3xl"
                    >
                      {/* Backdrop blur premium estilo Vercel */}
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl" />

                      {/* Conteúdo centralizado ultra minimalista */}
                      <div className="relative z-10 flex flex-col items-center gap-3">
                        {/* Spinner ultra fino estilo Linear */}
                        <div className="relative w-6 h-6">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-[1.5px] border-border-light/60 border-t-[#F97316]"
                          />
                        </div>

                        {/* Texto ultra discreto */}
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-xs font-normal text-ink-muted tracking-tight"
                        >
                          {transitioning ? "Entrando..." : "Autenticando"}
                        </motion.p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mobile: Título Premium */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="lg:hidden mb-8"
                >
                  <h1 className="text-3xl sm:text-4xl font-bold text-ink-strong mb-3 tracking-tight">
                    Entre em sua conta
                  </h1>
                  <p className="text-base sm:text-lg text-ink-muted leading-relaxed font-light">
                    Acesse sua frota com inteligência e controle total.
                  </p>
                </motion.div>

                {/* Mobile: Mensagens Premium */}
                <div className="lg:hidden mb-6">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="p-4 bg-gradient-to-r from-error-light to-error-light/80 border-2 border-error/20 rounded-2xl text-sm text-error shadow-sm backdrop-blur-sm"
                        role="alert"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-error flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">!</span>
                          </div>
                          <p className="flex-1 font-medium">{error}</p>
                        </div>
                      </motion.div>
                    )}

                    {success && !error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="p-4 bg-gradient-to-r from-success-light to-success-light/80 border-2 border-success/20 rounded-2xl text-sm text-success shadow-sm backdrop-blur-sm flex items-center gap-3"
                      >
                        <Sparkles className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">Login realizado com sucesso!</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile: Formulário Premium */}
                <form
                  action={resolvedAuthEndpoint}
                  method="post"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!loading && !transitioning) {
                      handleLogin()
                    }
                  }}
                  className="lg:hidden space-y-5"
                >
                  {/* Campo Email Premium */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-ink-strong mb-2" htmlFor="login-email">
                      E-mail
                    </label>
                    <div className="relative group">
                      {/* Mail Icon Premium */}
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-ink-muted">
                        <Mail className="h-5 w-5" />
                      </div>

                      <Input
                        id="login-email"
                        ref={emailInputRef}
                        name="email"
                        type="email"
                        required
                        placeholder="golffox@admin.com"
                        value={email}
                        onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !loading && !transitioning && password.trim().length > 0) {
                            e.preventDefault()
                            passwordInputRef.current?.focus()
                          }
                        }}
                        autoComplete="email"
                        className={`w-full h-14 pl-12 pr-4 bg-gradient-to-br from-bg-soft to-bg border-2 ${fieldErrors.email
                          ? "border-error focus:border-error focus:ring-2 focus:ring-error/20 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
                          : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20 hover:border-strong"
                          } rounded-2xl text-base focus:bg-white placeholder:text-ink-muted font-medium`}
                      />
                      {fieldErrors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-xs text-error font-medium flex items-center gap-1"
                          aria-live="assertive"
                        >
                          <span>⚠</span> {fieldErrors.email}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  {/* Campo Senha Premium */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-ink-strong mb-2" htmlFor="login-password">
                      Senha
                    </label>
                    <div className="relative group">
                      {/* Lock Icon Premium */}
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-ink-muted">
                        <Lock className="h-5 w-5" />
                      </div>

                      <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
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
                        className={`w-full h-14 pl-12 pr-14 bg-gradient-to-br from-bg-soft to-bg border-2 ${fieldErrors.password
                          ? "border-error focus:border-error focus:ring-2 focus:ring-error/20 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
                          : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20 hover:border-strong"
                          } rounded-2xl text-base focus:bg-white placeholder:text-ink-muted font-medium`}
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-brand transition-colors h-9 w-9 flex items-center justify-center rounded-xl hover:bg-bg-hover z-10 touch-manipulation"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </motion.button>
                      {fieldErrors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-xs text-error font-medium flex items-center gap-1"
                          aria-live="assertive"
                        >
                          <span>⚠</span> {fieldErrors.password}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="flex items-center justify-between text-sm w-full"
                  >
                    <motion.label
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-3 cursor-pointer group touch-manipulation flex-nowrap"
                    >
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="h-5 w-5 rounded-lg border-2 border-border data-[state=checked]:bg-brand data-[state=checked]:border-brand transition-all duration-200"
                      />
                      <span className="whitespace-nowrap text-ink-muted group-hover:text-ink-strong transition-colors font-medium">
                        Manter conectado
                      </span>
                    </motion.label>
                    <motion.button
                      type="button"
                      onClick={() => console.log("Forgot password clicked")}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-brand hover:text-brand-hover font-semibold transition-colors touch-manipulation text-sm whitespace-nowrap"
                    >
                      Esqueceu sua senha?
                    </motion.button>
                  </motion.div>

                  {/* Botão de Login Ultra Premium Otimizado */}
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.5 }}
                    whileHover={canSubmit && !shouldReduceMotion ? { scale: 1.02 } : {}}
                    whileTap={canSubmit && !shouldReduceMotion ? { scale: 0.98 } : {}}
                  >
                    <Button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full h-14 bg-gradient-to-r from-brand via-brand-hover to-brand bg-[length:200%_100%] hover:bg-[position:100%_0] text-white font-bold text-base shadow-brand-lg hover:shadow-brand-lg transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none rounded-2xl relative overflow-hidden group touch-manipulation will-change-transform"
                    >
                      {/* Shimmer effect otimizado */}
                      {!shouldReduceMotion && !loading && !transitioning && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent will-change-transform"
                          animate={{
                            x: ['-200%', '200%'],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1,
                            ease: "easeInOut",
                          }}
                        />
                      )}
                      {loading || transitioning ? (
                        <span className="flex items-center justify-center gap-3 relative z-10">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="rounded-full h-5 w-5 border-2 border-white/30 border-t-white"
                          />
                          <span className="font-semibold">{transitioning ? "Entrando..." : "Autenticando"}</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-3 relative z-10">
                          <span className="font-bold">Entrar</span>
                          {!shouldReduceMotion && (
                            <motion.div
                              animate={{ x: [0, 4, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <ArrowRight className="w-5 h-5" />
                            </motion.div>
                          )}
                          {shouldReduceMotion && <ArrowRight className="w-5 h-5" />}
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>

                {/* Footer Ultra Premium */}
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.6 }}
                  className="mt-8 sm:mt-10 md:mt-12 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-ink-muted">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-brand" />
                    <p>
                      Protegido por{" "}
                      <span className="text-brand font-semibold">Golf Fox Security</span>
                    </p>
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-brand opacity-60" />
                  </div>
                </motion.div>

                <noscript>
                  <p className="mt-6 text-xs text-center text-ink-muted">
                    Ative o JavaScript para utilizar o login.
                  </p>
                </noscript>
              </div>
            </motion.div>

            {/* Desktop: No card wrapper */}
            <div className="hidden lg:block relative w-full min-w-0">
              {/* Desktop: Loading overlay estilo Linear premium - ultra minimalista */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl"
                  >
                    {/* Backdrop blur premium estilo Vercel */}
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl" />

                    {/* Conteúdo centralizado ultra minimalista */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      {/* Spinner ultra fino estilo Linear */}
                      <div className="relative w-7 h-7">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full border-[1.5px] border-border-light/60 border-t-[#F97316]"
                        />
                      </div>

                      {/* Texto ultra discreto */}
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-sm font-normal text-ink-muted tracking-tight"
                      >
                        {transitioning ? "Entrando..." : "Autenticando"}
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Título Premium */}
              <motion.div
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8 sm:mb-10 md:mb-12"
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink-strong mb-2 sm:mb-3 tracking-tight">
                  Entrar
                </h1>
                <p className="text-base sm:text-lg text-ink-muted font-light">
                  Acesse sua conta Golf Fox
                </p>
              </motion.div>

              {/* Mensagens Premium */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="mb-6 sm:mb-8 p-4 bg-gradient-to-r from-error-light to-error-light/80 border-2 border-error/20 rounded-2xl text-xs sm:text-sm text-error shadow-sm backdrop-blur-sm"
                    role="alert"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-error flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <p className="flex-1 font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}

                {success && !error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="mb-6 sm:mb-8 p-4 bg-gradient-to-r from-success-light to-success-light/80 border-2 border-success/20 rounded-2xl text-xs sm:text-sm text-success shadow-sm backdrop-blur-sm flex items-center gap-3"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="font-medium">Login realizado com sucesso!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Formulário minimalista */}
              <form
                action={resolvedAuthEndpoint}
                method="post"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!loading && !transitioning) {
                    handleLogin()
                  }
                }}
                className="form-responsive space-y-4 sm:space-y-5 md:space-y-6"
              >
                {/* Campo Email - Desktop Premium */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-ink-strong mb-2" htmlFor="login-email-desktop">
                    E-mail
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-ink-muted">
                      <Mail className="h-5 w-5" />
                    </div>
                    <Input
                      id="login-email-desktop"
                      ref={emailInputRef}
                      name="email"
                      type="email"
                      required
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
                      className={`w-full h-14 pl-12 pr-4 bg-gradient-to-br from-bg-soft to-bg border-2 ${fieldErrors.email
                        ? "border-error focus:border-error focus:ring-2 focus:ring-error/20 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
                        : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20 hover:border-strong"
                        } rounded-2xl text-base focus:bg-white placeholder:text-ink-muted font-medium`}
                    />
                    {fieldErrors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-xs text-error font-medium flex items-center gap-1"
                        aria-live="assertive"
                      >
                        <span>⚠</span> {fieldErrors.email}
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Campo Senha - Desktop Premium */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-ink-strong mb-2" htmlFor="login-password-desktop">
                    Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-ink-muted">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Input
                      id="login-password-desktop"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
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
                      className={`w-full h-14 pl-12 pr-14 bg-gradient-to-br from-bg-soft to-bg border-2 ${fieldErrors.password
                        ? "border-error focus:border-error focus:ring-2 focus:ring-error/20 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
                        : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20 hover:border-strong"
                        } rounded-2xl text-base focus:bg-white placeholder:text-ink-muted font-medium`}
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-brand transition-colors h-9 w-9 flex items-center justify-center rounded-xl hover:bg-bg-hover z-10 touch-manipulation"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </motion.button>
                    {fieldErrors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-xs text-error font-medium flex items-center gap-1"
                        aria-live="assertive"
                      >
                        <span>⚠</span> {fieldErrors.password}
                      </motion.p>
                    )}
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 text-sm w-full"
                >
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 cursor-pointer group touch-manipulation flex-nowrap"
                  >
                    <Checkbox
                      id="remember-me-desktop"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="h-5 w-5 rounded-lg border-2 border-border data-[state=checked]:bg-brand data-[state=checked]:border-brand transition-all duration-200"
                    />
                    <span className="whitespace-nowrap text-ink-muted group-hover:text-ink-strong transition-colors font-medium">
                      Lembrar-me
                    </span>
                  </motion.label>
                  <motion.button
                    type="button"
                    onClick={() => console.log("Forgot password clicked")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-brand hover:text-brand-hover font-semibold transition-colors touch-manipulation text-sm whitespace-nowrap"
                  >
                    Esqueceu a senha?
                  </motion.button>
                </motion.div>

                {/* Botão de Login Ultra Premium - Desktop Otimizado */}
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.5 }}
                  whileHover={!loading && !transitioning ? { scale: 1.02 } : {}}
                  whileTap={!loading && !transitioning ? { scale: 0.98 } : {}}
                >
                  <Button
                    type="submit"
                    disabled={loading || transitioning}
                    className="w-full h-14 bg-gradient-to-r from-brand via-brand-hover to-brand bg-[length:200%_100%] hover:bg-[position:100%_0] text-white font-bold text-base shadow-brand-lg hover:shadow-brand-lg transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none rounded-2xl relative overflow-hidden group touch-manipulation will-change-transform"
                  >
                    {/* Shimmer effect otimizado */}
                    {!shouldReduceMotion && !loading && !transitioning && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent will-change-transform"
                        animate={{
                          x: ['-200%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                    {loading || transitioning ? (
                      <span className="flex items-center justify-center gap-3 relative z-10">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          className="rounded-full h-5 w-5 border-2 border-white/30 border-t-white"
                        />
                        <span className="font-semibold">{transitioning ? "Entrando..." : "Autenticando"}</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-3 relative z-10">
                        <span className="font-bold">Entrar</span>
                        {!shouldReduceMotion && (
                          <motion.div
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <ArrowRight className="w-5 h-5" />
                          </motion.div>
                        )}
                        {shouldReduceMotion && <ArrowRight className="w-5 h-5" />}
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>

              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.6 }}
                className="mt-8 sm:mt-10 md:mt-12 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-ink-muted">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-brand" />
                  <p>
                    Protegido por{" "}
                    <span className="text-brand font-semibold">Golf Fox Security</span>
                  </p>
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-brand opacity-60" />
                </div>
              </motion.div>

              <noscript>
                <p className="mt-6 text-xs text-center text-ink-muted">
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
