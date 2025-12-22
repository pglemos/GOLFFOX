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
 * Hook de autenticação simplificado - usa apenas cookie golffox-session
 * para evitar chamadas de rede que podem travar
 */
export function useAuthSimple() {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Função para carregar usuário do cookie ou storage
        const loadUserFromStorage = () => {
            try {
                // 1. Tentar pegar do cookie golffox-session
                const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
                let userData: any = null

                if (cookieMatch) {
                    try {
                        const decoded = atob(cookieMatch[1])
                        userData = JSON.parse(decoded)
                        console.log('[useAuthSimple] Usuário carregado do cookie')
                    } catch (e) {
                        console.warn('[useAuthSimple] Erro ao decodificar cookie')
                    }
                }

                // 2. Fallback: Tentar pegar do localStorage (golffox-auth)
                if (!userData) {
                    const stored = localStorage.getItem('golffox-auth')
                    if (stored) {
                        try {
                            userData = JSON.parse(stored)
                            console.log('[useAuthSimple] Usuário carregado do localStorage')
                        } catch (e) {
                            console.warn('[useAuthSimple] Erro ao decodificar localStorage')
                        }
                    }
                }

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
                    setUser(null)
                }
            } catch (err) {
                console.error('Erro ao carregar sessão:', err)
                setUser(null)
            }

            setLoading(false)
        }

        // Carregar imediatamente
        loadUserFromStorage()
    }, [])

    return { user, loading }
}
