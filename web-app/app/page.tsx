"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Truck, Mail, Lock } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(true)

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
        const userRole = session.user.user_metadata?.role || getUserRoleByEmail(session.user.email)
        router.push(`/${userRole}`)
      }
    })
  }, [router])

  const handleLogin = async (demoEmail?: string, demoPassword?: string) => {
    const loginEmail = demoEmail || email
    const loginPassword = demoPassword || password

    if (!loginEmail || !loginPassword) {
      setError("Por favor, preencha todos os campos")
      return
    }

    setLoading(true)
    setError(null)
    console.log('🔄 Iniciando login...')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) {
        console.error('Erro no login:', error.message)
        throw error
      }

      if (data.session) {
        console.log('✅ Login realizado com sucesso')
        // Redirect to dashboard based on role
        const userRole = data.user.user_metadata?.role || getUserRoleByEmail(data.user.email)
        console.log('🔄 Redirecionando para:', `/${userRole}`)
        
        // Use window.location for more reliable navigation
        if (typeof window !== 'undefined') {
          window.location.href = `/${userRole}`
        } else {
          router.push(`/${userRole}`)
        }
      } else {
        console.warn('Login sem sessão criada')
        setError("Erro na autenticação - sessão não criada")
      }
    } catch (err: any) {
      console.error('Erro no processo de login:', err)
      setError(err.message || "Erro no login - verifique suas credenciais")
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
                <label className="block text-sm font-medium mb-2">Password</label>
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded"
                  />
                  <span>Stay connected</span>
                </label>
                <button className="text-sm text-[var(--brand)] hover:underline">
                  Forgot password
                </button>
              </div>
            </div>

            <Button
              onClick={() => handleLogin()}
              disabled={loading}
              className="w-full mb-6"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="border-t border-[var(--muted)]/20 pt-6">
              <p className="text-sm font-semibold mb-3 text-center">Demo Accounts</p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((account) => (
                  <Button
                    key={account.email}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLogin(account.email, account.password)}
                    className="text-xs"
                  >
                    {account.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-center text-[var(--muted)] mt-3">
                Password: senha123 (all accounts)
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
