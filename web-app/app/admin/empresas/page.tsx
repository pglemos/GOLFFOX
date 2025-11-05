"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Briefcase, Plus, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { CreateOperatorModal } from "@/components/modals/create-operator-modal"

export default function EmpresasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null)
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [isCreateOperatorModalOpen, setIsCreateOperatorModalOpen] = useState(false)

  // Usar hook otimizado para carregar empresas
  const { 
    data: empresas = [], 
    loading: loadingEmpresas, 
    error: errorEmpresas 
  } = useSupabaseQuery(
    () => supabase
      .from("companies")
      .select("*")
      .eq("is_active", true),
    {
      cacheKey: 'empresas_ativas',
      fallbackValue: []
    }
  )

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
    }
    getUser()
  }, [router])

  const loadFuncionarios = async (empresaId: string) => {
    try {
      const { data, error } = await supabase
        .from("gf_employee_company")
        .select("*")
        .eq("company_id", empresaId)
        .eq("is_active", true)

      if (error) throw error
      setFuncionarios(data || [])
      const empresa = Array.isArray(empresas) ? empresas.find((e: any) => e.id === empresaId) : null
      setSelectedEmpresa(empresa)
    } catch (error) {
      console.log("Erro ao carregar funcionários - usando fallback")
      setFuncionarios([])
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Empresas</h1>
            <p className="text-[var(--muted)]">Gerencie empresas e funcionários</p>
          </div>
          <Button onClick={() => setIsCreateOperatorModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Operador
          </Button>
        </div>

        <div className="grid gap-4">
          {Array.isArray(empresas) && empresas.map((empresa: any) => (
            <Card key={empresa.id} className="p-4 cursor-pointer hover:bg-[var(--bg-soft)]" onClick={() => loadFuncionarios(empresa.id)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-5 w-5 text-[var(--brand)]" />
                    <h3 className="font-bold text-lg">{empresa.name}</h3>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{empresa.address}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Ver Funcionários
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {selectedEmpresa && (
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-4">Funcionários - {selectedEmpresa.name}</h3>
            <div className="space-y-2">
              {funcionarios.map((func) => (
                <div key={func.id} className="p-3 bg-[var(--bg-soft)] rounded-lg">
                  <p className="font-medium">{func.name}</p>
                  <p className="text-sm text-[var(--muted)]">CPF: {func.cpf}</p>
                  <p className="text-sm text-[var(--muted)]">Login: {func.login_cpf}</p>
                  <p className="text-sm text-[var(--muted)]">Endereço: {func.address}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Modal Criar Operador */}
        <CreateOperatorModal
          isOpen={isCreateOperatorModalOpen}
          onClose={() => setIsCreateOperatorModalOpen(false)}
          onSave={() => {
            setIsCreateOperatorModalOpen(false)
            // Recarregar empresas se necessário
            window.location.reload()
          }}
        />
      </div>
    </AppShell>
  )
}

