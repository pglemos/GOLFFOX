'use client'

import { useState } from 'react'

export default function TestLoginPage() {
  const [logs, setLogs] = useState<Array<{ message: string; type: string; time: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, time }])
  }

  const clearLogs = () => {
    setLogs([])
  }

  const testLogin = async () => {
    clearLogs()
    setIsLoading(true)

    const email = 'golffox@admin.com'
    const password = 'senha123'

    try {
      // PASSO 1: Obter CSRF Token
      addLog('🔄 PASSO 1: Obtendo CSRF token...', 'info')
      
      const csrfResponse = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'include'
      })
      
      addLog(`📊 Status: ${csrfResponse.status} ${csrfResponse.statusText}`, 
        csrfResponse.ok ? 'success' : 'error')
      
      if (!csrfResponse.ok) {
        throw new Error(`Falha ao obter CSRF: ${csrfResponse.status}`)
      }
      
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.token
      
      addLog(`✅ CSRF Token obtido: ${csrfToken.substring(0, 30)}...`, 'success')
      
      // Verificar cookies
      const cookies = document.cookie.split(';').map(c => c.trim())
      const csrfCookie = cookies.find(c => c.startsWith('golffox-csrf='))
      addLog(`🍪 Cookie CSRF: ${csrfCookie ? 'Presente' : 'AUSENTE'}`, 
        csrfCookie ? 'success' : 'error')
      
      // PASSO 2: Fazer Login
      addLog('', 'info')
      addLog('🔄 PASSO 2: Fazendo login...', 'info')
      addLog(`📧 Email: ${email}`, 'info')
      
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })
      
      addLog(`📊 Status: ${loginResponse.status} ${loginResponse.statusText}`, 
        loginResponse.ok ? 'success' : 'error')
      
      const loginData = await loginResponse.json()
      
      if (!loginResponse.ok) {
        addLog(`❌ Erro: ${loginData.error || 'Desconhecido'}`, 'error')
        throw new Error(loginData.error || 'Login falhou')
      }
      
      addLog(`✅ Login bem-sucedido!`, 'success')
      addLog(`👤 Usuário: ${loginData.user?.email}`, 'success')
      addLog(`🎭 Role: ${loginData.user?.role}`, 'success')
      
      // Verificar cookie de sessão
      const updatedCookies = document.cookie.split(';').map(c => c.trim())
      const sessionCookie = updatedCookies.find(c => c.startsWith('golffox-session='))
      addLog(`🍪 Cookie de sessão: ${sessionCookie ? 'Criado' : 'AUSENTE'}`, 
        sessionCookie ? 'success' : 'error')
      
      // PASSO 3: Testar acesso ao /admin
      addLog('', 'info')
      addLog('🔄 PASSO 3: Testando acesso ao /admin...', 'info')
      
      setTimeout(async () => {
        try {
          const adminResponse = await fetch('/admin', {
            method: 'GET',
            credentials: 'include',
            redirect: 'manual'
          })
          
          addLog(`📊 Status: ${adminResponse.status} ${adminResponse.statusText}`, 
            adminResponse.ok ? 'success' : 'error')
          
          if (adminResponse.type === 'opaqueredirect' || 
              adminResponse.status === 0 ||
              [301, 302, 307, 308].includes(adminResponse.status)) {
            addLog(`⚠️  REDIRECIONAMENTO detectado!`, 'warning')
            addLog(`❌ PROBLEMA: Middleware está invalidando sessão`, 'error')
            addLog(`💡 Usuário será redirecionado de volta para login`, 'warning')
          } else if (adminResponse.ok || adminResponse.status === 200) {
            addLog(`✅ Acesso ao /admin PERMITIDO!`, 'success')
            addLog(`✅ Usuário vai permanecer na área administrativa`, 'success')
            addLog('', 'info')
            addLog('🎉 TESTE PASSOU! Sistema funcionando!', 'success')
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
              addLog('🚀 Redirecionando para /admin...', 'info')
              window.location.href = '/admin'
            }, 2000)
          } else {
            addLog(`❌ Erro ao acessar /admin: ${adminResponse.status}`, 'error')
          }
        } catch (err: any) {
          addLog(`❌ Erro no PASSO 3: ${err.message}`, 'error')
        }
        
        setIsLoading(false)
      }, 1000)
      
    } catch (err: any) {
      addLog(`❌ ERRO: ${err.message}`, 'error')
      setIsLoading(false)
    }
  }

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 text-green-800 border-green-200'
      case 'error': return 'bg-red-50 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-50 text-blue-800 border-blue-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Teste de Login - GolfFox
          </h1>
          <p className="text-gray-600 mb-8">
            Teste COMPLETO com logs detalhados em tempo real
          </p>

          <div className="mb-6">
            <button
              onClick={testLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? '⏳ Testando...' : '🔐 Fazer Login e Testar'}
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
            <h2 className="font-semibold text-gray-900 mb-4">
              📋 Logs do Teste:
            </h2>
            
            {logs.length === 0 && (
              <p className="text-gray-500 text-center py-12">
                👉 Clique no botão acima para iniciar o teste
              </p>
            )}

            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border font-mono text-sm ${getLogColor(log.type)}`}
                >
                  <span className="text-xs opacity-70">[{log.time}]</span>{' '}
                  {log.message}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-600 space-y-2">
            <p><strong>Credenciais de teste:</strong></p>
            <p>📧 Email: golffox@admin.com</p>
            <p>🔑 Senha: senha123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

