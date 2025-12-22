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
        // Função para carregar usuário do storage ou API
        const loadUser = async () => {
            try {
                let userData: any = null

                // 1. Tentar localStorage/sessionStorage primeiro (mais rápido)
                const storedLocal = localStorage.getItem('golffox-auth')
                const storedSession = sessionStorage.getItem('golffox-auth')
                const stored = storedLocal || storedSession

                if (stored) {
                    try {
                        userData = JSON.parse(stored)
                        console.log(`[useAuthSimple] Usuário carregado do ${storedLocal ? 'localStorage' : 'sessionStorage'}`)
                    } catch (e) {
                        console.warn('[useAuthSimple] Erro ao decodificar storage')
                    }
                }

                // 2. Se não encontrou no storage, chamar API /api/auth/me
                // O cookie HttpOnly golffox-session é enviado automaticamente pelo navegador
                if (!userData?.id || !userData?.email) {
                    console.log('[useAuthSimple] Dados não encontrados no storage, chamando API /api/auth/me...')
                    try {
                        const response = await fetch('/api/auth/me', {
                            method: 'GET',
                            credentials: 'include', // Importante: enviar cookies
                            headers: {
                                'Accept': 'application/json',
                            },
                        })

                        if (response.ok) {
                            const data = await response.json()
                            if (data.success && data.user) {
                                userData = data.user
                                console.log('[useAuthSimple] Usuário carregado via API /api/auth/me')

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
                                    sessionStorage.setItem('golffox-auth', safeData)
                                } catch (e) {
                                    console.warn('[useAuthSimple] Erro ao salvar no sessionStorage')
                                }
                            }
                        } else {
                            console.log('[useAuthSimple] API /api/auth/me retornou status:', response.status)
                        }
                    } catch (apiError) {
                        console.warn('[useAuthSimple] Erro ao chamar API /api/auth/me:', apiError)
                    }
                }

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
                setUser(null)
            }

            setLoading(false)
        }

        // Carregar imediatamente
        loadUser()
    }, [])

    return { user, loading }
}
