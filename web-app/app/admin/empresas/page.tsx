"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Briefcase, Plus, Users, UserPlus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { CreateOperatorModal } from "@/components/modals/create-operator-modal"
import { AssociateOperatorModal } from "@/components/modals/associate-operator-modal"

export default function EmpresasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null)
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [isCreateOperatorModalOpen, setIsCreateOperatorModalOpen] = useState(false)
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false)
  const [selectedCompanyForAssociation, setSelectedCompanyForAssociation] = useState<{ id: string; name: string } | null>(null)

  // Usar hook otimizado para carregar empresas
  // Remover filtro is_active pois a coluna pode não existir
  const { 
    data: empresas = [], 
    loading: loadingEmpresas, 
    error: errorEmpresas 
  } = useSupabaseQuery(
    () => supabase
      .from("companies")
      .select("*")
      .order('created_at', { ascending: false }),
    {
      cacheKey: 'empresas_ativas',
      fallbackValue: []
    }
  )

  useEffect(() => {
    const getUser = async () => {
      try {
        // Primeiro, tentar obter usuário do cookie de sessão customizado
        if (typeof document !== 'undefined') {
          const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
          if (cookieMatch) {
            try {
              const decoded = atob(cookieMatch[1])
              const u = JSON.parse(decoded)
              if (u?.id && u?.email) {
                setUser({ id: u.id, email: u.email, name: u.email.split('@')[0], role: u.role || 'admin' })
                setLoading(false)
                return
              }
            } catch (err) {
              console.warn('⚠️ Erro ao decodificar cookie de sessão:', err)
            }
          }
        }

        // Fallback: tentar sessão do Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Erro ao obter sessão do Supabase:', sessionError)
        }
        
        if (!session) {
          // Sem sessão - deixar o middleware proteger o acesso (não redirecionar aqui para evitar loop)
          console.log('⚠️ Sem sessão detectada - middleware irá proteger acesso')
          setLoading(false)
          return
        }
        
        setUser({ ...session.user })
        setLoading(false)
      } catch (err) {
        console.error('❌ Erro ao obter usuário:', err)
        setLoading(false)
        // Não redirecionar aqui - deixar o middleware proteger
      }
    }
    getUser()
  }, [router])

  const loadFuncionarios = async (empresaId: string) => {
    try {
      const { data, error } = await supabase
        .from("gf_employee_company")
        .select("*")
        .eq("company_id", empresaId)

      if (error) {
        console.error('Erro ao carregar funcionários:', error)
        setFuncionarios([])
        return
      }
      
      setFuncionarios(data || [])
      const empresa = Array.isArray(empresas) ? empresas.find((e: any) => e.id === empresaId) : null
      setSelectedEmpresa(empresa)
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
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

        {errorEmpresas && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Erro ao carregar empresas: {errorEmpresas.message}</p>
          </div>
        )}

        {loadingEmpresas && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-[var(--muted)]">Carregando empresas...</span>
          </div>
        )}

        {!loadingEmpresas && !errorEmpresas && Array.isArray(empresas) && empresas.length === 0 && (
          <Card className="p-8 text-center">
            <Briefcase className="h-12 w-12 text-[var(--muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-[var(--muted)] mb-4">Clique em "Criar Operador" para criar uma nova empresa e operador.</p>
          </Card>
        )}

        <div className="grid gap-4">
          {Array.isArray(empresas) && empresas.map((empresa: any) => (
            <Card key={empresa.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-5 w-5 text-[var(--brand)]" />
                    <h3 className="font-bold text-lg">{empresa.name}</h3>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{empresa.address || 'Sem endereço'}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCompanyForAssociation({ id: empresa.id, name: empresa.name })
                      setIsAssociateModalOpen(true)
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Associar Operador
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      loadFuncionarios(empresa.id)
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Ver Funcionários
                  </Button>
                </div>
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

        {/* Modal Associar Operador */}
        {selectedCompanyForAssociation && (
          <AssociateOperatorModal
            isOpen={isAssociateModalOpen}
            onClose={() => {
              setIsAssociateModalOpen(false)
              setSelectedCompanyForAssociation(null)
            }}
            onSave={() => {
              setIsAssociateModalOpen(false)
              setSelectedCompanyForAssociation(null)
            }}
            companyId={selectedCompanyForAssociation.id}
            companyName={selectedCompanyForAssociation.name}
          />
        )}
      </div>
    </AppShell>
  )
}

