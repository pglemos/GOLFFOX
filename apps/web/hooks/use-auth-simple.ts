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
        // Função para carregar usuário do cookie
        const loadUserFromCookie = () => {
            try {
                // Pegar cookie golffox-session
                const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)

                if (!cookieMatch) {
                    setUser(null)
                    setLoading(false)
                    return
                }

                // Decodificar Base64  
                const decoded = atob(cookieMatch[1])
                const userData = JSON.parse(decoded)

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
                console.error('Erro ao decodificar cookie de sessão:', err)
                setUser(null)
            }

            setLoading(false)
        }

        // Carregar imediatamente (não depende de server)
        loadUserFromCookie()
    }, [])

    return { user, loading }
}
