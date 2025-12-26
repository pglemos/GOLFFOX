'use client'

import { useState, useEffect } from 'react'

import { motion } from "framer-motion"
import { Search, RefreshCw, CheckCircle, AlertCircle, Cookie, Globe, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface DiagnosticoResponse {
  session: {
    cookies: {
      total: number;
      list: Array<{
        name: string;
        hasValue: boolean;
        valueLength: number;
      }>;
      session: {
        exists: boolean;
        hasValue: boolean;
        valueLength: number;
        decoded: any;
      };
      csrf: {
        exists: boolean;
        hasValue: boolean;
      };
    };
    environment: {
      VERCEL?: string;
      VERCEL_ENV?: string;
    };
    url: {
      protocol: string;
      host: string;
    };
    headers: Record<string, string>;
  };
  browser: {
    cookiesEnabled: boolean;
    userAgent: string;
    language: string;
    platform: string;
    cookies: string;
  };
}

export default function DiagnosticoPage() {
  const [resultado, setResultado] = useState<DiagnosticoResponse | null>(null)
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
    } catch (e: unknown) {
      const err = e as { message?: string }
      setErro(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    executarDiagnostico()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-bg via-bg-bg-soft to-bg-bg p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-border shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                <Search className="h-6 w-6 text-brand" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Diagnóstico Completo - GolfFox
                </h1>
                <p className="text-ink-muted">
                  Informações detalhadas sobre cookies, sessão e ambiente
                </p>
              </div>
            </div>

            <Button
              onClick={executarDiagnostico}
              disabled={loading}
              className="mb-6"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Atualizando...' : 'Atualizar Diagnóstico'}
            </Button>

            {erro && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-error-light border border-error-light rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-error" />
                  <p className="text-error font-semibold">Erro:</p>
                </div>
                <p className="text-error">{erro}</p>
              </motion.div>
            )}

            {resultado && (
              <div className="space-y-6">
                {/* Sessão */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-info-light">
                        <Cookie className="h-5 w-5 text-info" />
                      </div>
                      <h2 className="text-xl font-bold">
                        Cookies e Sessão
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold text-ink-strong">Total de cookies:</p>
                        <p className="text-ink-muted">{resultado.session.cookies.total}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-ink-strong">Cookie golffox-session:</p>
                        <div className="mt-2 p-3 bg-bg-soft rounded">
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
                        <p className="font-semibold text-ink-strong">Cookie golffox-csrf:</p>
                        <div className="mt-2 p-3 bg-bg-soft rounded">
                          <p className="text-sm">
                            Existe: {resultado.session.cookies.csrf.exists ? '✅ Sim' : '❌ Não'}
                          </p>
                          <p className="text-sm">
                            Tem valor: {resultado.session.cookies.csrf.hasValue ? '✅ Sim' : '❌ Não'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold text-ink-strong">Lista de todos os cookies:</p>
                        <div className="mt-2 space-y-1">
                          {resultado.session.cookies.list.map((c, i: number) => (
                            <div key={i} className="p-2 bg-bg-soft rounded text-sm">
                              <span className="font-mono">{c.name}</span>
                              {' - '}
                              <span className="text-ink-muted">
                                {c.hasValue ? `${c.valueLength} bytes` : 'vazio'}
                              </span>
                            </div>
                          ))}
                          {resultado.session.cookies.list.length === 0 && (
                            <p className="text-error">❌ Nenhum cookie encontrado!</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Navegador */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
                    <h2 className="text-xl font-bold text-ink-strong mb-4">
                      🌐 Navegador
                    </h2>

                    <div className="space-y-2">
                      <div className="p-3 bg-bg-soft rounded">
                        <p className="font-semibold text-ink-strong">Cookies habilitados:</p>
                        <p className={resultado.browser.cookiesEnabled ? 'text-success' : 'text-error'}>
                          {resultado.browser.cookiesEnabled ? '✅ Sim' : '❌ Não'}
                        </p>
                      </div>

                      <div className="p-3 bg-bg-soft rounded">
                        <p className="font-semibold text-ink-strong">Cookies no document.cookie:</p>
                        <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                          {resultado.browser.cookies}
                        </pre>
                      </div>

                      <div className="p-3 bg-bg-soft rounded">
                        <p className="font-semibold text-ink-strong">User Agent:</p>
                        <p className="text-xs text-ink-muted break-all">{resultado.browser.userAgent}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Ambiente */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
                    <h2 className="text-xl font-bold text-ink-strong mb-4">
                      ⚙️ Ambiente
                    </h2>

                    <div className="space-y-2">
                      <div className="p-3 bg-bg-soft rounded">
                        <p className="font-semibold text-ink-strong">VERCEL:</p>
                        <p className="text-ink-muted">{resultado.session.environment.VERCEL || 'false'}</p>
                      </div>

                      <div className="p-3 bg-bg-soft rounded">
                        <p className="font-semibold text-ink-strong">VERCEL_ENV:</p>
                        <p className="text-ink-muted">{resultado.session.environment.VERCEL_ENV || 'N/A'}</p>
                      </div>

                      <div className="p-3 bg-bg-soft rounded">
                        <p className="font-semibold text-ink-strong">Protocol:</p>
                        <p className="text-ink-muted">{resultado.session.url.protocol}</p>
                      </div>

                      <div className="p-3 bg-bg-soft rounded">
                        <p className="font-semibold text-ink-strong">Host:</p>
                        <p className="text-ink-muted">{resultado.session.url.host}</p>
                      </div>

                      <div className="p-3 bg-bg-soft rounded">
                        <p className="font-semibold text-ink-strong">x-forwarded-proto:</p>
                        <p className="text-ink-muted">
                          {resultado.session.headers['x-forwarded-proto'] || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* JSON Completo */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-muted">
                        <Settings className="h-5 w-5 text-ink-muted" />
                      </div>
                      <h2 className="text-xl font-bold">
                        JSON Completo
                      </h2>
                    </div>
                    <pre className="text-xs bg-ink-strong text-success p-4 rounded overflow-x-auto">
                      {JSON.stringify(resultado, null, 2)}
                    </pre>
                  </Card>
                </motion.div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

