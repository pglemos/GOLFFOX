'use client'

import { useState, useEffect } from 'react'

export default function DiagnosticoPage() {
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const executarDiagnostico = async () => {
    setLoading(true)
    setErro(null)
    
    try {
      // 1. Testar sessão atual
      const sessionRes = await fetch('/api/test-session', {
        credentials: 'include'
      })
      const sessionData = await sessionRes.json()
      
      // 2. Obter informações do navegador
      const browserInfo = {
        cookiesEnabled: navigator.cookieEnabled,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookies: document.cookie || '[VAZIO]',
      }
      
      setResultado({
        session: sessionData,
        browser: browserInfo,
      })
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    executarDiagnostico()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Diagnóstico Completo - GolfFox
          </h1>
          <p className="text-gray-600 mb-6">
            Informações detalhadas sobre cookies, sessão e ambiente
          </p>

          <button
            onClick={executarDiagnostico}
            disabled={loading}
            className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Atualizando...' : '🔄 Atualizar Diagnóstico'}
          </button>

          {erro && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">❌ Erro:</p>
              <p className="text-red-600">{erro}</p>
            </div>
          )}

          {resultado && (
            <div className="space-y-6">
              {/* Sessão */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  🍪 Cookies e Sessão
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-700">Total de cookies:</p>
                    <p className="text-gray-600">{resultado.session.cookies.total}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-700">Cookie golffox-session:</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                      <p className="text-sm">
                        Existe: {resultado.session.cookies.session.exists ? '✅ Sim' : '❌ Não'}
                      </p>
                      <p className="text-sm">
                        Tem valor: {resultado.session.cookies.session.hasValue ? '✅ Sim' : '❌ Não'}
                      </p>
                      <p className="text-sm">
                        Tamanho: {resultado.session.cookies.session.valueLength} bytes
                      </p>
                      {resultado.session.cookies.session.decoded && (
                        <div className="mt-2">
                          <p className="text-sm font-semibold">Dados decodificados:</p>
                          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(resultado.session.cookies.session.decoded, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-700">Cookie golffox-csrf:</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                      <p className="text-sm">
                        Existe: {resultado.session.cookies.csrf.exists ? '✅ Sim' : '❌ Não'}
                      </p>
                      <p className="text-sm">
                        Tem valor: {resultado.session.cookies.csrf.hasValue ? '✅ Sim' : '❌ Não'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-700">Lista de todos os cookies:</p>
                    <div className="mt-2 space-y-1">
                      {resultado.session.cookies.list.map((c: any, i: number) => (
                        <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                          <span className="font-mono">{c.name}</span>
                          {' - '}
                          <span className="text-gray-600">
                            {c.hasValue ? `${c.valueLength} bytes` : 'vazio'}
                          </span>
                        </div>
                      ))}
                      {resultado.session.cookies.list.length === 0 && (
                        <p className="text-red-600">❌ Nenhum cookie encontrado!</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navegador */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  🌐 Navegador
                </h2>
                
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-700">Cookies habilitados:</p>
                    <p className={resultado.browser.cookiesEnabled ? 'text-green-600' : 'text-red-600'}>
                      {resultado.browser.cookiesEnabled ? '✅ Sim' : '❌ Não'}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-700">Cookies no document.cookie:</p>
                    <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                      {resultado.browser.cookies}
                    </pre>
                  </div>

                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-700">User Agent:</p>
                    <p className="text-xs text-gray-600 break-all">{resultado.browser.userAgent}</p>
                  </div>
                </div>
              </div>

              {/* Ambiente */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  ⚙️ Ambiente
                </h2>
                
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-700">VERCEL:</p>
                    <p className="text-gray-600">{resultado.session.environment.VERCEL || 'false'}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-700">VERCEL_ENV:</p>
                    <p className="text-gray-600">{resultado.session.environment.VERCEL_ENV || 'N/A'}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-700">Protocol:</p>
                    <p className="text-gray-600">{resultado.session.url.protocol}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-700">Host:</p>
                    <p className="text-gray-600">{resultado.session.url.host}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-700">x-forwarded-proto:</p>
                    <p className="text-gray-600">
                      {resultado.session.headers['x-forwarded-proto'] || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* JSON Completo */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  📄 JSON Completo
                </h2>
                <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
                  {JSON.stringify(resultado, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

