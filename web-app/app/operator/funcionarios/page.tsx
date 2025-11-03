"use client"

import { useEffect, useState } from "react"
// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Button } from "@/components/ui/button"
// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Input } from "@/components/ui/input"
// @ts-ignore
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Search, Mail, Phone, Building } from "lucide-react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import toast from "react-hot-toast"

export default function FuncionariosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadFuncionarios()
    }
    getUser()
  }, [router])

  const loadFuncionarios = async () => {
    try {
      // Buscar funcionários associados à empresa do operador
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single()

      if (userData?.company_id) {
        const { data, error } = await supabase
          .from('gf_employee_company')
          .select(`
            *,
            employee:users!gf_employee_company_employee_id_fkey(id, name, email, phone)
          `)
          .eq('company_id', userData.company_id)

        if (error) throw error
        setFuncionarios(data || [])
      } else {
        // Se não tem company_id, buscar todos os funcionários
        const { data, error } = await supabase
          .from('gf_employee_company')
          .select(`
            *,
            employee:users!gf_employee_company_employee_id_fkey(id, name, email, phone)
          `)

        if (error) throw error
        setFuncionarios(data || [])
      }
    } catch (error: any) {
      console.error("Erro ao carregar funcionários:", error)
      toast.error("Erro ao carregar funcionários")
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  const filteredFuncionarios = funcionarios.filter(f => {
    const employee = f.employee
    if (!employee) return false
    return searchQuery === "" || 
      employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Funcionários</h1>
            <p className="text-[var(--ink-muted)]">Gerencie os funcionários da sua empresa</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Funcionário
          </Button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar funcionários por nome, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-4">
          {filteredFuncionarios.map((funcionario, index) => {
            const employee = funcionario.employee
            return (
              <motion.div
                key={funcionario.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-[var(--brand)]" />
                        <h3 className="font-bold text-lg">{employee?.name || "Nome não disponível"}</h3>
                        <Badge variant="outline">Funcionário</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-[var(--ink-muted)]">
                        {employee?.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{employee.email}</span>
                          </div>
                        )}
                        {employee?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{employee.phone}</span>
                          </div>
                        )}
                        {funcionario.company_id && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <span>Empresa: {funcionario.company_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
          {filteredFuncionarios.length === 0 && (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum funcionário encontrado</h3>
              <p className="text-sm text-[var(--ink-muted)] mb-4">
                {searchQuery ? "Tente ajustar sua busca" : "Comece adicionando funcionários à sua empresa"}
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
