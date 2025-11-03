"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Truck, Mail, Lock } from "lucide-react"
import { motion } from "framer-motion"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Demo accounts
  const demoAccounts = [
    { email: "golffox@admin.com", password: "senha123", role: "admin", label: "Admin" },
    { email: "operador@empresa.com", password: "senha123", role: "operator", label: "Operator" },
    { email: "transportadora@trans.com", password: "senha123", role: "carrier", label: "Carrier" },
    { email: "motorista@trans.com", password: "senha123", role: "driver", label: "Driver" },
    { email: "passageiro@empresa.com", password: "senha123", role: "passenger", label: "Passenger" },
  ]

  // Function to get user role based on email
  const getUserRoleByEmail = (email: string): string => {
    const account = demoAccounts.find(acc => acc.email === email)
    return account?.role || "driver"
  }

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (session) {
        const nextUrl = searchParams.get('next')
        if (nextUrl) {
          // Se há um parâmetro next, redireciona para lá
          router.push(decodeURIComponent(nextUrl))
        } else {
          // Senão, redireciona baseado no role
          const userRole = session.user.user_metadata?.role || getUserRoleByEmail(session.user.email)
          router.push(`/${userRole}`)
        }
      }
    })
  }, [router, searchParams])

  const handleLogin = async (demoEmail?: string, demoPassword?: string) => {
    const loginEmail = demoEmail || email
    const loginPassword = demoPassword || password

    if (!loginEmail || !loginPassword) {
      setError("Por favor, preencha todos os campos")
      return
    }

    setLoading(true)
    setError(null)
    console.log('🔐 Iniciando login para:', loginEmail)

    try {
      // Usar o novo sistema de autenticação
      const { AuthManager } = await import('@/lib/auth')
      const result = await AuthManager.login(loginEmail, loginPassword)

      if (result.success && result.user) {
        console.log('✅ Login bem-sucedido!')
        console.log('👤 Usuário:', result.user.email, 'Role:', result.user.role)

        // Aguardar um pouco para garantir que os cookies sejam salvos
        await new Promise(resolve => setTimeout(resolve, 100))

        // Determinar URL de redirecionamento
        const nextUrl = searchParams.get('next')
        let redirectUrl = '/'

        if (nextUrl) {
          redirectUrl = nextUrl
          console.log('🔄 Redirecionando para URL solicitada:', redirectUrl)
        } else {
          // Redirecionar baseado na role
          redirectUrl = AuthManager.getRedirectUrl(result.user.role)
          console.log('🔄 Redirecionando baseado na role:', redirectUrl)
        }

        // Usar router.push para navegação
        console.log('🚀 Executando redirecionamento...')
        router.push(redirectUrl)
      } else {
        console.error('❌ Erro de login:', result.error)
        setError(result.error || 'Erro no login')
      }
    } catch (err) {
      console.error('💥 Erro inesperado no login:', err)
      setError('Erro inesperado durante o login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--bg)] via-[var(--bg-soft)] to-[var(--bg)]">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 backdrop-blur-xl bg-white/10 border-white/20">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--brand)] flex items-center justify-center">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">GolfFox</h1>
              <p className="text-[var(--muted)]">Transport Management System</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-[var(--err)]/10 border border-[var(--err)] rounded-xl text-sm text-[var(--err)]">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)]" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)]" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={() => handleLogin()}
              disabled={loading}
              className="w-full mb-6"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="space-y-2">
              <p className="text-sm text-[var(--muted)] text-center mb-3">Contas de demonstração:</p>
              <div className="grid grid-cols-1 gap-2">
                {demoAccounts.map((account) => (
                  <Button
                    key={account.email}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLogin(account.email, account.password)}
                    disabled={loading}
                    className="text-xs"
                  >
                    {account.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}