/**
 * Gerenciamento de sessão de autenticação
 * Responsável por sincronizar sessão com Supabase e definir cookies HttpOnly
 */

import { debug, warn, error } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

import { storeUserData } from './auth-storage'

import type { UserData, AuthStorageOptions } from './types'

/**
 * Sincroniza a sessão com o Supabase Auth client-side
 */
async function syncSupabaseSession(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  try {
    // ✅ VALIDAÇÃO EXTRA: Verificar se supabase.auth existe e é um objeto válido
    if (!supabase || !supabase.auth || typeof supabase.auth !== 'object') {
      warn('supabase.auth não está disponível, pulando setSession', {}, 'AuthSession')
      return
    }

    // ✅ VALIDAÇÃO: Garantir que setSession é uma função antes de chamar
    const setSessionFn = supabase.auth.setSession

    if (!setSessionFn || typeof setSessionFn !== 'function') {
      warn('supabase.auth.setSession não está disponível ou não é uma função', {
        type: typeof setSessionFn
      }, 'AuthSession')
      return
    }

    // ✅ CORREÇÃO: Verificar se o Supabase está realmente inicializado
    let isReady = false

    if (supabase.auth && typeof supabase.auth.getSession === 'function') {
      try {
        // Tentar obter sessão atual para verificar se está inicializado
        await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 100))
        ])
        isReady = true
      } catch (initCheckErr: unknown) {
        const err = initCheckErr as Error
        const errMessage = err?.message || ''
        if (
          errMessage.includes('initializePromise') ||
          errMessage.includes('undefined') ||
          errMessage === 'timeout'
        ) {
          debug('Supabase ainda inicializando, pulando setSession', {
            error: err?.message
          }, 'AuthSession')
          return
        }
        isReady = true
      }
    } else {
      isReady = true
    }

    if (!isReady) {
      return
    }

    // Aguardar um pouco mais para garantir que o Supabase está totalmente inicializado
    await new Promise(resolve => setTimeout(resolve, 200))

    // ✅ CORREÇÃO: Usar try-catch interno para capturar erros de setSession
    try {
      const result = await setSessionFn({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      if (result?.error) {
        warn('Erro ao sincronizar sessão Supabase', { error: result.error }, 'AuthSession')
      } else {
        debug('Sessão Supabase sincronizada', {}, 'AuthSession')
        // Disparar evento de sincronização concluída
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('golffox:auth:sync', { detail: { success: true } }))
        }
      }
    } catch (setSessionErr: unknown) {
      const err = setSessionErr instanceof Error ? setSessionErr : new Error(String(setSessionErr))
      if (
        err?.message?.includes('initializePromise') ||
        (setSessionErr instanceof Error && setSessionErr?.message?.includes('Cannot read properties of undefined'))
      ) {
        debug('Supabase ainda inicializando durante setSession', {
          error: err?.message
        }, 'AuthSession')
      } else {
        warn('Erro ao chamar setSession', { error: setSessionErr }, 'AuthSession')
      }
    }
  } catch (e) {
    warn('Falha ao setar sessão Supabase', { error: e }, 'AuthSession')
  }
}

/**
 * Define cookie HttpOnly via API server-side (seguro contra XSS)
 */
async function setHttpOnlyCookie(userData: UserData, accessToken: string): Promise<void> {
  try {
    // Obter CSRF token
    const csrfResponse = await fetch('/api/auth/csrf', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store' // Evitar cache do token CSRF
    })

    if (!csrfResponse.ok) {
      throw new Error(`Falha ao obter CSRF token: ${csrfResponse.status}`)
    }

    const csrfData = await csrfResponse.json()
    // A API retorna { success: true, data: { token, csrfToken } }
    const csrfToken =
      csrfData?.data?.token ||
      csrfData?.data?.csrfToken ||
      csrfData.token ||
      csrfData.csrfToken

    if (!csrfToken) {
      throw new Error('CSRF token não encontrado na resposta')
    }

    // Chamar API para definir cookie HttpOnly
    const setSessionResponse = await fetch('/api/auth/set-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken
      },
      credentials: 'include', // ✅ CRÍTICO: Incluir cookies na requisição
      cache: 'no-store',
      body: JSON.stringify({
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          company_id: userData.company_id || null,
          transportadora_id: userData.transportadora_id || null
        },
        access_token: accessToken
      })
    })

    if (!setSessionResponse.ok) {
      const errorData = await setSessionResponse.json().catch(() => ({}))
      const errorMsg =
        errorData.error || `Falha ao definir cookie de sessão: ${setSessionResponse.status}`
      throw new Error(errorMsg)
    }

    debug('[AuthSession] Cookie de sessão definido via API (HttpOnly)', { role: userData.role })
  } catch (cookieErr) {
    error('[AuthSession] Falha ao definir cookie de sessão via API', { error: cookieErr })
    // Não bloquear o fluxo se falhar - o Supabase cookie ainda pode funcionar
  }
}

/**
 * Persiste a sessão do usuário (storage + Supabase + cookie)
 */
export async function persistSession(
  userData: UserData,
  options: AuthStorageOptions = {}
): Promise<void> {
  try {
    debug(
      'Iniciando persistSession',
      {
        hasWindow: typeof window !== 'undefined',
        hasSupabase: !!supabase,
        hasSupabaseAuth: !!supabase?.auth
      },
      'AuthSession'
    )

    if (typeof window === 'undefined') {
      debug('window is undefined, retornando', {}, 'AuthSession')
      return Promise.resolve()
    }

    // ✅ VALIDAÇÃO: Garantir que supabase é um objeto válido
    if (!supabase) {
      warn('supabase não está definido', {}, 'AuthSession')
    } else if (typeof supabase !== 'object' || supabase === null) {
      error('supabase não é um objeto válido', { type: typeof supabase }, 'AuthSession')
    } else if (!supabase.auth) {
      warn('Supabase auth não está disponível, pulando sincronização de sessão', {}, 'AuthSession')
    } else if (typeof supabase.auth !== 'object' || supabase.auth === null) {
      warn('supabase.auth não é um objeto válido', { type: typeof supabase.auth }, 'AuthSession')
    }

    const accessToken = options?.accessToken ?? options?.token ?? userData.accessToken
    const refreshToken = options?.refreshToken ?? userData.refreshToken

    // Sincronizar com Supabase Auth client-side
    if (accessToken && refreshToken) {
      await syncSupabaseSession(accessToken, refreshToken)
    }

    // Armazenar no storage do navegador
    storeUserData(userData, options)

    // Definir cookie HttpOnly via API
    if (accessToken) {
      await setHttpOnlyCookie(userData, accessToken)
    }

    // Disparar evento customizado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('golffox:auth', { detail: userData }))
      debug('[AuthSession] Sessão persistida', { role: userData.role })
    }

    debug('persistSession concluído com sucesso', {}, 'AuthSession')
    return Promise.resolve()
  } catch (err: unknown) {
    const errorObj = err as Error
    error(
      'persistSession - Erro inesperado',
      {
        error: err,
        message: errorObj?.message,
        stack: errorObj?.stack?.substring(0, 500),
        name: errorObj?.name
      },
      'AuthSession'
    )
    // Retornar Promise resolvida mesmo em caso de erro para não quebrar o fluxo
    return Promise.resolve()
  }
}

