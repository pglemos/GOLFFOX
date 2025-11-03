"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TestAuth() {
  const [user, setUser] = useState<any>(null)
  const [cookies, setCookies] = useState<string>("")
  const [localStorageValue, setLocalStorageValue] = useState<string>("")

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user || null)
    })

    // Verificar cookies
    if (typeof window !== 'undefined') {
      setCookies(document.cookie)
      setLocalStorageValue(window.localStorage.getItem('golffox-user') || 'Nenhum')
    }
  }, [])

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'golffox@admin.com',
      password: 'senha123'
    })

    if (error) {
      console.error('Erro:', error)
    } else {
      console.log('Login bem-sucedido:', data)
      setUser(data.user)
      
      // Salvar dados
      if (typeof window !== 'undefined') {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          role: 'admin',
          accessToken: data.session.access_token
        }
        window.localStorage.setItem('golffox-user', JSON.stringify(userData))
        
        const cookieOptions = 'path=/; max-age=3600; SameSite=Lax'
        document.cookie = `golffox-auth=${data.session.access_token}; ${cookieOptions}`
        document.cookie = `golffox-user=${JSON.stringify(userData)}; ${cookieOptions}`
        
        // Atualizar estado
        setCookies(document.cookie)
        setLocalStorageValue(JSON.stringify(userData))
      }
    }
  }

  const testRedirect = () => {
    window.location.href = '/admin'
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Autenticação</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Usuário Atual:</h2>
        <pre className="bg-gray-100 p-2 rounded">
          {user ? JSON.stringify(user, null, 2) : 'Não logado'}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Cookies:</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {cookies || 'Nenhum cookie'}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">LocalStorage:</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {localStorageValue}
        </pre>
      </div>

      <div className="space-x-4">
        <button 
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Fazer Login
        </button>
        
        <button 
          onClick={testRedirect}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Testar Redirecionamento para /admin
        </button>
      </div>
    </div>
  )
}
