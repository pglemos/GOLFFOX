/**
 * Hook useLogin
 * 
 * Encapsula toda a lógica de autenticação da página de login.
 * Extraído de page.tsx para melhor separação de responsabilidades.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from '@/lib/next-navigation'
import { AuthManager } from '@/lib/auth'
import { getUserRoleByEmail } from '@/lib/user-role'
import { normalizeRole } from '@/lib/role-mapper'
import { debug, error as logError, warn as logWarn } from '@/lib/logger'

// Constants
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const DEFAULT_AUTH_ENDPOINT = '/api/auth/login'
const AUTH_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_ENDPOINT ?? DEFAULT_AUTH_ENDPOINT

/**
 * Resolve auth endpoint URL
 */
function resolveAuthEndpoint(raw: string): string {
  const trimmed = (raw || DEFAULT_AUTH_ENDPOINT).trim()
  if (!trimmed) return DEFAULT_AUTH_ENDPOINT
  if (trimmed.startsWith('/')) return trimmed

  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return `/${trimmed.replace(/^\/+/, '')}`
  }

  try {
    const url = new URL(trimmed)
    const isLocalHost =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '0.0.0.0'
    if (typeof window !== 'undefined' && isLocalHost) {
      return `${url.pathname}${url.search}`
    }
    return url.toString()
  } catch {
    return DEFAULT_AUTH_ENDPOINT
  }
}

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (value: string) => value.replace(/[<>"'`;()]/g, '').trim()

/**
 * Sanitize path for redirects
 */
function sanitizePath(raw: string | null): string | null {
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

/**
 * Field validation errors
 */
export interface FieldErrors {
  email?: string
  password?: string
}

/**
 * Login hook state
 */
export interface LoginState {
  email: string
  password: string
  loading: boolean
  error: string | null
  csrfToken: string
  fieldErrors: FieldErrors
  success: boolean
  showPassword: boolean
  rememberMe: boolean
  failedAttempts: number
  blockedUntil: number | null
  transitioning: boolean
}

/**
 * Login hook return type
 */
export interface UseLoginReturn extends LoginState {
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  setShowPassword: (show: boolean) => void
  setRememberMe: (remember: boolean) => void
  handleLogin: (demoEmail?: string, demoPassword?: string) => Promise<void>
  canSubmit: boolean
  resolvedAuthEndpoint: string
  emailInputRef: React.RefObject<HTMLInputElement>
  passwordInputRef: React.RefObject<HTMLInputElement>
}

/**
 * Main login hook
 */
export function useLogin(): UseLoginReturn {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedAuthEndpoint = useMemo(() => resolveAuthEndpoint(AUTH_ENDPOINT), [])

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csrfToken, setCsrfToken] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  // Refs
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const sessionCheckRef = useRef(false)
  const redirectingRef = useRef(false)

  // Computed
  const canSubmit = useMemo(() => !loading && !transitioning, [loading, transitioning])

  // Check existing session on mount
  useEffect(() => {
    if (sessionCheckRef.current) return
    if (typeof window !== 'undefined' && (window as Window & { __golffox_redirecting?: boolean }).__golffox_redirecting) return

    sessionCheckRef.current = true

    const timeoutId = setTimeout(() => {
      try {
        if (typeof window === 'undefined') return

        const hasSessionCookie = document.cookie.includes('golffox-session')
        if (!hasSessionCookie) return
        if (redirectingRef.current) return

        const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
        let userData: { role?: string; email?: string } | null = null

        if (cookieMatch) {
          try {
            const decoded = atob(cookieMatch[1])
            userData = JSON.parse(decoded)
          } catch {
            document.cookie = 'golffox-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }
        }

        if (!userData) {
          const stored = localStorage.getItem('golffox-auth') || sessionStorage.getItem('golffox-auth')
          if (stored) {
            try {
              userData = JSON.parse(stored)
            } catch { /* ignore */ }
          }
        }

        if (!userData?.role) return

        const userRole = userData.role || getUserRoleByEmail(userData.email || '')
        const normalizedRole = normalizeRole(userRole)
        const nextParam = searchParams.get('next')
        const safeNext = sanitizePath(nextParam)

        let redirectUrl =
          normalizedRole === 'admin' ? '/admin' :
            normalizedRole === 'empresa' ? '/empresa' :
              normalizedRole === 'operador' ? '/transportadora' :
                '/empresa'

        const checkPermission = (role: string, path: string): boolean => {
          const norm = normalizeRole(role)
          if (path.startsWith('/admin')) return norm === 'admin'
          if (path.startsWith('/empresa')) return ['admin', 'empresa'].includes(norm)
          if (path.startsWith('/transportadora')) return ['admin', 'operador'].includes(norm)
          return true
        }

        if (safeNext && checkPermission(normalizedRole, safeNext)) {
          redirectUrl = safeNext
        }

        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          if (currentPath === redirectUrl) return
        }

        redirectingRef.current = true
        if (typeof window !== 'undefined') {
          (window as Window & { __golffox_redirecting?: boolean }).__golffox_redirecting = true
        }

        router.push(redirectUrl)
      } catch (err) {
        logError('Erro ao verificar sessão', { error: err }, 'useLogin')
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [router, searchParams])

  // Fetch CSRF token
  useEffect(() => {
    const fetchCsrf = async () => {
      try {
        const res = await fetch('/api/auth/csrf', {
          method: 'GET',
          credentials: 'include'
        })

        if (res.ok) {
          const data = await res.json()
          const token = data?.data?.token || data?.data?.csrfToken || data?.csrfToken || data?.token
          if (token) {
            setCsrfToken(token)
          } else {
            const cookieMatch = document.cookie.match(/golffox-csrf=([^;]+)/)
            if (cookieMatch) setCsrfToken(cookieMatch[1])
          }
        } else {
          const cookieMatch = document.cookie.match(/golffox-csrf=([^;]+)/)
          if (cookieMatch) {
            setCsrfToken(cookieMatch[1])
          } else {
            const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
            document.cookie = `golffox-csrf=${token}; path=/; SameSite=Lax; max-age=900`
            setCsrfToken(token)
          }
        }
      } catch {
        const cookieMatch = document.cookie.match(/golffox-csrf=([^;]+)/)
        if (cookieMatch) {
          setCsrfToken(cookieMatch[1])
        } else {
          const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
          document.cookie = `golffox-csrf=${token}; path=/; SameSite=Lax; max-age=900`
          setCsrfToken(token)
        }
      }
    }
    fetchCsrf()
  }, [])

  // Load/persist login attempts
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('golffox-login-attempts')
      if (raw) {
        const data = JSON.parse(raw)
        if (typeof data?.failedAttempts === 'number') setFailedAttempts(data.failedAttempts)
        if (typeof data?.blockedUntil === 'number') setBlockedUntil(data.blockedUntil)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('golffox-login-attempts', JSON.stringify({ failedAttempts, blockedUntil }))
    } catch { /* ignore */ }
  }, [failedAttempts, blockedUntil])

  /**
   * Handle login submission
   */
  const handleLogin = useCallback(
    async (demoEmail?: string, demoPassword?: string) => {
      const inputEmail = emailInputRef.current?.value || ''
      const inputPassword = passwordInputRef.current?.value || ''

      const rawEmail = demoEmail ?? (inputEmail || email)
      const rawPassword = demoPassword ?? (inputPassword || password)

      const sanitizedEmail = sanitizeInput(rawEmail)
      const sanitizedPassword = rawPassword.trim()

      setFieldErrors({})
      setSuccess(false)

      // Validation
      if (!sanitizedEmail || !sanitizedPassword) {
        setError('Por favor, preencha todos os campos obrigatórios')
        if (!sanitizedEmail) {
          setFieldErrors(prev => ({ ...prev, email: 'Informe o e-mail' }))
          emailInputRef.current?.focus()
        } else {
          setFieldErrors(prev => ({ ...prev, password: 'Informe a senha' }))
          passwordInputRef.current?.focus()
        }
        return
      }

      if (!EMAIL_REGEX.test(sanitizedEmail)) {
        setError('Email inválido')
        setFieldErrors(prev => ({ ...prev, email: 'Utilize um e-mail válido' }))
        emailInputRef.current?.focus()
        return
      }

      // Check if blocked
      const now = Date.now()
      if (blockedUntil && now < blockedUntil) {
        const seconds = Math.ceil((blockedUntil - now) / 1000)
        setError(`Muitas tentativas. Aguarde ${seconds}s antes de tentar novamente.`)
        passwordInputRef.current?.focus()
        return
      }

      // Start loading
      setLoading(true)
      setTransitioning(true)
      setError(null)

      const prevCursor = typeof document !== 'undefined' ? document.body.style.cursor : ''
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'progress'
      }

      const controller = new AbortController()
      const requestTimeoutMs = process.env.NODE_ENV === 'development' ? 60_000 : 15_000
      const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs)
      const maskedEmail = sanitizedEmail.replace(/^(.{2}).+(@.*)$/, '$1***$2')

      try {
        debug('[useLogin] Iniciando autenticação', { email: maskedEmail })

        // Get CSRF token if not available
        let finalCsrfToken = csrfToken
        if (!finalCsrfToken) {
          const cookieMatch = document.cookie.match(/golffox-csrf=([^;]+)/)
          if (cookieMatch) {
            finalCsrfToken = cookieMatch[1]
            setCsrfToken(finalCsrfToken)
          } else {
            try {
              const res = await fetch('/api/auth/csrf', {
                method: 'GET',
                credentials: 'include'
              })
              if (res.ok) {
                const data = await res.json()
                const token = data?.data?.token || data?.data?.csrfToken || data?.csrfToken || data?.token
                if (token) {
                  finalCsrfToken = token
                  setCsrfToken(token)
                }
              }
            } catch { /* ignore */ }
          }
        }

        if (!finalCsrfToken) {
          setError('Erro de segurança. Por favor, recarregue a página.')
          setLoading(false)
          setTransitioning(false)
          if (typeof document !== 'undefined') document.body.style.cursor = prevCursor
          return
        }

        // Make login request
        const response = await fetch(resolvedAuthEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': finalCsrfToken,
          },
          body: JSON.stringify({ email: sanitizedEmail, password: sanitizedPassword }),
          signal: controller.signal,
          credentials: 'include',
        })

        clearTimeout(timeoutId)

        // Handle error response
        if (!response.ok) {
          const apiError = await response.json().catch(() => ({}))
          const message = String(apiError?.error || 'Falha ao autenticar')
          const normalized = message.toLowerCase()
          const code = String(apiError?.code || '')

          logError('LOGIN - Erro na API', { status: response.status, message, code, email: maskedEmail })

          if (normalized.includes('usuário não encontrado') || normalized.includes('não encontrado')) {
            setError('Usuário não encontrado no banco de dados.')
            setFieldErrors(prev => ({ ...prev, email: 'E-mail não cadastrado' }))
          } else if (normalized.includes('inativo')) {
            setError('Usuário inativo. Entre em contato com o administrador.')
          } else if (response.status === 502 || code === 'supabase_unreachable') {
            setError('Não foi possível conectar ao servidor.')
          } else if (normalized.includes('invalid') || normalized.includes('credenciais')) {
            setError('Credenciais inválidas')
            setFieldErrors(prev => ({ ...prev, password: 'E-mail ou senha incorretos' }))
          } else if (normalized.includes('csrf')) {
            setError('Erro de segurança. Por favor, recarregue a página.')
          } else {
            setError(message || 'Erro ao fazer login')
          }

          setLoading(false)
          setTransitioning(false)
          if (typeof document !== 'undefined') document.body.style.cursor = prevCursor
          return
        }

        // Parse successful response
        const data = await response.json()
        const token = data?.token
        const user = data?.user
        const sessionData = data?.session
        const refreshToken = data?.refreshToken ?? sessionData?.refresh_token

        if (!token || !user?.email || !user?.id) {
          setError('Resposta inválida do servidor')
          setLoading(false)
          setTransitioning(false)
          if (typeof document !== 'undefined') document.body.style.cursor = prevCursor
          return
        }

        const userRoleFromDatabase = user.role
        if (!userRoleFromDatabase) {
          setError('Erro ao determinar permissões do usuário')
          setLoading(false)
          setTransitioning(false)
          if (typeof document !== 'undefined') document.body.style.cursor = prevCursor
          return
        }

        // Persist session
        const storageMode = rememberMe ? 'both' : 'session'
        try {
          await AuthManager.persistSession(
            {
              id: user.id,
              email: user.email,
              role: userRoleFromDatabase,
              accessToken: token,
              name: user.name || user.email.split('@')[0],
              avatar_url: user.avatar_url || null,
            },
            { accessToken: token, refreshToken, storage: storageMode }
          )
        } catch (persistError) {
          logError('Erro ao persistir sessão', { error: persistError }, 'useLogin')
        }

        setFailedAttempts(0)
        setBlockedUntil(null)
        setFieldErrors({})
        setSuccess(true)

        // Check if role allows web access
        if (userRoleFromDatabase === 'motorista' || userRoleFromDatabase === 'passageiro') {
          setError(`Seu perfil (${userRoleFromDatabase}) deve acessar o sistema através do aplicativo mobile.`)
          setLoading(false)
          setTransitioning(false)
          if (typeof document !== 'undefined') document.body.style.cursor = prevCursor
          await AuthManager.logout()
          return
        }

        // Determine redirect URL
        const rawNext = searchParams.get('next')
        const safeNext = sanitizePath(rawNext)
        let redirectUrl: string | null = null

        if (safeNext && typeof safeNext === 'string') {
          const checkRolePermission = (role: string, path: string): boolean => {
            if (!role || !path) return false
            if (path.startsWith('/admin')) return role === 'admin'
            if (path.startsWith('/empresa')) return ['admin', 'empresa', 'operador'].includes(role)
            if (path.startsWith('/transportadora')) return ['admin', 'operador', 'transportadora'].includes(role)
            return true
          }

          if (checkRolePermission(userRoleFromDatabase, safeNext)) {
            redirectUrl = safeNext
          } else {
            redirectUrl = AuthManager.getRedirectUrl(userRoleFromDatabase)
          }
        } else {
          redirectUrl = AuthManager.getRedirectUrl(userRoleFromDatabase) || '/empresa'
        }

        if (!redirectUrl) {
          setError(`Seu perfil (${userRoleFromDatabase}) deve acessar o sistema através do aplicativo mobile.`)
          setLoading(false)
          setTransitioning(false)
          if (typeof document !== 'undefined') document.body.style.cursor = prevCursor
          await AuthManager.logout()
          return
        }

        const finalRedirectUrl = redirectUrl.split('?')[0]

        debug('[useLogin] Login bem-sucedido', {
          redirectUrl: finalRedirectUrl,
          email: maskedEmail,
          role: userRoleFromDatabase,
        })

        // Redirect
        if (typeof window !== 'undefined') {
          (window as Window & { __golffox_redirecting?: boolean; __golffox_just_logged_in?: boolean }).__golffox_redirecting = true;
          (window as Window & { __golffox_redirecting?: boolean; __golffox_just_logged_in?: boolean }).__golffox_just_logged_in = true
          window.location.replace(finalRedirectUrl)
        } else {
          router.replace(finalRedirectUrl)
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId)
        const error = err as Error

        if (error?.name === 'AbortError') {
          setError('Tempo limite excedido. Verifique sua conexão.')
        } else {
          setError(`Erro inesperado durante o login: ${error?.message || 'Erro desconhecido'}`)
        }

        setFieldErrors(prev => ({ ...prev, password: 'Não foi possível autenticar' }))
        setPassword('')
        passwordInputRef.current?.focus()

        logError('[useLogin] Erro inesperado', { error })
      } finally {
        if (typeof window !== 'undefined' && !(window as Window & { __golffox_redirecting?: boolean }).__golffox_redirecting) {
          setLoading(false)
          setTimeout(() => setTransitioning(false), 300)
        }
        if (typeof document !== 'undefined') document.body.style.cursor = prevCursor
      }
    },
    [blockedUntil, csrfToken, email, password, router, searchParams, rememberMe, resolvedAuthEndpoint]
  )

  return {
    email,
    password,
    loading,
    error,
    csrfToken,
    fieldErrors,
    success,
    showPassword,
    rememberMe,
    failedAttempts,
    blockedUntil,
    transitioning,
    setEmail,
    setPassword,
    setShowPassword,
    setRememberMe,
    handleLogin,
    canSubmit,
    resolvedAuthEndpoint,
    emailInputRef: emailInputRef as React.RefObject<HTMLInputElement>,
    passwordInputRef: passwordInputRef as React.RefObject<HTMLInputElement>,
  }
}

export default useLogin

