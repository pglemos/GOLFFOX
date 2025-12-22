"use client"

import { useState, useEffect } from 'react'

interface AuthUser {
    id: string
    email: string
    name: string
    role: string
    avatar_url?: string
    companyId?: string
}

/**
 * Hook de autenticação simplificado
 * Tenta carregar dados do localStorage/sessionStorage primeiro (rápido)
 * Se não encontrar, faz chamada à API /api/auth/me (o cookie HttpOnly é enviado automaticamente)
 */
export function useAuthSimple() {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        let timeoutId: NodeJS.Timeout | null = null

        // Função para carregar usuário do storage ou API
        const loadUser = async () => {
            try {
                let userData: any = null

                // 1. Tentar localStorage/sessionStorage primeiro (mais rápido)
                let storedLocal: string | null = null
                let storedSession: string | null = null
                try {
                    storedLocal = typeof window !== 'undefined' ? localStorage.getItem('golffox-auth') : null
                    storedSession = typeof window !== 'undefined' ? sessionStorage.getItem('golffox-auth') : null
                } catch (e) {
                    console.warn('[useAuthSimple] Erro ao acessar storage:', e)
                }
                const stored = storedLocal || storedSession

                if (stored) {
                    try {
                        userData = JSON.parse(stored)
                        // Validar se os dados são válidos
                        if (userData?.id && userData?.email) {
                            console.log(`[useAuthSimple] Usuário carregado do ${storedLocal ? 'localStorage' : 'sessionStorage'}`)
                        } else {
                            console.warn('[useAuthSimple] Dados no storage inválidos, ignorando')
                            userData = null
                        }
                    } catch (e) {
                        console.warn('[useAuthSimple] Erro ao decodificar storage:', e)
                        userData = null
                    }
                }

                // 2. Se não encontrou no storage, chamar API /api/auth/me
                // O cookie HttpOnly golffox-session é enviado automaticamente pelo navegador
                if (!userData?.id || !userData?.email) {
                    console.log('[useAuthSimple] Dados não encontrados no storage, chamando API /api/auth/me...')
                    try {
                        // Timeout de 10 segundos para evitar loading infinito
                        const controller = new AbortController()
                        timeoutId = setTimeout(() => {
                            controller.abort()
                        }, 10000)

                        const response = await fetch('/api/auth/me', {
                            method: 'GET',
                            credentials: 'include', // Importante: enviar cookies
                            headers: {
                                'Accept': 'application/json',
                            },
                            signal: controller.signal,
                        })

                        if (timeoutId) {
                            clearTimeout(timeoutId)
                            timeoutId = null
                        }

                        if (!mounted) return

                        if (response.ok) {
                            const data = await response.json()
                            console.log('[useAuthSimple] Resposta da API:', {
                                success: data.success,
                                hasUser: !!data.user,
                                userId: data.user?.id,
                                role: data.user?.role
                            })
                            if (data.success && data.user) {
                                userData = data.user
                                console.log('[useAuthSimple] ✅ Usuário carregado via API /api/auth/me')

                                // Salvar no storage para próximas cargas serem mais rápidas
                                const safeData = JSON.stringify({
                                    id: userData.id,
                                    email: userData.email,
                                    name: userData.name,
                                    role: userData.role,
                                    avatar_url: userData.avatar_url,
                                    companyId: userData.companyId,
                                })
                                try {
                                    if (typeof window !== 'undefined') {
                                        sessionStorage.setItem('golffox-auth', safeData)
                                    }
                                } catch (e) {
                                    console.warn('[useAuthSimple] Erro ao salvar no sessionStorage:', e)
                                }
                            } else {
                                console.warn('[useAuthSimple] ⚠️ Resposta da API não contém dados válidos:', {
                                    success: data.success,
                                    hasUser: !!data.user,
                                    error: data.error,
                                    message: data.message
                                })
                            }
                        } else {
                            const errorText = await response.text().catch(() => 'Erro desconhecido')
                            let errorJson = null
                            try {
                                errorJson = JSON.parse(errorText)
                            } catch (e) {
                                // Não é JSON, usar texto
                            }
                            console.error('[useAuthSimple] ❌ API /api/auth/me retornou erro:', {
                                status: response.status,
                                statusText: response.statusText,
                                error: errorJson || errorText
                            })
                        }
                    } catch (apiError: any) {
                        if (timeoutId) {
                            clearTimeout(timeoutId)
                            timeoutId = null
                        }
                        if (apiError.name === 'AbortError') {
                            console.error('[useAuthSimple] Timeout ao chamar API /api/auth/me (10s)')
                        } else {
                            console.warn('[useAuthSimple] Erro ao chamar API /api/auth/me:', apiError)
                        }
                    }
                }

                if (!mounted) return

                // 3. Definir estado do usuário
                if (userData?.id && userData?.email) {
                    setUser({
                        id: userData.id,
                        email: userData.email,
                        name: userData.name || userData.email.split('@')[0],
                        role: userData.role || 'user',
                        avatar_url: userData.avatar_url,
                        companyId: userData.companyId || userData.company_id,
                    })
                } else {
                    console.log('[useAuthSimple] Nenhum usuário encontrado')
                    setUser(null)
                }
            } catch (err) {
                console.error('[useAuthSimple] Erro ao carregar sessão:', err)
                if (mounted) {
                    setUser(null)
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        // Carregar imediatamente
        loadUser()

        // Cleanup
        return () => {
            mounted = false
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
        }
    }, [])

    return { user, loading }
}
